@description('Azure location for all resources')
param location string = resourceGroup().location

@description('Environment name for resource naming')
param environment string = 'prod'

@description('Container Registry name')
param containerRegistryName string

@description('Backend image tag')
param backendImageTag string = 'latest'

@description('Frontend image tag')
param frontendImageTag string = 'latest'

@description('Production subnet ID')
param prodSubnetId string

@description('Key Vault name')
param keyVaultName string

@description('VM managed identity ID')
param vmIdentityId string

// Container App Environment
resource containerAppEnv 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: 'cae-${environment}-advancia'
  location: location
  properties: {
    vnetConfiguration: {
      infrastructureSubnetId: prodSubnetId
      internal: true
    }
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: '' // Will be set with Log Analytics workspace ID
        sharedKey: '' // Will be set with Log Analytics key
      }
    }
    zoneRedundant: false
  }
}

// Get existing Key Vault
resource kv 'Microsoft.KeyVault/vaults@2022-07-01' existing = {
  name: keyVaultName
  scope: resourceGroup()
}

// Get existing Container Registry
resource acr 'Microsoft.ContainerRegistry/registries@2023-01-01-preview' existing = {
  name: containerRegistryName
  scope: resourceGroup()
}

// Backend Container App
resource backendApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'ca-backend-${environment}'
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${vmIdentityId}': {}
    }
  }
  properties: {
    managedEnvironmentId: containerAppEnv.id
    configuration: {
      ingress: {
        external: false
        targetPort: 3001
        transport: 'http'
        allowInsecure: false
      }
      secrets: [
        {
          name: 'database-url'
          keyVaultUrl: '${kv.properties.vaultUri}secrets/database-connection-string'
          identity: vmIdentityId
        }
        {
          name: 'redis-url'
          keyVaultUrl: '${kv.properties.vaultUri}secrets/redis-connection-string'
          identity: vmIdentityId
        }
        {
          name: 'jwt-secret'
          keyVaultUrl: '${kv.properties.vaultUri}secrets/jwt-secret'
          identity: vmIdentityId
        }
      ]
      registries: [
        {
          server: acr.properties.loginServer
          identity: vmIdentityId
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'backend'
          image: '${acr.properties.loginServer}/advancia-backend:${backendImageTag}'
          resources: {
            cpu: json('1.0')
            memory: '2Gi'
          }
          env: [
            {
              name: 'NODE_ENV'
              value: 'production'
            }
            {
              name: 'PORT'
              value: '3001'
            }
            {
              name: 'DATABASE_URL'
              secretRef: 'database-url'
            }
            {
              name: 'REDIS_URL'
              secretRef: 'redis-url'
            }
            {
              name: 'JWT_SECRET'
              secretRef: 'jwt-secret'
            }
            {
              name: 'AZURE_KEY_VAULT_URL'
              value: kv.properties.vaultUri
            }
          ]
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/health'
                port: 3001
              }
              initialDelaySeconds: 30
              periodSeconds: 10
              timeoutSeconds: 5
              failureThreshold: 3
            }
            {
              type: 'Readiness'
              httpGet: {
                path: '/health/ready'
                port: 3001
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
            http: {
              metadata: {
                concurrentRequests: '100'
              }
            }
          }
          {
            name: 'cpu-scaling'
            custom: {
              type: 'cpu'
              metadata: {
                type: 'Utilization'
                value: '70'
              }
            }
          }
        ]
      }
    }
  }
}

// Frontend Container App
resource frontendApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'ca-frontend-${environment}'
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${vmIdentityId}': {}
    }
  }
  properties: {
    managedEnvironmentId: containerAppEnv.id
    configuration: {
      ingress: {
        external: false
        targetPort: 3000
        transport: 'http'
        allowInsecure: false
      }
      registries: [
        {
          server: acr.properties.loginServer
          identity: vmIdentityId
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'frontend'
          image: '${acr.properties.loginServer}/advancia-frontend:${frontendImageTag}'
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            {
              name: 'NODE_ENV'
              value: 'production'
            }
            {
              name: 'NEXT_PUBLIC_API_URL'
              value: 'https://${backendApp.properties.configuration.ingress.fqdn}'
            }
            {
              name: 'PORT'
              value: '3000'
            }
          ]
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/'
                port: 3000
              }
              initialDelaySeconds: 30
              periodSeconds: 10
              timeoutSeconds: 5
              failureThreshold: 3
            }
            {
              type: 'Readiness'
              httpGet: {
                path: '/'
                port: 3000
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
            http: {
              metadata: {
                concurrentRequests: '100'
              }
            }
          }
        ]
      }
    }
  }
}

// Outputs
output containerAppEnvId string = containerAppEnv.id
output backendAppId string = backendApp.id
output backendAppFqdn string = backendApp.properties.configuration.ingress.fqdn
output frontendAppId string = frontendApp.id
output frontendAppFqdn string = frontendApp.properties.configuration.ingress.fqdn
