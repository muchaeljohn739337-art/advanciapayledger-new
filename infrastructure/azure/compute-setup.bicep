@description('Azure location for all resources')
param location string = resourceGroup().location

@description('Environment name for resource naming')
param environment string = 'prod'

@description('VM size')
param vmSize string = 'Standard_B2s'

@description('Admin username')
param adminUsername string = 'azureuser'

@description('SSH public key for VM access')
param sshPublicKey string

@description('Production subnet ID')
param prodSubnetId string

@description('VM managed identity ID')
param vmIdentityId string

@description('Key Vault name')
param keyVaultName string

@description('Log Analytics Workspace ID')
param logAnalyticsWorkspaceId string

// Storage Account for boot diagnostics
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: 'st${uniqueString(resourceGroup().id)}${environment}'
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
      virtualNetworkRules: []
      ipRules: []
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

// Network Interface for Production VM
resource prodNic 'Microsoft.Network/networkInterfaces@2023-05-01' = {
  name: 'nic-prod-vm-${environment}'
  location: location
  resourceGroup: resourceGroup().name
  properties: {
    ipConfigurations: [
      {
        name: 'ipconfig1'
        properties: {
          privateIPAllocationMethod: 'Dynamic'
          subnet: {
            id: prodSubnetId
          }
          primary: true
        }
      }
    ]
    enableAcceleratedNetworking: true
    enableIPForwarding: false
    networkSecurityGroup: {
      // Will be associated with subnet NSG
    }
  }
}

