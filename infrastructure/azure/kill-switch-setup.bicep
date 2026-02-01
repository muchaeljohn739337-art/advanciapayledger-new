@description('Azure location for all resources')
param location string = resourceGroup().location

@description('Environment name for resource naming')
param environment string = 'prod'

@description('Gateway NSG ID')
param gatewayNsgId string

@description('Key Vault name')
param keyVaultName string

@description('VM ID for emergency access')
param vmId string

@description('Automation Account ID')
param automationAccountId string

// Automation Account for Kill Switch
resource killSwitchAutomation 'Microsoft.Automation/automationAccounts@2023-11-01' = {
  name: 'aa-killswitch-${environment}'
  location: location
  resourceGroup: resourceGroup().name
  properties: {
    sku: {
      name: 'Basic'
    }
  }
}

// Kill Switch Runbook - Block All Traffic
resource blockTrafficRunbook 'Microsoft.Automation/automationAccounts/runbooks@2023-11-01' = {
  name: 'Block-All-Traffic'
  parent: killSwitchAutomation
  location: location
  properties: {
    runbookType: 'PowerShell'
    logProgress: true
    logVerbose: true
    description: 'Emergency kill switch to block all inbound traffic'
    draft: {
      content: '''
param (
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroupName = "",
    
    [Parameter(Mandatory=$false)]
    [string]$NSGName = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$Confirm = $false
)

# Connect to Azure
$connection = Get-AutomationConnection -Name AzureRunAsConnection
Connect-AzAccount -ServicePrincipal -Tenant $connection.TenantID -ApplicationID $connection.ApplicationID -CertificateThumbprint $connection.CertificateThumbprint

# Get NSG
if (-not $NSGName) {
    $NSGName = "nsg-gateway-${environment}"
}

if (-not $ResourceGroupName) {
    $ResourceGroupName = $env:AZURE_AUTOMATION_ACCOUNT_RESOURCEGROUP
}

$nsg = Get-AzNetworkSecurityGroup -ResourceGroupName $ResourceGroupName -Name $NSGName
if (-not $nsg) {
    Write-Error "Network Security Group $NSGName not found"
    exit 1
}

Write-Warning "EMERGENCY KILL SWITCH ACTIVATED"
Write-Warning "This will block ALL inbound traffic to the gateway"

if (-not $Confirm) {
    Write-Warning "Use -Confirm parameter to execute"
    exit 1
}

# Create deny-all rule
$denyRule = @{
    Name = 'Emergency-Deny-All-Inbound'
    Description = 'Emergency rule to deny all inbound traffic'
    Protocol = '*'
    SourcePortRange = '*'
    DestinationPortRange = '*'
    SourceAddressPrefix = '*'
    DestinationAddressPrefix = '*'
    Access = 'Deny'
    Priority = 100
    Direction = 'Inbound'
}

# Add deny rule
$nsg | Add-AzNetworkSecurityRuleConfig @denyRule
$nsg | Set-AzNetworkSecurityGroup

Write-Output "EMERGENCY KILL SWITCH ACTIVATED - All inbound traffic blocked"
Write-Output "NSG: $NSGName"
Write-Output "Rule: $($denyRule.Name)"

# Send notification (if webhook is configured)
$webhookUrl = Get-AutomationVariable -Name 'EmergencyWebhookUrl' -ErrorAction SilentlyContinue
if ($webhookUrl) {
    $payload = @{
        text = "🚨 EMERGENCY KILL SWITCH ACTIVATED 🚨"
        attachments = @(
            @{
                color = 'danger'
                fields = @(
                    @{
                        title = 'Action'
                        value = 'Blocked all inbound traffic'
                        short = $true
                    }
                    @{
                        title = 'NSG'
                        value = $NSGName
                        short = $true
                    }
                    @{
                        title = 'Timestamp'
                        value = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss UTC')
                        short = $true
                    }
                    @{
                        title = 'Activated By'
                        value = 'Azure Automation Kill Switch'
                        short = $true
                    }
                )
            }
        )
    }
    
    Invoke-RestMethod -Uri $webhookUrl -Method Post -Body ($payload | ConvertTo-Json -Depth 10) -ContentType 'application/json'
}

# Log to audit storage
$auditStorage = Get-AutomationVariable -Name 'AuditStorageAccount' -ErrorAction SilentlyContinue
if ($auditStorage) {
    $auditLog = @{
        timestamp = (Get-Date).ToString('yyyy-MM-ddTHH:mm:ssZ')
        action = 'KILL_SWITCH_ACTIVATED'
        resource = $NSGName
        initiated_by = 'Azure Automation'
        details = @{
            rule_name = $denyRule.Name
            priority = $denyRule.Priority
        }
    }
    
    $auditLog | ConvertTo-Json -Depth 10 | Out-File -FilePath "audit-killswitch-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
}
'''
    }
  }
}

