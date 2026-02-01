@description('Azure location for all resources')
param location string = resourceGroup().location

@description('Environment name for resource naming')
param environment string = 'prod'

@description('VM ID for backup')
param vmId string

@description('Key Vault name')
param keyVaultName string

@description('Storage Account ID')
param storageAccountId string

@description('Recovery Services Vault ID')
param recoveryVaultId string

// Backup Storage Account
resource backupStorage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: 'stbackup${uniqueString(resourceGroup().id)}${environment}'
  location: location
  resourceGroup: resourceGroup().name
  sku: {
    name: 'Standard_GRS'
    tier: 'Standard'
  }
  kind: 'StorageV2'
  properties: {
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    allowSharedKeyAccess: false
    networkAcls: {
      defaultAction: 'Deny'
      bypass: 'AzureServices'
      ipRules: []
      virtualNetworkRules: []
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
    largeFileSharesState: 'Enabled'
    allowSharedKeyAccess: false
    supportsHttpsTrafficOnly: true
  }
}

// Backup Containers
resource backupContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  name: 'vm-backups'
  parent: backupStorage::default
  properties: {
    publicAccess: 'None'
    metadata: {
      purpose: 'VM backups'
      environment: environment
    }
  }
}

resource configBackupContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  name: 'config-backups'
  parent: backupStorage::default
  properties: {
    publicAccess: 'None'
    metadata: {
      purpose: 'Configuration backups'
      environment: environment
    }
  }
}

resource logBackupContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  name: 'log-backups'
  parent: backupStorage::default
  properties: {
    publicAccess: 'None'
    metadata: {
      purpose: 'Log backups'
      environment: environment
    }
  }
}

