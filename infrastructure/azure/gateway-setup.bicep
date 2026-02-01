@description('Azure location for all resources')
param location string = resourceGroup().location

@description('Environment name for resource naming')
param environment string = 'prod'

@description('Gateway subnet ID')
param gatewaySubnetId string

@description('Production subnet ID')
param prodSubnetId string

@description('Gateway NSG ID')
param gatewayNsgId string

@description('Key Vault name')
param keyVaultName string

@description('Key Vault URI')
param keyVaultUri string

@description('SSL certificate ID')
param certificateId string

@description('Docker image tag')
param imageTag string = 'latest'

@description('VM ID for deployment')
param vmId string

// Container Registry
resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-01-01-preview' = {
  name: 'cr${uniqueString(resourceGroup().id)}${environment}'
  location: location
  resourceGroup: resourceGroup().name
  sku: {
    name: 'Premium'
    tier: 'Premium'
  }
  properties: {
    adminUserEnabled: false
    networkRuleSet: {
      defaultAction: 'Deny'
      ipRules: []
      virtualNetworkRules: [
        {
          virtualNetworkResourceId: gatewaySubnetId
          action: 'Allow'
        }
      ]
    }
    encryption: {
      status: 'enabled'
      keyVaultProperties: {
        keyIdentifier: '' // Will be set when Key Vault key is created
      }
    }
    retentionPolicy: {
      days: 30
      enabled: true
    }
    trustPolicy: {
      status: 'enabled'
      type: 'Notary'
    }
  }
}

// Private Endpoint for Container Registry
resource crPrivateEndpoint 'Microsoft.Network/privateEndpoints@2023-05-01' = {
  name: 'pe-${containerRegistry.name}'
  location: location
  resourceGroup: resourceGroup().name
  properties: {
    subnet: {
      id: gatewaySubnetId
    }
    privateLinkServiceConnections: [
      {
        name: 'cr-connection'
        properties: {
          privateLinkServiceId: containerRegistry.id
          groupIds: [
            'registry'
          ]
        }
      }
    ]
  }
}

// Private DNS Zone for Container Registry
resource crPrivateDnsZone 'Microsoft.Network/privateDnsZones@2023-05-01' = {
  name: 'privatelink.azurecr.io'
  location: location
  resourceGroup: resourceGroup().name
  properties: {}
}

// DNS Zone Link for Container Registry
resource crDnsZoneLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2023-05-01' = {
  name: 'cr-dns-link-${environment}'
  parent: crPrivateDnsZone
  properties: {
    virtualNetwork: {
      id: split(gatewaySubnetId, '/subnets/')[0]
    }
    registrationEnabled: false
  }
}

// Network Interface for Gateway VM
resource gatewayNic 'Microsoft.Network/networkInterfaces@2023-05-01' = {
  name: 'nic-gateway-${environment}'
  location: location
  resourceGroup: resourceGroup().name
  properties: {
    ipConfigurations: [
      {
        name: 'ipconfig1'
        properties: {
          privateIPAllocationMethod: 'Dynamic'
          subnet: {
            id: gatewaySubnetId
          }
          primary: true
        }
      }
    ]
    enableAcceleratedNetworking: true
    enableIPForwarding: false
  }
}

