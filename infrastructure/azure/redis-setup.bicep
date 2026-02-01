@description('Azure location for all resources')
param location string = resourceGroup().location

@description('Environment name for resource naming')
param environment string = 'prod'

@description('Redis SKU name')
param skuName string = 'Standard'

@description('Redis SKU family')
param skuFamily string = 'C'

@description('Redis SKU capacity')
param skuCapacity int = 1

@description('Production subnet ID for private endpoint')
param prodSubnetId string

@description('Key Vault name for storing connection string')
param keyVaultName string

@description('Enable non-SSL port')
param enableNonSslPort bool = false

@description('Minimum TLS version')
param minimumTlsVersion string = '1.2'

// Azure Cache for Redis
resource redisCache 'Microsoft.Cache/redis@2023-08-01' = {
  name: 'redis-${environment}-advancia'
  location: location
  properties: {
    sku: {
      name: skuName
      family: skuFamily
      capacity: skuCapacity
    }
    enableNonSslPort: enableNonSslPort
    minimumTlsVersion: minimumTlsVersion
    publicNetworkAccess: 'Disabled'
    redisConfiguration: {
      'maxmemory-policy': 'allkeys-lru'
      'maxmemory-reserved': '50'
      'maxfragmentationmemory-reserved': '50'
    }
    redisVersion: '6'
  }
}

// Private Endpoint for Redis
resource redisPrivateEndpoint 'Microsoft.Network/privateEndpoints@2023-05-01' = {
  name: 'pe-redis-${environment}'
  location: location
  properties: {
    subnet: {
      id: prodSubnetId
    }
    privateLinkServiceConnections: [
      {
        name: 'redis-connection'
        properties: {
          privateLinkServiceId: redisCache.id
          groupIds: [
            'redisCache'
          ]
        }
      }
    ]
  }
}

// Private DNS Zone for Redis
resource privateDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: 'privatelink.redis.cache.windows.net'
  location: 'global'
  properties: {}
}

// DNS Zone Link
resource dnsZoneLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  name: 'redis-dns-link-${environment}'
  parent: privateDnsZone
  location: 'global'
  properties: {
    virtualNetwork: {
      id: split(prodSubnetId, '/subnets/')[0]
    }
    registrationEnabled: false
  }
}

// DNS Zone Group
resource dnsZoneGroup 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@2023-05-01' = {
  name: 'redis-dns-zone-group'
  parent: redisPrivateEndpoint
  properties: {
    privateDnsZoneConfigs: [
      {
        name: 'config1'
        properties: {
          privateDnsZoneId: privateDnsZone.id
        }
      }
    ]
  }
}

// Get existing Key Vault
resource kv 'Microsoft.KeyVault/vaults@2022-07-01' existing = {
  name: keyVaultName
  scope: resourceGroup()
}

// Store Redis connection string in Key Vault
resource redisConnectionStringSecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  name: 'redis-connection-string'
  parent: kv
  properties: {
    value: 'rediss://:${redisCache.listKeys().primaryKey}@${redisCache.properties.hostName}:6380'
    attributes: {
      enabled: true
    }
  }
}

// Store Redis host in Key Vault
resource redisHostSecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  name: 'redis-host'
  parent: kv
  properties: {
    value: redisCache.properties.hostName
    attributes: {
      enabled: true
    }
  }
}

// Store Redis password in Key Vault
resource redisPasswordSecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  name: 'redis-password'
  parent: kv
  properties: {
    value: redisCache.listKeys().primaryKey
    attributes: {
      enabled: true
    }
  }
}

// Diagnostic Settings
resource diagnosticSettings 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'redis-diagnostics'
  scope: redisCache
  properties: {
    logs: [
      {
        category: 'ConnectedClientList'
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

// Alert Rules for Redis
resource redisCpuAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'redis-high-cpu-${environment}'
  location: 'global'
  properties: {
    description: 'Alert when Redis CPU usage is high'
    severity: 2
    enabled: true
    scopes: [
      redisCache.id
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      allOf: [
        {
          name: 'HighCPU'
          metricNamespace: 'Microsoft.Cache/redis'
          metricName: 'percentProcessorTime'
          operator: 'GreaterThan'
          threshold: 80
          timeAggregation: 'Average'
        }
      ]
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
    }
    autoMitigate: true
  }
}

resource redisMemoryAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'redis-high-memory-${environment}'
  location: 'global'
  properties: {
    description: 'Alert when Redis memory usage is high'
    severity: 2
    enabled: true
    scopes: [
      redisCache.id
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      allOf: [
        {
          name: 'HighMemory'
          metricNamespace: 'Microsoft.Cache/redis'
          metricName: 'usedmemorypercentage'
          operator: 'GreaterThan'
          threshold: 90
          timeAggregation: 'Average'
        }
      ]
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
    }
    autoMitigate: true
  }
}

resource redisConnectionAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'redis-connection-errors-${environment}'
  location: 'global'
  properties: {
    description: 'Alert when Redis has connection errors'
    severity: 3
    enabled: true
    scopes: [
      redisCache.id
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      allOf: [
        {
          name: 'ConnectionErrors'
          metricNamespace: 'Microsoft.Cache/redis'
          metricName: 'errors'
          operator: 'GreaterThan'
          threshold: 10
          timeAggregation: 'Total'
        }
      ]
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
    }
    autoMitigate: false
  }
}

// Outputs
output redisCacheId string = redisCache.id
output redisCacheName string = redisCache.name
output redisHostName string = redisCache.properties.hostName
output redisPort int = redisCache.properties.sslPort
output connectionStringSecretName string = redisConnectionStringSecret.name
output hostSecretName string = redisHostSecret.name
output passwordSecretName string = redisPasswordSecret.name