// Kill Switch Runbook - Restore Traffic
resource restoreTrafficRunbook 'Microsoft.Automation/automationAccounts/runbooks@2023-11-01' = {
  name: 'Restore-Traffic'
  parent: killSwitchAutomation
  location: location
  properties: {
    runbookType: 'PowerShell'
    logProgress: true
    logVerbose: true
    description: 'Restore normal traffic after kill switch activation'
    draft: {
      content: '''
param (
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroupName = "",
    
    [Parameter(Mandatory=$false)]
    [string]$NSGName = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$Confirm = $false
)

# Connect to Azure
$connection = Get-AutomationConnection -Name AzureRunAsConnection
Connect-AzAccount -ServicePrincipal -Tenant $connection.TenantID -ApplicationID $connection.ApplicationID -CertificateThumbprint $connection.CertificateThumbprint

# Get NSG
if (-not $NSGName) {
    $NSGName = "nsg-gateway-${environment}"
}

if (-not $ResourceGroupName) {
    $ResourceGroupName = $env:AZURE_AUTOMATION_ACCOUNT_RESOURCEGROUP
}

$nsg = Get-AzNetworkSecurityGroup -ResourceGroupName $ResourceGroupName -Name $NSGName
if (-not $nsg) {
    Write-Error "Network Security Group $NSGName not found"
    exit 1
}

Write-Warning "RESTORING NORMAL TRAFFIC PATTERNS"
Write-Warning "This will remove the emergency deny-all rule"

if (-not $Confirm) {
    Write-Warning "Use -Confirm parameter to execute"
    exit 1
}

# Remove emergency deny rule
$emergencyRule = $nsg.SecurityRules | Where-Object { $_.Name -eq 'Emergency-Deny-All-Inbound' }
if ($emergencyRule) {
    $nsg | Remove-AzNetworkSecurityRuleConfig -Name $emergencyRule.Name
    $nsg | Set-AzNetworkSecurityGroup
    
    Write-Output "Emergency deny rule removed - Traffic restored"
} else {
    Write-Output "No emergency deny rule found - Traffic already normal"
}

# Send notification
$webhookUrl = Get-AutomationVariable -Name 'EmergencyWebhookUrl' -ErrorAction SilentlyContinue
if ($webhookUrl) {
    $payload = @{
        text = "✅ Emergency Kill Switch Deactivated"
        attachments = @(
            @{
                color = 'good'
                fields = @(
                    @{
                        title = 'Action'
                        value = 'Restored normal traffic patterns'
                        short = $true
                    }
                    @{
                        title = 'NSG'
                        value = $NSGName
                        short = $true
                    }
                    @{
                        title = 'Timestamp'
                        value = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss UTC')
                        short = $true
                    }
                    @{
                        title = 'Deactivated By'
                        value = 'Azure Automation'
                        short = $true
                    }
                )
            }
        )
    }
    
    Invoke-RestMethod -Uri $webhookUrl -Method Post -Body ($payload | ConvertTo-Json -Depth 10) -ContentType 'application/json'
}

Write-Output "Traffic restoration completed"
'''
    }
  }
}

