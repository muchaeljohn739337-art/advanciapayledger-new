@description('Key Vault name')
param keyVaultName string

@description('Object ID (user or service principal)')
param objectId string

@description('Permissions to grant')
param permissions object

// Get existing Key Vault
resource kv 'Microsoft.KeyVault/vaults@2022-07-01' existing = {
  name: keyVaultName
  scope: resourceGroup()
}

// Create access policy
resource accessPolicy 'Microsoft.KeyVault/vaults/accessPolicies@2022-07-01' = {
  name: 'access-policy-${objectId}'
  parent: kv
  properties: {
    accessPolicies: [
      {
        tenantId: tenant().tenantId
        objectId: objectId
        permissions: permissions
      }
    ]
  }
}

output accessPolicyId string = accessPolicy.id
