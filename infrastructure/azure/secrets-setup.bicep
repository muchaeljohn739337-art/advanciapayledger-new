@description('Azure location for all resources')
param location string = resourceGroup().location

@description('Environment name for resource naming')
param environment string = 'prod'

@description('Key Vault name')
param keyVaultName string

@description('VM managed identity ID')
param vmIdentityId string

@description('CI/CD managed identity ID')
param ciIdentityId string

@description('Production subnet ID for private endpoint')
param prodSubnetId string

@description('List of developer user principals')
param developers array = []

@description('Application JWT secret')
param appJwtSecret string = newGuid()

@description('Database connection string')
param databaseConnectionString string = ''

@description('SMTP password for notifications')
param smtpPassword string = newGuid()

@description('API keys for external services')
param externalApiKeys array = []

@description('SSL certificate private key')
param sslPrivateKey string = ''

@description('SSL certificate public key')
param sslPublicKey string = ''

// Get existing Key Vault
resource kv 'Microsoft.KeyVault/vaults@2022-07-01' existing = {
  name: keyVaultName
  scope: resourceGroup()
}

// Private Endpoint for Key Vault
resource kvPrivateEndpoint 'Microsoft.Network/privateEndpoints@2023-05-01' = {
  name: 'pe-${keyVaultName}'
  location: location
  resourceGroup: resourceGroup().name
  properties: {
    subnet: {
      id: prodSubnetId
    }
    privateLinkServiceConnections: [
      {
        name: 'kv-connection'
        properties: {
          privateLinkServiceId: kv.id
          groupIds: [
            'vault'
          ]
        }
      }
    ]
    privateDNSZoneGroup: {
      privateDNSZoneConfigs: [
        {
          privateDNSZoneId: privateDnsZone.id
        }
      ]
    }
  }
}

// Private DNS Zone for Key Vault
resource privateDnsZone 'Microsoft.Network/privateDnsZones@2023-05-01' = {
  name: 'privatelink.vaultcore.azure.net'
  location: location
  resourceGroup: resourceGroup().name
  properties: {}
}

// DNS Zone Link
resource dnsZoneLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2023-05-01' = {
  name: 'kv-dns-link-${environment}'
  parent: privateDnsZone
  properties: {
    virtualNetwork: {
      id: split(prodSubnetId, '/subnets/')[0]
    }
    registrationEnabled: false
  }
}

// Secrets for Application

// JWT Secret
resource jwtSecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  name: 'jwt-secret'
  parent: kv
  properties: {
    value: appJwtSecret
    attributes: {
      enabled: true
      expiresOn: dateTimeAdd(utcNow(), 'P2Y') // 2 years
    }
  }
}

// Database Connection String
resource dbSecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  name: 'database-connection-string'
  parent: kv
  properties: {
    value: databaseConnectionString
    attributes: {
      enabled: true
    }
  }
}

// SMTP Password
resource smtpSecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  name: 'smtp-password'
  parent: kv
  properties: {
    value: smtpPassword
    attributes: {
      enabled: true
      expiresOn: dateTimeAdd(utcNow(), 'P1Y') // 1 year
    }
  }
}

// SSL Private Key
resource sslPrivateKeySecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  name: 'ssl-private-key'
  parent: kv
  properties: {
    value: sslPrivateKey
    attributes: {
      enabled: true
    }
  }
}

// SSL Public Key
resource sslPublicKeySecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  name: 'ssl-public-key'
  parent: kv
  properties: {
    value: sslPublicKey
    attributes: {
      enabled: true
    }
  }
}

// External API Keys
module apiKeys 'modules/api-key-secret.bicep' = [for (key, index) in externalApiKeys: {
  name: 'api-key-${index}'
  params: {
    keyVaultName: keyVaultName
    secretName: 'api-key-${key.name}'
    secretValue: key.value
  }
}]

// Infrastructure Secrets