// Recovery Services Vault (if not provided)
resource recoveryVault 'Microsoft.RecoveryServices/vaults@2023-01-01' = {
  name: 'rsv-backup-${environment}'
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

// VM Backup Policy
resource vmBackupPolicy 'Microsoft.RecoveryServices/vaults/backupPolicies@2023-01-01' = {
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

// Enable VM Backup
resource vmBackup 'Microsoft.RecoveryServices/vaults/backupFabrics/protectionContainers/protectedItems@2023-01-01' = {
  name: 'vm-backup-${environment}'
  properties: {
    protectionPolicyId: vmBackupPolicy.id
    sourceResourceId: vmId
    policyType: 'V2'
  }
}

// Key Vault Backup
resource keyVaultBackup 'Microsoft.RecoveryServices/vaults/backupFabrics/protectionContainers/protectedItems@2023-01-01' = {
  name: 'keyvault-backup-${environment}'
  properties: {
    protectionPolicyId: keyVaultBackupPolicy.id
    sourceResourceId: keyVaultName
    policyType: 'AzureKeyVault'
  }
}

// Key Vault Backup Policy
resource keyVaultBackupPolicy 'Microsoft.RecoveryServices/vaults/backupPolicies@2023-01-01' = {
  name: 'keyvault-backup-policy-${environment}'
  properties: {
    backupManagementType: 'AzureKeyVault'
    schedulePolicy: {
      scheduleRunFrequency: 'Weekly'
      scheduleRunDays: [
        'Sunday'
      ]
      scheduleRunTimes: [
        '03:00'
      ]
      schedulePolicyType: 'SimpleSchedulePolicy'
    }
    retentionPolicy: {
      retentionDuration: {
        count: 90
        durationType: 'Days'
      }
      retentionPolicyType: 'LongTermRetentionPolicy'
    }
    timeZone: 'UTC'
  }
}

// Automation Account for Backup Scripts
resource automationAccount 'Microsoft.Automation/automationAccounts@2023-11-01' = {
  name: 'aa-backup-${environment}'
  location: location
  resourceGroup: resourceGroup().name
  properties: {
    sku: {
      name: 'Basic'
    }
  }
}

// Runbook for VM Backup
resource vmBackupRunbook 'Microsoft.Automation/automationAccounts/runbooks@2023-11-01' = {
  name: 'Backup-VM'
  parent: automationAccount
  location: location
  properties: {
    runbookType: 'PowerShell'
    logProgress: true
    logVerbose: true
    description: 'Runbook to create VM snapshots and backups'
    draft: {
      content: '''
param (
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroupName,
    
    [Parameter(Mandatory=$true)]
    [string]$VMName,
    
    [Parameter(Mandatory=$false)]
    [string]$StorageAccountName,
    
    [Parameter(Mandatory=$false)]
    [string]$ContainerName = "vm-backups"
)

# Connect to Azure
$connection = Get-AutomationConnection -Name AzureRunAsConnection
Connect-AzAccount -ServicePrincipal -Tenant $connection.TenantID -ApplicationID $connection.ApplicationID -CertificateThumbprint $connection.CertificateThumbprint

# Get VM information
$vm = Get-AzVM -ResourceGroupName $ResourceGroupName -Name $VMName
if (-not $vm) {
    Write-Error "VM $VMName not found in resource group $ResourceGroupName"
    exit 1
}

# Create snapshot name
$snapshotName = "snapshot-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

# Create snapshot configuration
$snapshotConfig = New-AzSnapshotConfig -SourceUri $vm.StorageProfile.OsDisk.ManagedDisk.Id -Location $vm.Location -CreateOption Copy -SkuName Standard_LRS

# Create snapshot
$snapshot = New-AzSnapshot -Snapshot $snapshotConfig -SnapshotName $snapshotName -ResourceGroupName $ResourceGroupName
Write-Output "Created snapshot: $($snapshot.Name)"

# If storage account is provided, copy VHD to storage
if ($StorageAccountName -and $ContainerName) {
    $storageAccountKey = (Get-AzStorageAccountKey -ResourceGroupName $ResourceGroupName -Name $StorageAccountName)[0].Value
    $context = New-AzStorageContext -StorageAccountName $StorageAccountName -StorageAccountKey $storageAccountKey
    
    # Generate SAS token for snapshot
    $sasToken = Grant-AzSnapshotAccess -ResourceGroupName $ResourceGroupName -SnapshotName $snapshotName -DurationInSecond 3600 -Access 'Read'
    
    # Copy to storage
    $blobName = "$($snapshotName).vhd"
    Start-AzStorageBlobCopy -AbsoluteUri $sasToken.AccessSAS -DestContainer $ContainerName -DestContext $context -DestBlob $blobName
    
    Write-Output "Initiated copy of snapshot to storage blob: $blobName"
}

# Clean up old snapshots (keep last 30 days)
$cutoffDate = (Get-Date).AddDays(-30)
$oldSnapshots = Get-AzSnapshot -ResourceGroupName $ResourceGroupName | Where-Object { $_.TimeCreated -lt $cutoffDate -and $_.Name -like "snapshot-*" }

foreach ($oldSnapshot in $oldSnapshots) {
    Remove-AzSnapshot -ResourceGroupName $ResourceGroupName -SnapshotName $oldSnapshot.Name -Force
    Write-Output "Removed old snapshot: $($oldSnapshot.Name)"
}

Write-Output "VM backup completed successfully"
'''
    }
  }
}

// Runbook for Configuration Backup
resource configBackupRunbook 'Microsoft.Automation/automationAccounts/runbooks@2023-11-01' = {
  name: 'Backup-Configuration'
  parent: automationAccount
  location: location
  properties: {
    runbookType: 'PowerShell'
    logProgress: true
    logVerbose: true
    description: 'Runbook to backup configuration files and certificates'
    draft: {
      content: '''
param (
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroupName,
    
    [Parameter(Mandatory=$true)]
    [string]$StorageAccountName,
    
    [Parameter(Mandatory=$false)]
    [string]$ContainerName = "config-backups",
    
    [Parameter(Mandatory=$false)]
    [string]$VMName = ""
)

# Connect to Azure
$connection = Get-AutomationConnection -Name AzureRunAsConnection
Connect-AzAccount -ServicePrincipal -Tenant $connection.TenantID -ApplicationID $connection.ApplicationID -CertificateThumbprint $connection.CertificateThumbprint

# Get storage context
$storageAccountKey = (Get-AzStorageAccountKey -ResourceGroupName $ResourceGroupName -Name $StorageAccountName)[0].Value
$context = New-AzStorageContext -StorageAccountName $StorageAccountName -StorageAccountKey $storageAccountKey

# Create backup timestamp
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupFolder = "config-backup-$timestamp"

# Create temporary zip file
$tempFile = New-TemporaryFile

# Backup NGINX configuration if VM is provided
if ($VMName) {
    # Get NGINX config files
    $nginxConfig = Invoke-AzVMRunCommand -ResourceGroupName $ResourceGroupName -VMName $VMName -CommandId 'RunShellScript' -ScriptPath '/tmp/get-nginx-config.sh'
    
    # Save to temp file
    $nginxConfig.Value[0].Message | Out-File -FilePath "$tempFile-nginx.conf" -Encoding utf8
    
    # Upload to storage
    $nginxBlobName = "$backupFolder/nginx.conf"
    Set-AzStorageBlobContent -File "$tempFile-nginx.conf" -Container $ContainerName -Blob $nginxBlobName -Context $context
    Write-Output "Uploaded NGINX configuration to: $nginxBlobName"
}

# Backup Key Vault certificates and secrets
$keyVault = Get-AzKeyVault -ResourceGroupName $ResourceGroupName
if ($keyVault) {
    # Export certificates
    $certificates = Get-AzKeyVaultCertificate -VaultName $keyVault.VaultName
    foreach ($cert in $certificates) {
        $certBytes = Export-AzKeyVaultCertificate -VaultName $keyVault.VaultName -Name $cert.Name
        $certBlobName = "$backupFolder/certificates/$($cert.Name).pfx"
        Set-AzStorageBlobContent -File $certBytes -Container $ContainerName -Blob $certBlobName -Context $context
        Write-Output "Uploaded certificate: $($cert.Name)"
    }
    
    # Export secrets (metadata only, not actual secret values)
    $secrets = Get-AzKeyVaultSecret -VaultName $keyVault.VaultName
    $secretMetadata = $secrets | Select-Object Name, ContentType, Enabled, Expires, NotBefore, Updated, Tags
    $secretBlobName = "$backupFolder/secrets-metadata.json"
    $secretMetadata | ConvertTo-Json -Depth 10 | Out-File -FilePath "$tempFile-secrets.json" -Encoding utf8
    Set-AzStorageBlobContent -File "$tempFile-secrets.json" -Container $ContainerName -Blob $secretBlobName -Context $context
    Write-Output "Uploaded secrets metadata to: $secretBlobName"
}

# Backup Network Security Group configurations
$nsgs = Get-AzNetworkSecurityGroup -ResourceGroupName $ResourceGroupName
foreach ($nsg in $nsgs) {
    $nsgBlobName = "$backupFolder/nsgs/$($nsg.Name).json"
    $nsg | ConvertTo-Json -Depth 10 | Out-File -FilePath "$tempFile-$($nsg.Name).json" -Encoding utf8
    Set-AzStorageBlobContent -File "$tempFile-$($nsg.Name).json" -Container $ContainerName -Blob $nsgBlobName -Context $context
    Write-Output "Uploaded NSG configuration: $($nsg.Name)"
}

# Clean up old configuration backups (keep last 90 days)
$cutoffDate = (Get-Date).AddDays(-90)
$oldBackups = Get-AzStorageBlob -Container $ContainerName -Context $context | Where-Object { $_.Name -like "config-backup-*" -and $_.LastModified -lt $cutoffDate }

foreach ($oldBackup in $oldBackups) {
    Remove-AzStorageBlob -Blob $oldBackup.Name -Container $ContainerName -Context $context
    Write-Output "Removed old configuration backup: $($oldBackup.Name)"
}

# Clean up temp files
Remove-Item -Path $tempFile* -Force

Write-Output "Configuration backup completed successfully"
'''
    }
  }
}

// Schedule for VM Backup
resource vmBackupSchedule 'Microsoft.Automation/automationAccounts/jobSchedules@2023-11-01' = {
  name: 'daily-vm-backup'
  parent: automationAccount
  properties: {
    schedule: {
      name: 'daily-backup'
      startTime: utcNow()
      expiryTime: dateTimeAdd(utcNow(), 'P2Y')
      interval: 1
      frequency: 'Day'
      advancedSchedule: {
        hour: 2
        minute: 0
      }
    }
    runbook: {
      name: vmBackupRunbook.name
    }
    parameters: {
      ResourceGroupName: resourceGroup().name
      VMName: split(vmId, '/')[8]
      StorageAccountName: backupStorage.name
      ContainerName: backupContainer.name
    }
  }
}

// Schedule for Configuration Backup
resource configBackupSchedule 'Microsoft.Automation/automationAccounts/jobSchedules@2023-11-01' = {
  name: 'weekly-config-backup'
  parent: automationAccount
  properties: {
    schedule: {
      name: 'weekly-backup'
      startTime: utcNow()
      expiryTime: dateTimeAdd(utcNow(), 'P2Y')
      interval: 1
      frequency: 'Week'
      advancedSchedule: {
        weekDays: [
          'Sunday'
        ]
        hour: 3
        minute: 0
      }
    }
    runbook: {
      name: configBackupRunbook.name
    }
    parameters: {
      ResourceGroupName: resourceGroup().name
      StorageAccountName: backupStorage.name
      ContainerName: configBackupContainer.name
      VMName: split(vmId, '/')[8]
    }
  }
}

// Storage Account Lifecycle Management
resource storageLifecycle 'Microsoft.Storage/storageAccounts/managementPolicies@2023-01-01' = {
  name: 'default'
  parent: backupStorage
  properties: {
    lastAccessTimeTracking: {
      enable: true
      granularityInDays: 1
    }
    rules: [
      {
        enabled: true
        name: 'vm-backups-retention'
        type: 'Lifecycle'
        definition: {
          filters: {
            blobTypes: [
              'blockBlob'
            ]
            prefixMatch: [
              'vm-backups/'
            ]
          }
          actions: {
            baseBlob: {
              delete: {
                daysAfterModificationGreaterThan: 30
              }
            }
          }
        }
      }
      {
        enabled: true
        name: 'config-backups-retention'
        type: 'Lifecycle'
        definition: {
          filters: {
            blobTypes: [
              'blockBlob'
            ]
            prefixMatch: [
              'config-backups/'
            ]
          }
          actions: {
            baseBlob: {
              delete: {
                daysAfterModificationGreaterThan: 90
              }
            }
          }
        }
      }
      {
        enabled: true
        name: 'log-backups-retention'
        type: 'Lifecycle'
        definition: {
          filters: {
            blobTypes: [
              'blockBlob'
            ]
            prefixMatch: [
              'log-backups/'
            ]
          }
          actions: {
            baseBlob: {
              delete: {
                daysAfterModificationGreaterThan: 365
              }
            }
          }
        }
      }
    ]
  }
}

// Backup Monitoring Alert
resource backupAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'backup-failure-alert'
  location: location
  resourceGroup: resourceGroup().name
  properties: {
    description: 'Alert for backup failures'
    severity: 2
    enabled: true
    scopes: [
      recoveryVault.id
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      allOf: [
        {
          name: 'BackupFailure'
          metricName: 'BackupJobFailureCount'
          operator: 'GreaterThan'
          threshold: 0
          timeAggregation: 'Total'
          dimensions: []
        }
      ]
    }
    autoMitigate: true
    targetResourceType: 'Microsoft.RecoveryServices/vaults'
  }
}

// Outputs
output backupStorageAccountId string = backupStorage.id
output recoveryVaultId string = recoveryVault.id
output automationAccountId string = automationAccount.id
output vmBackupPolicyId string = vmBackupPolicy.id
output keyVaultBackupPolicyId string = keyVaultBackupPolicy.id
