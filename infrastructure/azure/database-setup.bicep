@description('Azure location for all resources')
param location string = resourceGroup().location

@description('Environment name for resource naming')
param environment string = 'prod'

@description('Database administrator username')
param administratorLogin string = 'dbadmin'

@description('Database administrator password')
@secure()
param administratorPassword string

@description('Production subnet ID for private endpoint')
param prodSubnetId string

@description('Key Vault name for storing connection string')
param keyVaultName string

@description('Database SKU')
param skuName string = 'Standard_B2s'

@description('Database tier')
param skuTier string = 'Burstable'

@description('Storage size in GB')
param storageSizeGB int = 128

@description('Backup retention days')
param backupRetentionDays int = 7

// PostgreSQL Flexible Server
resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-03-01-preview' = {
  name: 'postgres-${environment}-advancia'
  location: location
  sku: {
    name: skuName
    tier: skuTier
  }
  properties: {
    administratorLogin: administratorLogin
    administratorLoginPassword: administratorPassword
    version: '15'
    storage: {
      storageSizeGB: storageSizeGB
      autoGrow: 'Enabled'
    }
    backup: {
      backupRetentionDays: backupRetentionDays
      geoRedundantBackup: 'Enabled'
    }
    highAvailability: {
      mode: 'Disabled' // Enable for production: 'ZoneRedundant'
    }
    network: {
      delegatedSubnetResourceId: prodSubnetId
      privateDnsZoneArmResourceId: privateDnsZone.id
    }
    authConfig: {
      activeDirectoryAuth: 'Enabled'
      passwordAuth: 'Enabled'
      tenantId: tenant().tenantId
    }
  }
}

// Private DNS Zone for PostgreSQL
resource privateDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: 'privatelink.postgres.database.azure.com'
  location: 'global'
  properties: {}
}

// DNS Zone Link
resource dnsZoneLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  name: 'postgres-dns-link-${environment}'
  parent: privateDnsZone
  location: 'global'
  properties: {
    virtualNetwork: {
      id: split(prodSubnetId, '/subnets/')[0]
    }
    registrationEnabled: false
  }
}

// Database
resource database 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-03-01-preview' = {
  name: 'advancia_${environment}'
  parent: postgresServer
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

// Firewall Rules (for initial setup only)
resource firewallRuleAzureServices 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-03-01-preview' = {
  name: 'AllowAzureServices'
  parent: postgresServer
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// Database Configuration
resource dbConfig 'Microsoft.DBforPostgreSQL/flexibleServers/configurations@2023-03-01-preview' = {
  name: 'max_connections'
  parent: postgresServer
  properties: {
    value: '200'
    source: 'user-override'
  }
}

resource dbConfigSSL 'Microsoft.DBforPostgreSQL/flexibleServers/configurations@2023-03-01-preview' = {
  name: 'require_secure_transport'
  parent: postgresServer
  properties: {
    value: 'on'
    source: 'user-override'
  }
}

resource dbConfigLogConnections 'Microsoft.DBforPostgreSQL/flexibleServers/configurations@2023-03-01-preview' = {
  name: 'log_connections'
  parent: postgresServer
  properties: {
    value: 'on'
    source: 'user-override'
  }
}

resource dbConfigLogDisconnections 'Microsoft.DBforPostgreSQL/flexibleServers/configurations@2023-03-01-preview' = {
  name: 'log_disconnections'
  parent: postgresServer
  properties: {
    value: 'on'
    source: 'user-override'
  }
}

// Get existing Key Vault
resource kv 'Microsoft.KeyVault/vaults@2022-07-01' existing = {
  name: keyVaultName
  scope: resourceGroup()
}

// Store connection string in Key Vault
resource dbConnectionStringSecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  name: 'database-connection-string'
  parent: kv
  properties: {
    value: 'postgresql://${administratorLogin}:${administratorPassword}@${postgresServer.properties.fullyQualifiedDomainName}:5432/${database.name}?sslmode=require'
    attributes: {
      enabled: true
    }
  }
}

// Diagnostic Settings
resource diagnosticSettings 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'postgres-diagnostics'
  scope: postgresServer
  properties: {
    logs: [
      {
        category: 'PostgreSQLLogs'
        enabled: true
        retentionPolicy: {
          days: 30
          enabled: true
        }
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
        retentionPolicy: {
          days: 30
          enabled: true
        }
      }
    ]
    workspaceId: '' // Will be set with Log Analytics workspace ID
  }
}

// Outputs
output serverId string = postgresServer.id
output serverName string = postgresServer.name
output serverFqdn string = postgresServer.properties.fullyQualifiedDomainName
output databaseName string = database.name
output connectionStringSecretName string = dbConnectionStringSecret.name
