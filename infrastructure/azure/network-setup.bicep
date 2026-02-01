@description('Azure location for all resources')
param location string = resourceGroup().location

@description('Environment name for resource naming')
param environment string = 'prod'

@description('VNet address space')
param vnetAddressSpace string = '10.0.0.0/16'

@description('Gateway subnet address prefix')
param gatewaySubnetPrefix string = '10.0.1.0/24'

@description('Sandbox subnet address prefix')
param sandboxSubnetPrefix string = '10.0.2.0/24'

@description('Production subnet address prefix')
param prodSubnetPrefix string = '10.0.3.0/24'

@description('Resource group name')
param resourceGroupName string = resourceGroup().name

// Virtual Network
resource vnet 'Microsoft.Network/virtualNetworks@2023-05-01' = {
  name: 'vnet-${environment}-advancia'
  location: location
  resourceGroup: resourceGroupName
  properties: {
    addressSpace: {
      addressPrefixes: [
        vnetAddressSpace
      ]
    }
    subnets: []
    enableDdosProtection: false
    enableVmProtection: false
  }
}

// Gateway Subnet
resource gatewaySubnet 'Microsoft.Network/virtualNetworks/subnets@2023-05-01' = {
  parent: vnet
  name: 'snet-gateway'
  properties: {
    addressPrefix: gatewaySubnetPrefix
    networkSecurityGroup: {
      id: gatewayNsg.id
    }
    privateEndpointNetworkPolicies: 'Disabled'
    privateLinkServiceNetworkPolicies: 'Disabled'
  }
}

// Sandbox Subnet
resource sandboxSubnet 'Microsoft.Network/virtualNetworks/subnets@2023-05-01' = {
  parent: vnet
  name: 'snet-sandbox'
  properties: {
    addressPrefix: sandboxSubnetPrefix
    networkSecurityGroup: {
      id: sandboxNsg.id
    }
    privateEndpointNetworkPolicies: 'Disabled'
    privateLinkServiceNetworkPolicies: 'Disabled'
  }
}

// Production Subnet
resource prodSubnet 'Microsoft.Network/virtualNetworks/subnets@2023-05-01' = {
  parent: vnet
  name: 'snet-prod'
  properties: {
    addressPrefix: prodSubnetPrefix
    networkSecurityGroup: {
      id: prodNsg.id
    }
    privateEndpointNetworkPolicies: 'Enabled'
    privateLinkServiceNetworkPolicies: 'Disabled'
    serviceEndpoints: [
      {
        service: 'Microsoft.KeyVault'
      }
      {
        service: 'Microsoft.Storage'
      }
      {
        service: 'Microsoft.Sql'
      }
    ]
  }
}

// Network Security Groups

// Gateway NSG - Allow inbound from internet, outbound to prod only
resource gatewayNsg 'Microsoft.Network/networkSecurityGroups@2023-05-01' = {
  name: 'nsg-gateway-${environment}'
  location: location
  resourceGroup: resourceGroupName
  properties: {
    securityRules: [
      // Allow HTTPS from Internet
      {
        name: 'AllowHTTPS-In'
        properties: {
          description: 'Allow HTTPS from Internet'
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '443'
          sourceAddressPrefix: 'Internet'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 100
          direction: 'Inbound'
        }
      }
      // Allow HTTP from Internet (redirect to HTTPS)
      {
        name: 'AllowHTTP-In'
        properties: {
          description: 'Allow HTTP from Internet for redirect'
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '80'
          sourceAddressPrefix: 'Internet'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 110
          direction: 'Inbound'
        }
      }
      // Allow outbound to Production subnet (HTTPS)
      {
        name: 'AllowToProd-HTTPS'
        properties: {
          description: 'Allow outbound to Production subnet'
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '443'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: prodSubnetPrefix
          access: 'Allow'
          priority: 100
          direction: 'Outbound'
        }
      }
      // Allow outbound to Production subnet (application ports)
      {
        name: 'AllowToProd-App'
        properties: {
          description: 'Allow outbound to Production subnet application ports'
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '3000-3010'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: prodSubnetPrefix
          access: 'Allow'
          priority: 110
          direction: 'Outbound'
        }
      }
      // Allow outbound to Azure services (DNS, NTP, etc.)
      {
        name: 'AllowToAzure'
        properties: {
          description: 'Allow outbound to Azure services'
          protocol: '*'
          sourcePortRange: '*'
          destinationPortRange: '*'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: 'AzureCloud'
          access: 'Allow'
          priority: 200
          direction: 'Outbound'
        }
      }
      // Deny all other outbound
      {
        name: 'DenyAll-Out'
        properties: {
          description: 'Deny all other outbound traffic'
          protocol: '*'
          sourcePortRange: '*'
          destinationPortRange: '*'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
          access: 'Deny'
          priority: 4096
          direction: 'Outbound'
        }
      }
    ]
  }
}