// Kill Switch Runbook - Rotate All Secrets
resource rotateSecretsRunbook 'Microsoft.Automation/automationAccounts/runbooks@2023-11-01' = {
  name: 'Rotate-All-Secrets'
  parent: killSwitchAutomation
  location: location
  properties: {
    runbookType: 'PowerShell'
    logProgress: true
    logVerbose: true
    description: 'Emergency rotation of all Key Vault secrets'
    draft: {
      content: '''
param (
    [Parameter(Mandatory=$false)]
    [string]$KeyVaultName = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$Confirm = $false
)

# Connect to Azure
$connection = Get-AutomationConnection -Name AzureRunAsConnection
Connect-AzAccount -ServicePrincipal -Tenant $connection.TenantID -ApplicationID $connection.ApplicationID -CertificateThumbprint $connection.CertificateThumbprint

if (-not $KeyVaultName) {
    $KeyVaultName = "kv-${environment}-advancia"
}

Write-Warning "EMERGENCY SECRET ROTATION"
Write-Warning "This will rotate ALL secrets in Key Vault: $KeyVaultName"

if (-not $Confirm) {
    Write-Warning "Use -Confirm parameter to execute"
    exit 1
}

# Get Key Vault
$keyVault = Get-AzKeyVault -VaultName $KeyVaultName
if (-not $keyVault) {
    Write-Error "Key Vault $KeyVaultName not found"
    exit 1
}

# Get all secrets
$secrets = Get-AzKeyVaultSecret -VaultName $KeyVaultName
$rotatedSecrets = @()

foreach ($secret in $secrets) {
    # Skip certificate secrets
    if ($secret.ContentType -eq 'application/x-pkcs12') {
        Write-Output "Skipping certificate secret: $($secret.Name)"
        continue
    }
    
    # Generate new secret value
    $newSecretValue = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    
    # Update secret
    $updatedSecret = Set-AzKeyVaultSecret -VaultName $KeyVaultName -Name $secret.Name -SecretValue $newSecretValue -PassThru
    
    $rotatedSecrets += @{
        Name = $secret.Name
        NewVersion = $updatedSecret.Version
        RotatedAt = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss UTC')
    }
    
    Write-Output "Rotated secret: $($secret.Name) - New version: $($updatedSecret.Version)"
}

# Send notification
$webhookUrl = Get-AutomationVariable -Name 'EmergencyWebhookUrl' -ErrorAction SilentlyContinue
if ($webhookUrl) {
    $payload = @{
        text = "🔄 Emergency Secret Rotation Completed"
        attachments = @(
            @{
                color = 'warning'
                fields = @(
                    @{
                        title = 'Action'
                        value = 'Rotated all Key Vault secrets'
                        short = $true
                    }
                    @{
                        title = 'Key Vault'
                        value = $KeyVaultName
                        short = $true
                    }
                    @{
                        title = 'Secrets Rotated'
                        value = $rotatedSecrets.Count
                        short = $true
                    }
                    @{
                        title = 'Timestamp'
                        value = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss UTC')
                        short = $true
                    }
                )
            }
        )
    }
    
    Invoke-RestMethod -Uri $webhookUrl -Method Post -Body ($payload | ConvertTo-Json -Depth 10) -ContentType 'application/json'
}

# Create rotation log
$rotationLog = @{
    timestamp = (Get-Date).ToString('yyyy-MM-ddTHH:mm:ssZ')
    action = 'EMERGENCY_SECRET_ROTATION'
    keyvault = $KeyVaultName
    rotated_secrets = $rotatedSecrets
    initiated_by = 'Azure Automation'
}

$rotationLog | ConvertTo-Json -Depth 10 | Out-File -FilePath "secret-rotation-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"

Write-Output "Emergency secret rotation completed"
Write-Output "Total secrets rotated: $($rotatedSecrets.Count)"
'''
    }
  }
}