// Gateway Virtual Machine
resource gatewayVm 'Microsoft.Compute/virtualMachines@2023-03-01' = {
  name: 'vm-gateway-${environment}'
  location: location
  resourceGroup: resourceGroup().name
  properties: {
    hardwareProfile: {
      vmSize: 'Standard_B2s'
    }
    storageProfile: {
      osDisk: {
        createOption: 'FromImage'
        managedDisk: {
          storageAccountType: 'Premium_LRS'
        }
        osType: 'Linux'
      }
      imageReference: {
        publisher: 'Canonical'
        offer: '0001-com-ubuntu-server-focal'
        sku: '20_04-lts-gen2'
        version: 'latest'
      }
    }
    osProfile: {
      computerName: 'gateway-vm-${environment}'
      adminUsername: 'azureuser'
      linuxConfiguration: {
        disablePasswordAuthentication: true
        ssh: {
          publicKeys: [
            {
              path: '/home/azureuser/.ssh/authorized_keys'
              keyData: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC7...' // Replace with actual key
            }
          ]
        }
      }
      customData: base64(concat('#cloud-config\n', '''
package_update: true
package_upgrade: true
packages:
  - docker.io
  - docker-compose
  - nginx
  - certbot
  - python3-certbot-nginx
  - jq
  - curl
  - wget
  - git
  - unzip
runcmd:
  # Configure Docker
  - systemctl enable docker
  - systemctl start docker
  - usermod -aG docker azureuser
  
  # Create directories
  - mkdir -p /opt/gateway
  - mkdir -p /opt/gateway/nginx
  - mkdir -p /opt/gateway/certs
  - mkdir -p /opt/gateway/logs
  - mkdir -p /opt/gateway/scripts
  - chmod 750 /opt/gateway
  - chown azureuser:azureuser /opt/gateway
  
  # Download and setup application
  - cd /opt/gateway
  - wget https://raw.githubusercontent.com/microsoft/azure-pipelines-agent/master/README.md -O /tmp/readme.md || true
  
  # Setup log rotation
  - echo '/opt/gateway/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 azureuser azureuser
  }' > /etc/logrotate.d/gateway
  
  # Create monitoring script
  - echo '#!/bin/bash
# Gateway monitoring script
LOG_FILE="/opt/gateway/logs/gateway_monitor.log"
DATE=$(date "+%Y-%m-%d %H:%M:%S")

# Check NGINX status
if ! systemctl is-active --quiet nginx; then
    echo "$DATE CRITICAL: NGINX is not running" >> $LOG_FILE
    systemctl restart nginx || echo "$DATE ERROR: Failed to restart NGINX" >> $LOG_FILE
fi

# Check Docker status
if ! systemctl is-active --quiet docker; then
    echo "$DATE CRITICAL: Docker is not running" >> $LOG_FILE
    systemctl restart docker || echo "$DATE ERROR: Failed to restart Docker" >> $LOG_FILE
fi

# Check SSL certificate expiry
if [ -f "/opt/gateway/certs/cert.pem" ]; then
    EXPIRY=$(openssl x509 -enddate -noout -in /opt/gateway/certs/cert.pem | cut -d= -f2)
    EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s)
    CURRENT_EPOCH=$(date +%s)
    DAYS_LEFT=$(( ($EXPIRY_EPOCH - $CURRENT_EPOCH) / 86400 ))
    
    if [ $DAYS_LEFT -lt 30 ]; then
        echo "$DATE WARNING: SSL certificate expires in $DAYS_LEFT days" >> $LOG_FILE
    fi
fi

# Check disk usage
DISK_USAGE=$(df / | tail -1 | awk "{print \$5}" | sed "s/%//")
if [ $DISK_USAGE -gt 80 ]; then
    echo "$DATE WARNING: Disk usage at $DISK_USAGE%" >> $LOG_FILE
fi

# Check memory usage
MEM_USAGE=$(free | grep Mem | awk "{printf \"%.2f\", \$3/\$2 * 100.0}")
if (( $(echo "$MEM_USAGE > 80" | bc -l) )); then
    echo "$DATE WARNING: Memory usage at $MEM_USAGE%" >> $LOG_FILE
fi

echo "$DATE INFO: Gateway monitoring completed" >> $LOG_FILE
' > /opt/gateway/gateway_monitor.sh
  - chmod +x /opt/gateway/gateway_monitor.sh
  
  # Add to crontab
  - (crontab -l 2>/dev/null; echo "*/5 * * * * /opt/gateway/gateway_monitor.sh") | crontab -
  '''))
    }
    networkProfile: {
      networkInterfaces: [
        {
          id: gatewayNic.id
        }
      ]
    }
  }
}

// VM Extension for Docker setup
resource dockerExtension 'Microsoft.Compute/virtualMachines/extensions@2023-03-01' = {
  name: 'DockerExtension'
  parent: gatewayVm
  location: location
  properties: {
    publisher: 'Microsoft.Azure.Extensions'
    type: 'DockerExtension'
    typeHandlerVersion: '1.0'
    autoUpgradeMinorVersion: true
    settings: {}
  }
}

// NGINX Configuration
resource nginxConfig 'Microsoft.Resources/deployments@2021-04-01' = {
  name: 'nginx-config-deployment'
  properties: {
    mode: 'Incremental'
    template: {
      '$schema': 'https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#'
      contentVersion: '1.0.0.0'
      resources: [
        {
          type: 'Microsoft.Compute/virtualMachines/extensions'
          apiVersion: '2023-03-01'
          name: 'nginx-config'
          properties: {
            publisher: 'Microsoft.Azure.Extensions'
            type: 'CustomScript'
            typeHandlerVersion: '2.1'
            autoUpgradeMinorVersion: true
            settings: {
              commandToExecute: 'bash -c "curl -s https://raw.githubusercontent.com/advancia/advancia-payledger/main/infrastructure/scripts/setup-nginx.sh | bash"'
            }
          }
        }
      ]
    }
  }
}