// Sandbox NSG - Allow inbound from gateway, deny outbound to prod
resource sandboxNsg 'Microsoft.Network/networkSecurityGroups@2023-05-01' = {
  name: 'nsg-sandbox-${environment}'
  location: location
  resourceGroup: resourceGroupName
  properties: {
    securityRules: [
      // Allow inbound from Gateway subnet
      {
        name: 'AllowFromGateway'
        properties: {
          description: 'Allow inbound from Gateway subnet'
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '3000-3010'
          sourceAddressPrefix: gatewaySubnetPrefix
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 100
          direction: 'Inbound'
        }
      }
      // Allow inbound from Gateway subnet (SSH for debugging)
      {
        name: 'AllowSSH-FromGateway'
        properties: {
          description: 'Allow SSH from Gateway subnet for debugging'
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '22'
          sourceAddressPrefix: gatewaySubnetPrefix
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 110
          direction: 'Inbound'
        }
      }
      // Allow outbound to Azure services
      {
        name: 'AllowToAzure'
        properties: {
          description: 'Allow outbound to Azure services'
          protocol: '*'
          sourcePortRange: '*'
          destinationPortRange: '*'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: 'AzureCloud'
          access: 'Allow'
          priority: 200
          direction: 'Outbound'
        }
      }
      // Deny outbound to Production subnet
      {
        name: 'DenyToProd'
        properties: {
          description: 'Deny outbound to Production subnet'
          protocol: '*'
          sourcePortRange: '*'
          destinationPortRange: '*'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: prodSubnetPrefix
          access: 'Deny'
          priority: 300
          direction: 'Outbound'
        }
      }
      // Deny all other outbound
      {
        name: 'DenyAll-Out'
        properties: {
          description: 'Deny all other outbound traffic'
          protocol: '*'
          sourcePortRange: '*'
          destinationPortRange: '*'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
          access: 'Deny'
          priority: 4096
          direction: 'Outbound'
        }
      }
    ]
  }
}

// Production NSG - Allow inbound from gateway only, deny all else
resource prodNsg 'Microsoft.Network/networkSecurityGroups@2023-05-01' = {
  name: 'nsg-prod-${environment}'
  location: location
  resourceGroup: resourceGroupName
  properties: {
    securityRules: [
      // Allow inbound from Gateway subnet
      {
        name: 'AllowFromGateway'
        properties: {
          description: 'Allow inbound from Gateway subnet'
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '3000-3010'
          sourceAddressPrefix: gatewaySubnetPrefix
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 100
          direction: 'Inbound'
        }
      }
      // Allow inbound from Gateway subnet (management)
      {
        name: 'AllowMgmt-FromGateway'
        properties: {
          description: 'Allow management traffic from Gateway subnet'
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '22'
          sourceAddressPrefix: gatewaySubnetPrefix
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 110
          direction: 'Inbound'
        }
      }
      // Allow outbound to Key Vault
      {
        name: 'AllowToKeyVault'
        properties: {
          description: 'Allow outbound to Azure Key Vault'
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '443'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: 'AzureKeyVault'
          access: 'Allow'
          priority: 100
          direction: 'Outbound'
        }
      }
      // Allow outbound to Log Analytics
      {
        name: 'AllowToLogAnalytics'
        properties: {
          description: 'Allow outbound to Log Analytics'
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '443'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: 'AzureMonitor'
          access: 'Allow'
          priority: 110
          direction: 'Outbound'
        }
      }
      // Allow outbound to Azure Storage
      {
        name: 'AllowToStorage'
        properties: {
          description: 'Allow outbound to Azure Storage'
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '443'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: 'Storage'
          access: 'Allow'
          priority: 120
          direction: 'Outbound'
        }
      }
      // Allow outbound to Azure services
      {
        name: 'AllowToAzure'
        properties: {
          description: 'Allow outbound to Azure services'
          protocol: '*'
          sourcePortRange: '*'
          destinationPortRange: '*'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: 'AzureCloud'
          access: 'Allow'
          priority: 200
          direction: 'Outbound'
        }
      }
      // Deny all other inbound
      {
        name: 'DenyAll-In'
        properties: {
          description: 'Deny all other inbound traffic'
          protocol: '*'
          sourcePortRange: '*'
          destinationPortRange: '*'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
          access: 'Deny'
          priority: 4096
          direction: 'Inbound'
        }
      }
      // Deny all other outbound
      {
        name: 'DenyAll-Out'
        properties: {
          description: 'Deny all other outbound traffic'
          protocol: '*'
          sourcePortRange: '*'
          destinationPortRange: '*'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
          access: 'Deny'
          priority: 4096
          direction: 'Outbound'
        }
      }
    ]
  }
}