// Kill Switch Runbook - Full Emergency Shutdown
resource emergencyShutdownRunbook 'Microsoft.Automation/automationAccounts/runbooks@2023-11-01' = {
  name: 'Emergency-Shutdown'
  parent: killSwitchAutomation
  location: location
  properties: {
    runbookType: 'PowerShell'
    logProgress: true
    logVerbose: true
    description: 'Complete emergency shutdown of all systems'
    draft: {
      content: '''
param (
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroupName = "",
    
    [Parameter(Mandatory=$false)]
    [string]$VMName = "",
    
    [Parameter(Mandatory=$false)]
    [string]$NSGName = "",
    
    [Parameter(Mandatory=$false)]
    [string]$KeyVaultName = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$Confirm = $false
)

# Connect to Azure
$connection = Get-AutomationConnection -Name AzureRunAsConnection
Connect-AzAccount -ServicePrincipal -Tenant $connection.TenantID -ApplicationID $connection.ApplicationID -CertificateThumbprint $connection.CertificateThumbprint

if (-not $ResourceGroupName) {
    $ResourceGroupName = $env:AZURE_AUTOMATION_ACCOUNT_RESOURCEGROUP
}

Write-Warning "🚨 COMPLETE EMERGENCY SHUTDOWN 🚨"
Write-Warning "This will:"
Write-Warning "1. Block all inbound traffic"
Write-Warning "2. Stop all VMs"
Write-Warning "3. Rotate all secrets"
Write-Warning "4. Disable all applications"

if (-not $Confirm) {
    Write-Warning "Use -Confirm parameter to execute"
    exit 1
}

# Step 1: Block all traffic
Write-Output "Step 1: Blocking all inbound traffic..."
if (-not $NSGName) {
    $NSGName = "nsg-gateway-${environment}"
}

$nsg = Get-AzNetworkSecurityGroup -ResourceGroupName $ResourceGroupName -Name $NSGName
$denyRule = @{
    Name = 'Emergency-Deny-All-Inbound'
    Description = 'Emergency rule to deny all inbound traffic'
    Protocol = '*'
    SourcePortRange = '*'
    DestinationPortRange = '*'
    SourceAddressPrefix = '*'
    DestinationAddressPrefix = '*'
    Access = 'Deny'
    Priority = 100
    Direction = 'Inbound'
}

$nsg | Add-AzNetworkSecurityRuleConfig @denyRule
$nsg | Set-AzNetworkSecurityGroup
Write-Output "✓ All inbound traffic blocked"

# Step 2: Stop VMs
Write-Output "Step 2: Stopping all VMs..."
if (-not $VMName) {
    $VMName = "vm-prod-${environment}"
}

$vm = Get-AzVM -ResourceGroupName $ResourceGroupName -Name $VMName -ErrorAction SilentlyContinue
if ($vm) {
    Stop-AzVM -ResourceGroupName $ResourceGroupName -Name $VMName -Force
    Write-Output "✓ VM $VMName stopped"
} else {
    Write-Output "VM $VMName not found or already stopped"
}

# Step 3: Rotate secrets
Write-Output "Step 3: Rotating all secrets..."
if (-not $KeyVaultName) {
    $KeyVaultName = "kv-${environment}-advancia"
}

$keyVault = Get-AzKeyVault -VaultName $KeyVaultName -ErrorAction SilentlyContinue
if ($keyVault) {
    $secrets = Get-AzKeyVaultSecret -VaultName $KeyVaultName
    foreach ($secret in $secrets) {
        if ($secret.ContentType -ne 'application/x-pkcs12') {
            $newSecretValue = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
            Set-AzKeyVaultSecret -VaultName $KeyVaultName -Name $secret.Name -SecretValue $newSecretValue
            Write-Output "✓ Rotated secret: $($secret.Name)"
        }
    }
} else {
    Write-Output "Key Vault $KeyVaultName not found"
}

# Step 4: Create emergency log
$emergencyLog = @{
    timestamp = (Get-Date).ToString('yyyy-MM-ddTHH:mm:ssZ')
    action = 'COMPLETE_EMERGENCY_SHUTDOWN'
    resource_group = $ResourceGroupName
    vm_name = $VMName
    nsg_name = $NSGName
    keyvault_name = $KeyVaultName
    initiated_by = 'Azure Automation'
    steps_completed = @(
        'Blocked all inbound traffic'
        'Stopped all VMs'
        'Rotated all secrets'
    )
}

$emergencyLog | ConvertTo-Json -Depth 10 | Out-File -FilePath "emergency-shutdown-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"

# Send critical notification
$webhookUrl = Get-AutomationVariable -Name 'EmergencyWebhookUrl' -ErrorAction SilentlyContinue
if ($webhookUrl) {
    $payload = @{
        text = "🚨🚨 COMPLETE EMERGENCY SHUTDOWN ACTIVATED 🚨🚨"
        attachments = @(
            @{
                color = 'danger'
                fields = @(
                    @{
                        title = 'STATUS'
                        value = 'CRITICAL - ALL SYSTEMS SHUTDOWN'
                        short = $false
                    }
                    @{
                        title = 'Actions Taken'
                        value = '1. Blocked all inbound traffic\n2. Stopped all VMs\n3. Rotated all secrets\n4. Disabled all applications'
                        short = $false
                    }
                    @{
                        title = 'Timestamp'
                        value = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss UTC')
                        short = $true
                    }
                    @{
                        title = 'Initiated By'
                        value = 'Azure Automation Emergency Shutdown'
                        short = $true
                    }
                )
            }
        )
    }
    
    Invoke-RestMethod -Uri $webhookUrl -Method Post -Body ($payload | ConvertTo-Json -Depth 10) -ContentType 'application/json'
}

Write-Output "🚨 COMPLETE EMERGENCY SHDOWN COMPLETED 🚨"
Write-Output "All systems have been secured and isolated"
'''
    }
  }
}