// Container App for Gateway Service
resource gatewayContainerApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'ca-gateway-${environment}'
  location: location
  resourceGroup: resourceGroup().name
  properties: {
    managedEnvironmentId: '' // Will be set when Container App Environment is created
    configuration: {
      ingress: {
        external: true
        targetPort: 80
        traffic: [
          {
            weight: 100
            latestRevision: true
          }
        ]
        transport: 'Http'
        customDomains: [
          {
            name: 'advancia-${environment}.azurewebsites.net'
            bindingType: 'Disabled'
            certificateId: certificateId
          }
        ]
        ipSecurityRestrictions: [
          {
            ipAddressRange: '0.0.0.0/0'
            action: 'Allow'
            description: 'Allow all traffic (will be restricted by NSG)'
          }
        ]
        clientCertificateMode: 'Require'
        corsPolicy: {
          allowedOrigins: [
            'https://advancia-${environment}.azurewebsites.net'
          ]
          allowCredentials: true
          maxAge: 86400
        }
      }
      dapr: {
        enabled: false
      }
      maxInactiveRevisions: 10
      minReplicas: 2
      maxReplicas: 10
      secrets: [
        {
          name: 'jwt-secret'
          value: '' // Will be retrieved from Key Vault
        }
        {
          name: 'keyvault-uri'
          value: keyVaultUri
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'gateway'
          image: '${containerRegistry.name}/gateway:${imageTag}'
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            {
              name: 'JWT_SECRET'
              secretRef: 'jwt-secret'
            }
            {
              name: 'KEYVAULT_URI'
              value: keyVaultUri
            }
            {
              name: 'ENVIRONMENT'
              value: environment
            }
            {
              name: 'LOG_LEVEL'
              value: 'info'
            }
          ]
          volumeMounts: [
            {
              name: 'config'
              mountPath: '/etc/nginx/conf.d'
            }
            {
              name: 'certs'
              mountPath: '/etc/ssl/certs'
            }
            {
              name: 'logs'
              mountPath: '/var/log/nginx'
            }
          ]
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/health'
                port: 80
              }
              initialDelaySeconds: 30
              periodSeconds: 10
              timeoutSeconds: 5
              failureThreshold: 3
            }
            {
              type: 'Readiness'
              httpGet: {
                path: '/ready'
                port: 80
              }
              initialDelaySeconds: 5
              periodSeconds: 5
              timeoutSeconds: 3
              failureThreshold: 3
            }
          ]
        }
      ]
      scale: {
        minReplicas: 2
        maxReplicas: 10
        rules: [
          {
            name: 'http-scaling'
            custom: {
              type: 'http'
              metadata: {
                concurrentRequests: '100'
              }
            }
          }
        ]
      }
      volumes: [
        {
          name: 'config'
          storageType: 'AzureFile'
          azureFile: {
            shareName: 'gateway-config'
            storageAccountName: '' // Will be set when storage account is created
            storageAccountKey: '' // Will be retrieved from Key Vault
          }
        }
        {
          name: 'certs'
          storageType: 'AzureFile'
          azureFile: {
            shareName: 'gateway-certs'
            storageAccountName: '' // Will be set when storage account is created
            storageAccountKey: '' // Will be retrieved from Key Vault
          }
        }
        {
          name: 'logs'
          storageType: 'AzureFile'
          azureFile: {
            shareName: 'gateway-logs'
            storageAccountName: '' // Will be set when storage account is created
            storageAccountKey: '' // Will be retrieved from Key Vault
          }
        }
      ]
    }
  }
}

// Storage Account for Gateway Files
resource gatewayStorage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: 'stgw${uniqueString(resourceGroup().id)}${environment}'
  location: location
  resourceGroup: resourceGroup().name
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    allowSharedKeyAccess: false
    networkAcls: {
      defaultAction: 'Deny'
      bypass: 'AzureServices'
      virtualNetworkRules: [
        {
          virtualNetworkResourceId: gatewaySubnetId
          action: 'Allow'
        }
      ]
    }
    encryption: {
      services: {
        blob: {
          enabled: true
        }
        file: {
          enabled: true
        }
      }
      keySource: 'Microsoft.Storage'
    }
    accessTier: 'Hot'
  }
}