// Public IP for Gateway (optional, for management)
resource gatewayPublicIP 'Microsoft.Network/publicIPAddresses@2023-05-01' = {
  name: 'pip-gateway-${environment}'
  location: location
  resourceGroup: resourceGroupName
  sku: {
    name: 'Standard'
    tier: 'Regional'
  }
  properties: {
    publicIPAllocationMethod: 'Static'
    idleTimeoutInMinutes: 4
    dnsSettings: {
      domainNameLabel: 'gateway-${environment}-advancia'
    }
  }
}

// NAT Gateway for outbound internet access (if needed)
resource natGateway 'Microsoft.Network/natGateways@2023-05-01' = {
  name: 'nat-${environment}-advancia'
  location: location
  resourceGroup: resourceGroupName
  sku: {
    name: 'Standard'
  }
  properties: {
    idleTimeoutInMinutes: 4
    publicIpAddresses: [
      {
        id: gatewayPublicIP.id
      }
    ]
  }
}

// Associate NAT Gateway with subnets
resource gatewayNatAssociation 'Microsoft.Network/virtualNetworks/subnets@2023-05-01' = {
  parent: vnet
  name: 'gateway-nat-association'
  properties: {
    addressPrefix: gatewaySubnetPrefix
    natGateway: {
      id: natGateway.id
    }
  }
}

resource sandboxNatAssociation 'Microsoft.Network/virtualNetworks/subnets@2023-05-01' = {
  parent: vnet
  name: 'sandbox-nat-association'
  properties: {
    addressPrefix: sandboxSubnetPrefix
    natGateway: {
      id: natGateway.id
    }
  }
}

resource prodNatAssociation 'Microsoft.Network/virtualNetworks/subnets@2023-05-01' = {
  parent: vnet
  name: 'prod-nat-association'
  properties: {
    addressPrefix: prodSubnetPrefix
    natGateway: {
      id: natGateway.id
    }
  }
}

// Network Watcher
resource networkWatcher 'Microsoft.Network/networkWatchers@2023-05-01' = {
  name: 'nw-${location}'
  location: location
  properties: {}
}

// Flow Logs for NSGs
resource gatewayFlowLog 'Microsoft.Network/networkWatchers/flowLogs@2022-07-01' = {
  name: 'fl-gateway-${environment}'
  location: location
  properties: {
    targetResourceId: gatewayNsg.id
    storageId: '' // Will be set when storage account is created
    enabled: true
    retentionPolicy: {
      days: 30
      enabled: true
    }
    format: {
      type: 'JSON'
      version: 2
    }
  }
}

resource prodFlowLog 'Microsoft.Network/networkWatchers/flowLogs@2022-07-01' = {
  name: 'fl-prod-${environment}'
  location: location
  properties: {
    targetResourceId: prodNsg.id
    storageId: '' // Will be set when storage account is created
    enabled: true
    retentionPolicy: {
      days: 30
      enabled: true
    }
    format: {
      type: 'JSON'
      version: 2
    }
  }
}

// Outputs
output vnetId string = vnet.id
output gatewaySubnetId string = gatewaySubnet.id
output sandboxSubnetId string = sandboxSubnet.id
output prodSubnetId string = prodSubnet.id
output gatewayNsgId string = gatewayNsg.id
output sandboxNsgId string = sandboxNsg.id
output prodNsgId string = prodNsg.id
output gatewayPublicIPId string = gatewayPublicIP.id
output natGatewayId string = natGateway.id