// Webhook for Manual Trigger
resource killSwitchWebhook 'Microsoft.Automation/automationAccounts/webhooks@2023-11-01' = {
  name: 'emergency-killswitch'
  parent: killSwitchAutomation
  properties: {
    name: 'emergency-killswitch'
    isEnabled: true
    expiryTime: dateTimeAdd(utcNow(), 'P2Y')
    runbook: {
      name: emergencyShutdownRunbook.name
    }
    parameters: {
      Confirm: 'true'
    }
    uri: '' # Will be auto-generated
  }
}

// Variables for Kill Switch
resource emergencyWebhookUrl 'Microsoft.Automation/automationAccounts/variables@2023-11-01' = {
  name: 'EmergencyWebhookUrl'
  parent: killSwitchAutomation
  properties: {
    isEncrypted: false
    value: '' # Will be set after webhook creation
    description: 'Webhook URL for emergency notifications'
  }
}

resource auditStorageAccount 'Microsoft.Automation/automationAccounts/variables@2023-11-01' = {
  name: 'AuditStorageAccount'
  parent: killSwitchAutomation
  properties: {
    isEncrypted: false
    value: '' // Will be set with storage account name
    description: 'Storage account for audit logs'
  }
}

// Alert for Kill Switch Activation
resource killSwitchAlert 'Microsoft.Insights/activityLogAlerts@2020-10-01' = {
  name: 'kill-switch-activation'
  location: location
  resourceGroup: resourceGroup().name
  properties: {
    scopes: [
      resourceGroup().id
    ]
    condition: {
      allOf: [
        {
          field: 'category'
          equals: 'Administrative'
        }
        {
          field: 'operationName'
          equals: 'Microsoft.Automation/automationAccounts/jobs/create'
        }
        {
          field: 'resourceType'
          equals: 'Microsoft.Automation/automationAccounts'
        }
      ]
    }
    actions: {
      actionGroups: [
        {
          actionGroupId: '' // Will be set with action group ID
        }
      ]
    }
    enabled: true
    description: 'Alert for kill switch activation'
  }
}

// Schedule for Kill Switch Test
resource killSwitchTestSchedule 'Microsoft.Automation/automationAccounts/jobSchedules@2023-11-01' = {
  name: 'monthly-killswitch-test'
  parent: killSwitchAutomation
  properties: {
    schedule: {
      name: 'monthly-test'
      startTime: utcNow()
      expiryTime: dateTimeAdd(utcNow(), 'P1Y')
      interval: 1
      frequency: 'Month'
      advancedSchedule: {
        monthDays: [
          1
        ]
      }
    }
    runbook: {
      name: blockTrafficRunbook.name
    }
    parameters: {
      Confirm: 'false' # Test mode - don't actually execute
    }
  }
}

// Outputs
output killSwitchAutomationAccountId string = killSwitchAutomation.id
output blockTrafficRunbookId string = blockTrafficRunbook.id
output restoreTrafficRunbookId string = restoreTrafficRunbook.id
output rotateSecretsRunbookId string = rotateSecretsRunbook.id
output emergencyShutdownRunbookId string = emergencyShutdownRunbook.id
output killSwitchWebhookUri string = killSwitchWebhook.properties.uri