// VM SSH Private Key (for emergency access)
resource vmSshSecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  name: 'vm-ssh-private-key'
  parent: kv
  properties: {
    value: '' // Will be populated during deployment
    attributes: {
      enabled: true
    }
  }
}

// Backup Encryption Key
resource backupEncryptionKey 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  name: 'backup-encryption-key'
  parent: kv
  properties: {
    value: newGuid()
    attributes: {
      enabled: true
    }
  }
}

// Monitoring Workspace Key
resource monitoringKey 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  name: 'monitoring-workspace-key'
  parent: kv
  properties: {
    value: '' // Will be populated during deployment
    attributes: {
      enabled: true
    }
  }
}

// Certificate Management

// Self-signed certificate for development (can be replaced with CA certificate)
resource selfSignedCert 'Microsoft.KeyVault/vaults/certificates@2022-07-01' = {
  name: 'advancia-ssl-cert'
  parent: kv
  properties: {
    policy: {
      keyProperties: {
        exportable: true
        keySize: 2048
        keyType: 'RSA'
        reuseKeyOnRenewal: true
      }
      secretProperties: {
        contentType: 'application/x-pkcs12'
      }
      x509CertificateProperties: {
        subject: 'CN=advancia-${environment}.azurewebsites.net'
        sans: {
          dnsNames: [
            'advancia-${environment}.azurewebsites.net'
            '*.advancia-${environment}.azurewebsites.net'
          ]
        }
        keyUsage: [
          'digitalSignature'
          'keyEncipherment'
        ]
        extendedKeyUsage: [
          'serverAuth'
          'clientAuth'
        ]
        validityInMonths: 12
      }
      lifetimeActions: [
        {
          action: {
            actionType: 'AutoRenew'
          }
          trigger: {
            daysBeforeExpiry: 30
          }
        }
      ]
      issuerParameters: {
        name: 'Self'
      }
    }
  }
}

// Access Policies (Role-based)

// VM Identity Access
resource vmAccessPolicy 'Microsoft.KeyVault/vaults/accessPolicies@2022-07-01' = {
  name: 'vm-access-policy'
  parent: kv
  properties: {
    accessPolicies: [
      {
        tenantId: tenant().tenantId
        objectId: vmIdentity.properties.principalId
        permissions: {
          secrets: [
            'Get'
            'List'
          ]
          certificates: [
            'Get'
            'List'
          ]
          keys: [
            'Get'
            'List'
          ]
        }
      }
    ]
  }
}

// CI/CD Identity Access
resource ciAccessPolicy 'Microsoft.KeyVault/vaults/accessPolicies@2022-07-01' = {
  name: 'ci-access-policy'
  parent: kv
  properties: {
    accessPolicies: [
      {
        tenantId: tenant().tenantId
        objectId: ciIdentity.properties.principalId
        permissions: {
          secrets: [
            'Get'
            'List'
            'Set'
            'Delete'
          ]
          certificates: [
            'Get'
            'List'
            'Create'
            'Import'
            'Delete'
          ]
          keys: [
            'Get'
            'List'
            'Create'
            'Delete'
          ]
        }
      }
    ]
  }
}

// Developer Access (read-only)
module developerAccess 'modules/keyvault-access.bicep' = [for developer in developers: {
  name: 'developer-access-${developer}'
  params: {
    keyVaultName: keyVaultName
    objectId: developer
    permissions: {
      secrets: [
        'Get'
        'List'
      ]
      certificates: [
        'Get'
        'List'
      ]
      keys: [
        'Get'
        'List'
      ]
    }
  }
}]

// Secret Rotation Policies

// JWT Secret Rotation
resource jwtRotation 'Microsoft.KeyVault/vaults/secrets/rotationPolicy@2022-07-01' = {
  name: 'default'
  parent: jwtSecret
  properties: {
    lifetimeInDays: 90
    rotateOnExpiry: true
    notifyOnExpiry: {
      daysBeforeExpiry: 30
    }
  }
}