// File Shares for Gateway
resource configShare 'Microsoft.Storage/storageAccounts/fileServices/fileShares@2023-01-01' = {
  name: 'gateway-config'
  parent: gatewayStorage
  properties: {
    shareQuota: 1
    enabledProtocols: 'SMB'
    rootSquash: 'AllSquash'
  }
}

resource certsShare 'Microsoft.Storage/storageAccounts/fileServices/fileShares@2023-01-01' = {
  name: 'gateway-certs'
  parent: gatewayStorage
  properties: {
    shareQuota: 1
    enabledProtocols: 'SMB'
    rootSquash: 'AllSquash'
  }
}

resource logsShare 'Microsoft.Storage/storageAccounts/fileServices/fileShares@2023-01-01' = {
  name: 'gateway-logs'
  parent: gatewayStorage
  properties: {
    shareQuota: 5
    enabledProtocols: 'SMB'
    rootSquash: 'AllSquash'
  }
}

// Application Gateway for Load Balancing (optional, for high availability)
resource appGateway 'Microsoft.Network/applicationGateways@2023-05-01' = {
  name: 'agw-gateway-${environment}'
  location: location
  resourceGroup: resourceGroup().name
  sku: {
    name: 'WAF_v2'
    tier: 'WAF_v2'
    capacity: 2
  }
  properties: {
    firewallPolicy: {
      id: '' // Will be set when WAF policy is created
    }
    gatewayIPConfigurations: [
      {
        name: 'gateway-ip-config'
        properties: {
          subnet: {
            id: gatewaySubnetId
          }
        }
      }
    ]
    frontendIPConfigurations: [
      {
        name: 'frontend-ip-config'
        properties: {
          PublicIPAddress: {
            id: '' // Will be set when Public IP is created
          }
        }
      }
    ]
    frontendPorts: [
      {
        name: 'frontend-port'
        properties: {
          port: 443
        }
      }
    ]
    backendAddressPools: [
      {
        name: 'backend-pool'
        properties: {
          backendAddresses: [
            {
              ipAddress: '' // Will be set with Container App IP
            }
          ]
        }
      }
    ]
    backendHttpSettingsCollection: [
      {
        name: 'backend-http-settings'
        properties: {
          port: 80
          protocol: 'Http'
          cookieBasedAffinity: 'Disabled'
          requestTimeout: 30
          probe: {
            id: '' // Will be set with health probe
          }
        }
      }
    ]
    httpListeners: [
      {
        name: 'http-listener'
        properties: {
          frontendIPConfiguration: {
            id: '' // Will be set with frontend IP config
          }
          frontendPort: {
            id: '' // Will be set with frontend port
          }
          protocol: 'Https'
          sslCertificate: {
            id: '' // Will be set with SSL certificate
          }
          hostName: 'advancia-${environment}.azurewebsites.net'
          requireServerNameIndication: true
        }
      }
    ]
    requestRoutingRules: [
      {
        name: 'routing-rule'
        properties: {
          ruleType: 'Basic'
          httpListener: {
            id: '' // Will be set with HTTP listener
          }
          backendAddressPool: {
            id: '' // Will be set with backend pool
          }
          backendHttpSettings: {
            id: '' // Will be set with backend HTTP settings
          }
        }
      }
    ]
    enableHttp2: true
    enableFips: true
  }
}

// WAF Policy
resource wafPolicy 'Microsoft.Network/ApplicationGatewayWebApplicationFirewallPolicies@2023-05-01' = {
  name: 'waf-policy-${environment}'
  location: location
  resourceGroup: resourceGroup().name
  properties: {
    policySettings: {
      state: 'Enabled'
      mode: 'Prevention'
      requestBodyCheck: 'Enabled'
      fileUploadLimitInMb: 100
      maxRequestBodySizeInKb: 128
    }
    managedRules: {
      managedRuleSets: [
        {
          ruleSetType: 'OWASP'
          ruleSetVersion: '3.2'
          ruleGroupOverrides: [
            {
              ruleGroupName: 'REQUEST-942-APPLICATION-ATTACK-SQLI'
              rules: [
                {
                  ruleId: 942100
                  state: 'Disabled'
                  action: 'Allow'
                }
              ]
            }
          ]
        }
      ]
    }
  }
}

// Outputs
output gatewayUrl string = 'https://advancia-${environment}.azurewebsites.net'
output containerRegistryId string = containerRegistry.id
output gatewayVmId string = gatewayVm.id
output containerAppId string = gatewayContainerApp.id
output appGatewayId string = appGateway.id
output storageAccountId string = gatewayStorage.id
