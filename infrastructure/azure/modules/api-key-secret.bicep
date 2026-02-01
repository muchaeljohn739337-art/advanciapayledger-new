@description('Key Vault name')
param keyVaultName string

@description('Secret name')
param secretName string

@description('Secret value')
param secretValue string

@description('Secret expiration in days')
param expirationDays int = 365

// Get existing Key Vault
resource kv 'Microsoft.KeyVault/vaults@2022-07-01' existing = {
  name: keyVaultName
  scope: resourceGroup()
}

// Create secret
resource secret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  name: secretName
  parent: kv
  properties: {
    value: secretValue
    attributes: {
      enabled: true
      expiresOn: dateTimeAdd(utcNow(), 'P${expirationDays}D')
    }
  }
}

output secretId string = secret.id
output secretName string = secret.name