// Database Connection Rotation
resource dbRotation 'Microsoft.KeyVault/vaults/secrets/rotationPolicy@2022-07-01' = {
  name: 'default'
  parent: dbSecret
  properties: {
    lifetimeInDays: 180
    rotateOnExpiry: true
    notifyOnExpiry: {
      daysBeforeExpiry: 30
    }
  }
}

// SMTP Password Rotation
resource smtpRotation 'Microsoft.KeyVault/vaults/secrets/rotationPolicy@2022-07-01' = {
  name: 'default'
  parent: smtpSecret
  properties: {
    lifetimeInDays: 365
    rotateOnExpiry: true
    notifyOnExpiry: {
      daysBeforeExpiry: 30
    }
  }
}

// Diagnostic Settings for Key Vault
resource kvDiagnostic 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'kv-diagnostic'
  properties: {
    logs: [
      {
        category: 'AuditLog'
        enabled: true
        retentionPolicy: {
          days: 365
          enabled: true
        }
      }
      {
        category: 'AzurePolicyEvaluationDetails'
        enabled: true
        retentionPolicy: {
          days: 90
          enabled: true
        }
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
        retentionPolicy: {
          days: 90
          enabled: true
        }
      }
    ]
    workspaceId: '' // Will be set when Log Analytics is created
  }
  scope: kv
}

// Automation Account for Secret Rotation
resource automationAccount 'Microsoft.Automation/automationAccounts@2023-11-01' = {
  name: 'aa-${environment}-advancia'
  location: location
  resourceGroup: resourceGroup().name
  properties: {
    sku: {
      name: 'Basic'
    }
  }
}

// Runbook for Secret Rotation
resource secretRotationRunbook 'Microsoft.Automation/automationAccounts/runbooks@2023-11-01' = {
  name: 'Rotate-Secrets'
  parent: automationAccount
  location: location
  properties: {
    runbookType: 'PowerShell'
    logProgress: false
    logVerbose: false
    description: 'Automated secret rotation runbook'
    draft: {
      content: '''
param (
    [Parameter(Mandatory=$true)]
    [string]$KeyVaultName,
    
    [Parameter(Mandatory=$true)]
    [string]$SecretName,
    
    [Parameter(Mandatory=$false)]
    [string]$NewSecretValue = ""
)

# Connect to Azure
$connection = Get-AutomationConnection -Name AzureRunAsConnection
Connect-AzAccount -ServicePrincipal -Tenant $connection.TenantID -ApplicationId $connection.ApplicationID -CertificateThumbprint $connection.CertificateThumbprint

# Generate new secret if not provided
if ([string]::IsNullOrEmpty($NewSecretValue)) {
    $NewSecretValue = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
}

# Update secret
Set-AzKeyVaultSecret -VaultName $KeyVaultName -Name $SecretName -SecretValue $NewSecretValue

Write-Output "Secret $SecretName in KeyVault $KeyVaultName has been rotated"
'''
    }
  }
}

// Schedule for Secret Rotation
resource rotationSchedule 'Microsoft.Automation/automationAccounts/jobSchedules@2023-11-01' = {
  name: 'monthly-secret-rotation'
  parent: automationAccount
  properties: {
    schedule: {
      name: 'monthly-rotation'
      startTime: utcNow()
      expiryTime: dateTimeAdd(utcNow(), 'P2Y')
      interval: 1
      frequency: 'Month'
      advancedSchedule: {
        monthDays: [
          1
        ]
      }
    }
    runbook: {
      name: secretRotationRunbook.name
    }
    parameters: {
      KeyVaultName: keyVaultName
      SecretName: 'jwt-secret'
    }
  }
}

// Outputs
output keyVaultId string = kv.id
output keyVaultUri string = kv.properties.vaultUri
output privateEndpointId string = kvPrivateEndpoint.id
output certificateId string = selfSignedCert.id
output automationAccountId string = automationAccount.id