// Production Virtual Machine
resource prodVm 'Microsoft.Compute/virtualMachines@2023-03-01' = {
  name: 'vm-prod-${environment}'
  location: location
  resourceGroup: resourceGroup().name
  properties: {
    hardwareProfile: {
      vmSize: vmSize
    }
    storageProfile: {
      osDisk: {
        createOption: 'FromImage'
        managedDisk: {
          storageAccountType: 'Premium_LRS'
          diskEncryptionSet: {
            // Will be set if using encryption
          }
        }
        osType: 'Linux'
      }
      imageReference: {
        publisher: 'Canonical'
        offer: '0001-com-ubuntu-server-focal'
        sku: '20_04-lts-gen2'
        version: 'latest'
      }
      dataDisks: [
        {
          lun: 0
          createOption: 'Empty'
          caching: 'ReadWrite'
          managedDisk: {
            storageAccountType: 'Premium_LRS'
            diskSizeGB: 128
          }
        }
      ]
    }
    osProfile: {
      computerName: 'prod-vm-${environment}'
      adminUsername: adminUsername
      linuxConfiguration: {
        disablePasswordAuthentication: true
        ssh: {
          publicKeys: [
            {
              path: '/home/${adminUsername}/.ssh/authorized_keys'
              keyData: sshPublicKey
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
  - ufw
  - fail2ban
  - auditd
  - rsyslog
  - unattended-upgrades
  - curl
  - wget
  - git
  - htop
  - iotop
  - net-tools
  - sysstat
runcmd:
  # Harden SSH configuration
  - sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
  - sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
  - sed -i 's/#PermitEmptyPasswords no/PermitEmptyPasswords no/' /etc/ssh/sshd_config
  - sed -i 's/#X11Forwarding yes/X11Forwarding no/' /etc/ssh/sshd_config
  - sed -i 's/#MaxAuthTries 6/MaxAuthTries 3/' /etc/ssh/sshd_config
  - sed -i 's/#ClientAliveInterval 0/ClientAliveInterval 300/' /etc/ssh/sshd_config
  - sed -i 's/#ClientAliveCountMax 3/ClientAliveCountMax 2/' /etc/ssh/sshd_config
  - systemctl restart sshd
  
  # Configure UFW firewall
  - ufw --force reset
  - ufw default deny incoming
  - ufw default allow outgoing
  - ufw allow from 10.0.1.0/24 to any port 22 proto tcp comment 'SSH from Gateway'
  - ufw allow from 10.0.1.0/24 to any port 3000-3010 proto tcp comment 'App traffic from Gateway'
  - ufw --force enable
  
  # Configure fail2ban
  - cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
  - sed -i 's/bantime = 10m/bantime = 1h/' /etc/fail2ban/jail.local
  - sed -i 's/findtime = 10m/findtime = 30m/' /etc/fail2ban/jail.local
  - sed -i 's/maxretry = 5/maxretry = 3/' /etc/fail2ban/jail.local
  - systemctl enable fail2ban
  - systemctl start fail2ban
  
  # Configure auditd
  - sed -i 's/^-a always,exit -F arch=b64 -S execve/-a always,exit -F arch=b64 -S execve -k exec/' /etc/audit/rules.d/audit.rules
  - augenrules --load
  - systemctl enable auditd
  - systemctl start auditd
  
  # Configure unattended upgrades
  - echo 'Unattended-Upgrade::Automatic-Reboot "false";' >> /etc/apt/apt.conf.d/50unattended-upgrades
  - echo 'Unattended-Upgrade::Remove-Unused-Dependencies "true";' >> /etc/apt/apt.conf.d/50unattended-upgrades
  - echo 'Unattended-Upgrade::Automatic-Reboot-Time "02:00";' >> /etc/apt/apt.conf.d/50unattended-upgrades
  - dpkg-reconfigure -f noninteractive unattended-upgrades
  - systemctl enable unattended-upgrades
  - systemctl start unattended-upgrades
  
  # Harden kernel parameters
  - echo 'net.ipv4.ip_forward = 0' >> /etc/sysctl.conf
  - echo 'net.ipv4.conf.all.send_redirects = 0' >> /etc/sysctl.conf
  - echo 'net.ipv4.conf.default.send_redirects = 0' >> /etc/sysctl.conf
  - echo 'net.ipv4.conf.all.accept_source_route = 0' >> /etc/sysctl.conf
  - echo 'net.ipv4.conf.default.accept_source_route = 0' >> /etc/sysctl.conf
  - echo 'net.ipv4.conf.all.accept_redirects = 0' >> /etc/sysctl.conf
  - echo 'net.ipv4.conf.default.accept_redirects = 0' >> /etc/sysctl.conf
  - echo 'net.ipv4.conf.all.secure_redirects = 0' >> /etc/sysctl.conf
  - echo 'net.ipv4.conf.default.secure_redirects = 0' >> /etc/sysctl.conf
  - echo 'net.ipv4.conf.all.log_martians = 1' >> /etc/sysctl.conf
  - echo 'net.ipv4.conf.default.log_martians = 1' >> /etc/sysctl.conf
  - echo 'net.ipv4.icmp_echo_ignore_broadcasts = 1' >> /etc/sysctl.conf
  - echo 'net.ipv4.icmp_ignore_bogus_error_responses = 1' >> /etc/sysctl.conf
  - echo 'net.ipv4.tcp_syncookies = 1' >> /etc/sysctl.conf
  - echo 'net.ipv4.conf.all.rp_filter = 1' >> /etc/sysctl.conf
  - echo 'net.ipv4.conf.default.rp_filter = 1' >> /etc/sysctl.conf
  - sysctl -p
  
  # Configure Docker security
  - mkdir -p /etc/docker
  - echo '{"log-driver": "json-file", "log-opts": {"max-size": "10m", "max-file": "3"}, "storage-driver": "overlay2", "storage-opts": ["overlay2.override_kernel_check=true"], "default-ulimits": {"nofile": {"Name": "nofile", "Hard": 64000, "Soft": 64000}}, "userland-proxy": false, "experimental": false, "live-restore": true}' > /etc/docker/daemon.json
  - systemctl enable docker
  - systemctl start docker
  
  # Create application directory
  - mkdir -p /opt/advancia
  - mkdir -p /opt/advancia/logs
  - mkdir -p /opt/advancia/data
  - mkdir -p /opt/advancia/backups
  - chmod 750 /opt/advancia
  - chown azureuser:azureuser /opt/advancia
  
  # Setup log rotation
  - echo '/opt/advancia/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 azureuser azureuser
    postrotate
      systemctl reload rsyslog || true
    endscript
  }' > /etc/logrotate.d/advancia
  
  # Install monitoring agent
  - wget https://raw.githubusercontent.com/microsoft/OMS-Agent-for-Linux/master/installer/scripts/onboard_agent.sh -O onboard_agent.sh
  - chmod +x onboard_agent.sh
  - ./onboard_agent.sh -w ${logAnalyticsWorkspaceId} -s ${keyVaultName}
  
  # Create security monitoring script
  - echo '#!/bin/bash
# Security monitoring script
LOG_FILE="/opt/advancia/logs/security_monitor.log"
DATE=$(date "+%Y-%m-%d %H:%M:%S")

# Check for failed SSH attempts
FAILED_SSH=$(grep "Failed password" /var/log/auth.log | grep "$DATE" | wc -l)
if [ $FAILED_SSH -gt 0 ]; then
    echo "$DATE WARNING: $FAILED_SSH failed SSH attempts detected" >> $LOG_FILE
fi

# Check for suspicious processes
SUSPICIOUS_PROCS=$(ps aux | grep -E "(nc|netcat|nmap|tcpdump)" | grep -v grep | wc -l)
if [ $SUSPICIOUS_PROCS -gt 0 ]; then
    echo "$DATE WARNING: $SUSPICIOUS_PROCS suspicious processes detected" >> $LOG_FILE
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

# Check Docker containers
DOCKER_CONTAINERS=$(docker ps -q | wc -l)
echo "$DATE INFO: $DOCKER_CONTAINERS Docker containers running" >> $LOG_FILE
' > /opt/advancia/security_monitor.sh
  - chmod +x /opt/advancia/security_monitor.sh
  
  # Add to crontab
  - (crontab -l 2>/dev/null; echo "*/5 * * * * /opt/advancia/security_monitor.sh") | crontab -
  
  # Create backup script
  - echo '#!/bin/bash
# Backup script
BACKUP_DIR="/opt/advancia/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/advancia_backup_$DATE.tar.gz"

# Create backup
tar -czf $BACKUP_FILE /opt/advancia/data /opt/advancia/logs /etc/ssh/sshd_config /etc/ufw /etc/fail2ban /etc/audit/

# Keep only last 7 days of backups
find $BACKUP_DIR -name "advancia_backup_*.tar.gz" -mtime +7 -delete

echo "Backup created: $BACKUP_FILE"
' > /opt/advancia/backup.sh
  - chmod +x /opt/advancia/backup.sh
  
  # Add backup to crontab (daily at 2 AM)
  - (crontab -l 2>/dev/null; echo "0 2 * * * /opt/advancia/backup.sh") | crontab -
  
  # Create user with limited privileges for application
  - useradd -m -s /bin/false advancia-app
  - mkdir -p /home/advancia-app/.ssh
  - chmod 700 /home/advancia-app/.ssh
  
  # Secure file permissions
  - chmod 600 /home/azureuser/.ssh/authorized_keys
  - chmod 700 /home/azureuser/.ssh
  - chown -R azureuser:azureuser /home/azureuser/.ssh
  - chmod 644 /etc/ssh/sshd_config
  - chmod 600 /etc/ssh/ssh_host_*_key
  - chmod 644 /etc/ssh/ssh_host_*_key.pub
  '''))
    }
    networkProfile: {
      networkInterfaces: [
        {
          id: prodNic.id
        }
      ]
    }
    diagnosticsProfile: {
      bootDiagnostics: {
        enabled: true
        storageUri: storageAccount.properties.primaryEndpoints.blob
      }
    }
  }
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${vmIdentityId}': {}
    }
  }
}

// VM Extension for Monitoring Agent
resource vmExtension 'Microsoft.Compute/virtualMachines/extensions@2023-03-01' = {
  name: 'OMSExtension'
  parent: prodVm
  location: location
  properties: {
    publisher: 'Microsoft.EnterpriseCloud.Monitoring'
    type: 'OmsAgentForLinux'
    typeHandlerVersion: '1.13'
    autoUpgradeMinorVersion: true
    settings: {
      workspaceId: logAnalyticsWorkspaceId
    }
    protectedSettings: {
      workspaceKey: '' // Will be set via Key Vault
    }
  }
}

// VM Extension for Dependency Agent
resource dependencyExtension 'Microsoft.Compute/virtualMachines/extensions@2023-03-01' = {
  name: 'DependencyAgentLinux'
  parent: prodVm
  location: location
  properties: {
    publisher: 'Microsoft.Azure.Monitoring.DependencyAgent'
    type: 'DependencyAgentLinux'
    typeHandlerVersion: '9.5'
    autoUpgradeMinorVersion: true
  }
}

// VM Extension for Custom Script (hardening)
resource customScriptExtension 'Microsoft.Compute/virtualMachines/extensions@2023-03-01' = {
  name: 'CustomScript'
  parent: prodVm
  location: location
  properties: {
    publisher: 'Microsoft.Azure.Extensions'
    type: 'CustomScript'
    typeHandlerVersion: '2.1'
    autoUpgradeMinorVersion: true
    settings: {
      commandToExecute: 'echo "VM hardening completed via cloud-init"'
    }
  }
}

// Backup Policy for VM
resource backupPolicy 'Microsoft.RecoveryServices/vaults/backupPolicies@2023-01-01' = {
  name: 'vm-backup-policy-${environment}'
  properties: {
    backupManagementType: 'AzureIaasVM'
    schedulePolicy: {
      scheduleRunFrequency: 'Weekly'
      scheduleRunDays: [
        'Sunday'
      ]
      scheduleRunTimes: [
        '02:00'
      ]
      schedulePolicyType: 'SimpleSchedulePolicy'
    }
    retentionPolicy: {
      dailySchedule: {
        retentionDuration: {
          count: 7
          durationType: 'Days'
        }
        retentionTimes: [
          '02:00'
        ]
      }
      weeklySchedule: {
        retentionDuration: {
          count: 4
          durationType: 'Weeks'
        }
        retentionTimes: [
          '02:00'
        ]
        daysOfTheWeek: [
          'Sunday'
        ]
      }
      monthlySchedule: {
        retentionDuration: {
          count: 12
          durationType: 'Months'
        }
        retentionScheduleFormatType: 'Weekly'
        retentionScheduleWeekly: {
          daysOfTheWeek: [
            'Sunday'
          ]
          weeksOfTheMonth: [
            'First'
          ]
        }
        retentionTimes: [
          '02:00'
        ]
      }
      yearlySchedule: {
        retentionDuration: {
          count: 5
          durationType: 'Years'
        }
        retentionScheduleFormatType: 'Weekly'
        retentionScheduleWeekly: {
          daysOfTheWeek: [
            'Sunday'
          ]
          weeksOfTheMonth: [
            'First'
          ]
        }
        monthsOfYear: [
          'January'
        ]
        retentionTimes: [
          '02:00'
        ]
      }
      retentionPolicyType: 'LongTermRetentionPolicy'
    }
    timeZone: 'UTC'
  }
}

// Recovery Services Vault
resource recoveryVault 'Microsoft.RecoveryServices/vaults@2023-01-01' = {
  name: 'rsv-${environment}-advancia'
  location: location
  resourceGroup: resourceGroup().name
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
  properties: {
    storageModelType: 'GeoRedundant'
    storageType: 'GeoRedundant'
    storageSettings: [
      {
        datastoreType: 'VaultStore'
        type: 'Normal'
      }
    ]
    monitoringSettings: {
      azureMonitorAlertsForBackupJob: 'Enabled'
      classicAlertsForBackupJob: 'Disabled'
    }
  }
}

// Enable VM Backup
resource vmBackup 'Microsoft.RecoveryServices/vaults/backupFabrics/protectionContainers/protectedItems@2023-01-01' = {
  name: 'vm-backup-${environment}'
  properties: {
    protectionPolicyId: backupPolicy.id
    sourceResourceId: prodVm.id
    policyType: 'V2'
  }
}

// Outputs
output vmId string = prodVm.id
output vmName string = prodVm.name
output nicId string = prodNic.id
output storageAccountId string = storageAccount.id
output recoveryVaultId string = recoveryVault.id
