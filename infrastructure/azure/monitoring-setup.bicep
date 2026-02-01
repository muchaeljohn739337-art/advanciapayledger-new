@description('Azure location for all resources')
param location string = resourceGroup().location

@description('Environment name for resource naming')
param environment string = 'prod'

@description('Log Analytics Workspace ID')
param logAnalyticsWorkspaceId string

@description('Application Insights ID')
param applicationInsightsId string

@description('VM ID for monitoring')
param vmId string

@description('Gateway subnet ID')
param gatewaySubnetId string

@description('Production subnet ID')
param prodSubnetId string

@description('Key Vault name')
param keyVaultName string

@description('Email for alerts')
param alertEmail string = ''

@description('Teams webhook for alerts')
param teamsWebhook string = ''

// Get existing Log Analytics Workspace
resource law 'Microsoft.OperationalInsights/workspaces@2022-10-01' existing = {
  name: split(logAnalyticsWorkspaceId, '/')[8]
  scope: resourceGroup()
}

// Get existing Application Insights
resource appInsights 'Microsoft.Insights/components@2020-02-02' existing = {
  name: split(applicationInsightsId, '/')[8]
  scope: resourceGroup()
}

// Action Group for Alerts
resource actionGroup 'Microsoft.Insights/actionGroups@2023-01-01' = {
  name: 'ag-emergency-${environment}'
  location: location
  resourceGroup: resourceGroup().name
  properties: {
    groupShortName: 'emrg'
    enabled: true
    emailReceivers: !empty(alertEmail) ? [
      {
        name: 'security-team'
        emailAddress: alertEmail
        useCommonAlertSchema: true
      }
    ] : []
    webhookReceivers: !empty(teamsWebhook) ? [
      {
        name: 'teams-channel'
        serviceUri: teamsWebhook
        useCommonAlertSchema: true
      }
    ] : []
  }
}

// VM Monitoring Alerts
resource vmCpuAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'vm-high-cpu-${environment}'
  location: location
  resourceGroup: resourceGroup().name
  properties: {
    description: 'Alert when VM CPU usage is high'
    severity: 2
    enabled: true
    scopes: [
      vmId
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      allOf: [
        {
          name: 'HighCPU'
          metricName: 'Percentage CPU'
          operator: 'GreaterThan'
          threshold: 80
          timeAggregation: 'Average'
          dimensions: []
        }
      ]
    }
    autoMitigate: true
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

resource vmMemoryAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'vm-high-memory-${environment}'
  location: location
  resourceGroup: resourceGroup().name
  properties: {
    description: 'Alert when VM memory usage is high'
    severity: 2
    enabled: true
    scopes: [
      vmId
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      allOf: [
        {
          name: 'HighMemory'
          metricName: 'Available Memory Space'
          operator: 'LessThan'
          threshold: 1073741824  # 1GB in bytes
          timeAggregation: 'Average'
          dimensions: []
        }
      ]
    }
    autoMitigate: true
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

resource vmDiskAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'vm-high-disk-${environment}'
  location: location
  resourceGroup: resourceGroup().name
  properties: {
    description: 'Alert when VM disk usage is high'
    severity: 3
    enabled: true
    scopes: [
      vmId
    ]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      allOf: [
        {
          name: 'HighDisk'
          metricName: 'OS Disk Space Used Percentage'
          operator: 'GreaterThan'
          threshold: 85
          timeAggregation: 'Average'
          dimensions: []
        }
      ]
    }
    autoMitigate: true
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

// Network Security Group Alerts
resource nsgDenyAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'nsg-deny-traffic-${environment}'
  location: location
  resourceGroup: resourceGroup().name
  properties: {
    description: 'Alert when NSG denies traffic'
    severity: 3
    enabled: true
    scopes: [
      split(gatewaySubnetId, '/subnets/')[0]
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      allOf: [
        {
          name: 'NSGDeny'
          metricName: 'NetworkSecurityGroupRuleDenied'
          operator: 'GreaterThan'
          threshold: 10
          timeAggregation: 'Total'
          dimensions: []
        }
      ]
    }
    autoMitigate: false
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

// Key Vault Alerts
resource keyVaultAlert 'Microsoft.Insights/activityLogAlerts@2020-10-01' = {
  name: 'keyvault-access-${environment}'
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
          equals: 'Audit'
        }
        {
          field: 'operationName'
          equals: 'Microsoft.KeyVault/vaults/secrets/get'
        }
        {
          field: 'resourceType'
          equals: 'Microsoft.KeyVault/vaults'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
    enabled: true
    description: 'Alert for Key Vault secret access'
  }
}

// Application Insights Alerts
resource applicationErrorAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'app-errors-${environment}'
  location: location
  resourceGroup: resourceGroup().name
  properties: {
    description: 'Alert when application errors increase'
    severity: 2
    enabled: true
    scopes: [
      applicationInsightsId
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      allOf: [
        {
          name: 'HighErrorRate'
          metricNamespace: 'microsoft.insights/components'
          metricName: 'exceptions/count'
          operator: 'GreaterThan'
          threshold: 10
          timeAggregation: 'Total'
          dimensions: []
        }
      ]
    }
    autoMitigate: false
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

resource applicationResponseAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'app-response-time-${environment}'
  location: location
  resourceGroup: resourceGroup().name
  properties: {
    description: 'Alert when application response time is high'
    severity: 3
    enabled: true
    scopes: [
      applicationInsightsId
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      allOf: [
        {
          name: 'HighResponseTime'
          metricNamespace: 'microsoft.insights/components'
          metricName: 'request/duration'
          operator: 'GreaterThan'
          threshold: 2000  # 2 seconds
          timeAggregation: 'Average'
          dimensions: []
        }
      ]
    }
    autoMitigate: true
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

// Log Analytics Queries for Advanced Monitoring
resource failedLoginQuery 'Microsoft.OperationalInsights/workspaces/savedSearches@2020-08-01' = {
  name: 'failed-logins-query'
  parent: law
  properties: {
    category: 'Security'
    displayName: 'Failed Login Attempts'
    query: 'AzureActivity | where Category == "Audit" and OperationNameValue == "Microsoft.Compute/virtualMachines/loginAction/action" and ActivityStatusValue == "Failure" | summarize count() by bin(TimeGenerated, 1h), CallerIpAddress | order by count_ desc'
    version: 1
  }
}

resource suspiciousActivityQuery 'Microsoft.OperationalInsights/workspaces/savedSearches@2020-08-01' = {
  name: 'suspicious-activity-query'
  parent: law
  properties: {
    category: 'Security'
    displayName: 'Suspicious Activity Detection'
    query: 'AzureActivity | where Category == "Security" and OperationNameValue contains "Delete" or OperationNameValue contains "Stop" | summarize count() by OperationNameValue, CallerIpAddress, bin(TimeGenerated, 1h) | order by count_ desc'
    version: 1
  }
}

resource networkThreatQuery 'Microsoft.OperationalInsights/workspaces/savedSearches@2020-08-01' = {
  name: 'network-threat-query'
  parent: law
  properties: {
    category: 'Security'
    displayName: 'Network Threat Detection'
    query: 'AzureNetworkAnalytics | where FlowType == "External" and ExtIP != "0.0.0.0" | summarize count() by ExtIP, bin(TimeGenerated, 1h) | where count_ > 100 | order by count_ desc'
    version: 1
  }
}

// Alert Rules based on Log Analytics Queries
resource failedLoginAlert 'Microsoft.Insights/scheduledQueryRules@2021-02-01' = {
  name: 'failed-login-alert-${environment}'
  location: location
  resourceGroup: resourceGroup().name
  properties: {
    displayName: 'High Failed Login Rate'
    description: 'Alert when failed login attempts exceed threshold'
    enabled: true
    source: {
      query: 'AzureActivity | where Category == "Audit" and OperationNameValue == "Microsoft.Compute/virtualMachines/loginAction/action" and ActivityStatusValue == "Failure" | summarize count() by bin(TimeGenerated, 5m) | where count_ > 5'
      dataSourceId: law.id
      queryType: 'ResultCount'
    }
    schedule: {
      frequencyInMinutes: 5
      timeWindowInMinutes: 15
    }
    action: {
      azureActionGroups: [
        {
          actionGroupId: actionGroup.id
        }
      ]
    }
    autoMitigate: true
  }
}

resource suspiciousActivityAlert 'Microsoft.Insights/scheduledQueryRules@2021-02-01' = {
  name: 'suspicious-activity-alert-${environment}'
  location: location
  resourceGroup: resourceGroup().name
  properties: {
    displayName: 'Suspicious Activity Detected'
    description: 'Alert when suspicious activity is detected'
    enabled: true
    source: {
      query: 'AzureActivity | where Category == "Security" and (OperationNameValue contains "Delete" or OperationNameValue contains "Stop" or OperationNameValue contains "Terminate") | summarize count() by bin(TimeGenerated, 5m) | where count_ > 0'
      dataSourceId: law.id
      queryType: 'ResultCount'
    }
    schedule: {
      frequencyInMinutes: 5
      timeWindowInMinutes: 15
    }
    action: {
      azureActionGroups: [
        {
          actionGroupId: actionGroup.id
        }
      ]
    }
    autoMitigate: false
  }
}

// Dashboard for Monitoring
resource monitoringDashboard 'Microsoft.Portal/dashboards@2020-09-01' = {
  name: 'dashboard-security-${environment}'
  location: location
  resourceGroup: resourceGroup().name
  properties: {
    lenses: {
      '0': {
        order: 1,
        parts: {
          '0': {
            position: {
              x: 0
              y: 0
              rowSpan: 2
              colSpan: 6
            }
            metadata: {
              inputs: [
                {
                  name: 'ComponentId'
                  value: applicationInsightsId
                }
                {
                  name: 'TimeRange'
                  value: 'PT1H'
                }
              ]
              type: 'Extension/Microsoft_Azure_Monitoring/Part/ComponentsOverview'
            }
          }
          '1': {
            position: {
              x: 6
              y: 0
              rowSpan: 2
              colSpan: 6
            }
            metadata: {
              inputs: [
                {
                  name: 'ComponentId'
                  value: vmId
                }
                {
                  name: 'TimeRange'
                  value: 'PT1H'
                }
              ]
              type: 'Extension/Microsoft_Azure_Monitoring/Part/VMInsights'
            }
          }
          '2': {
            position: {
              x: 0
              y: 2
              rowSpan: 2
              colSpan: 4
            }
            metadata: {
              inputs: [
                {
                  name: 'Query'
                  value: 'AzureActivity | where Category == "Security" | summarize count() by OperationNameValue | order by count_ desc | render piechart'
                }
                {
                  name: 'ResourceId'
                  value: law.id
                }
              ]
              type: 'Extension/Microsoft_Azure_Monitoring/Part/LogsQuery'
            }
          }
          '3': {
            position: {
              x: 4
              y: 2
              rowSpan: 2
              colSpan: 4
            }
            metadata: {
              inputs: [
                {
                  name: 'Query'
                  value: 'AzureActivity | where Category == "Audit" and TimeGenerated > ago(1h) | summarize count() by ActivityStatusValue | render barchart'
                }
                {
                  name: 'ResourceId'
                  value: law.id
                }
              ]
              type: 'Extension/Microsoft_Azure_Monitoring/Part/LogsQuery'
            }
          }
          '4': {
            position: {
              x: 8
              y: 2
              rowSpan: 2
              colSpan: 4
            }
            metadata: {
              inputs: [
                {
                  name: 'ComponentId'
                  value: keyVaultName
                }
                {
                  name: 'TimeRange'
                  value: 'PT1H'
                }
              ]
              type: 'Extension/Microsoft_Azure_KeyVault/Part/KeyVaultVaultOverview'
            }
          }
        }
      }
    }
    metadata: {
      title: 'Advancia Security Monitoring Dashboard'
    }
  }
}

// Workbook for Security Analysis
resource securityWorkbook 'Microsoft.Insights/workbooks@2021-03-01' = {
  name: 'workbook-security-${environment}'
  location: location
  resourceGroup: resourceGroup().name
  kind: 'shared'
  properties: {
    displayName: 'Security Analysis Workbook'
    serializedData: '{"version":"Notebook/1.0","items":[{"type":1,"content":{"json":"## Security Analysis\\n\\nThis workbook provides comprehensive security monitoring and analysis for the Advancia platform."},"conditionalVisibility":null,"name":"text - 1"},{"type":3,"content":{"version":"KqlItem/1.0","query":"AzureActivity\\n| where Category == \\"Security\\"\\n| summarize count() by OperationNameValue\\n| order by count_ desc\\n| render piechart","size":1,"title":"Security Operations Distribution","queryType":0,"resourceId":{"subscriptions":["${subscription().subscriptionId}"]},"gridSettings":{"pagination":{"size":100,"showPaging":true}}},"conditionalVisibility":null,"name":"query - 1"}],"isLocked":false}'
  }
}

// Automation Account for Monitoring Scripts
resource monitoringAutomation 'Microsoft.Automation/automationAccounts@2023-11-01' = {
  name: 'aa-monitoring-${environment}'
  location: location
  resourceGroup: resourceGroup().name
  properties: {
    sku: {
      name: 'Basic'
    }
  }
}

// Monitoring Runbook
resource monitoringRunbook 'Microsoft.Automation/automationAccounts/runbooks@2023-11-01' = {
  name: 'Security-Health-Check'
  parent: monitoringAutomation
  location: location
  properties: {
    runbookType: 'PowerShell'
    logProgress: true
    logVerbose: true
    description: 'Runbook to perform comprehensive security health checks'
    draft: {
      content: '''
# Security Health Check Runbook
param (
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroupName = "rg-prod-advancia",
    
    [Parameter(Mandatory=$false)]
    [string]$LogAnalyticsWorkspaceName = "law-prod-advancia"
)

# Connect to Azure
$connection = Get-AutomationConnection -Name AzureRunAsConnection
Connect-AzAccount -ServicePrincipal -Tenant $connection.TenantID -ApplicationID $connection.ApplicationID -CertificateThumbprint $connection.CertificateThumbprint

Write-Output "Starting Security Health Check..."

# Check VM Security Status
Write-Output "Checking VM Security Status..."
$vms = Get-AzVM -ResourceGroupName $ResourceGroupName
foreach ($vm in $vms) {
    $vmStatus = Get-AzVM -ResourceGroupName $ResourceGroupName -Name $vm.Name -Status
    Write-Output "VM: $($vm.Name) - Status: $($vmStatus.Statuses[1].DisplayStatus)"
    
    # Check for security extensions
    $extensions = Get-AzVMExtension -ResourceGroupName $ResourceGroupName -VMName $vm.Name
    $securityExtensions = $extensions | Where-Object { $_.ExtensionType -like "*Security*" -or $_.ExtensionType -like "*Monitoring*" }
    Write-Output "  Security Extensions: $($securityExtensions.Count)"
}

# Check Network Security Groups
Write-Output "Checking Network Security Groups..."
$nsgs = Get-AzNetworkSecurityGroup -ResourceGroupName $ResourceGroupName
foreach ($nsg in $nsgs) {
    $denyRules = $nsg.SecurityRules | Where-Object { $_.Access -eq "Deny" }
    Write-Output "NSG: $($nsg.Name) - Deny Rules: $($denyRules.Count)"
    
    # Check for emergency deny rule
    $emergencyRule = $denyRules | Where-Object { $_.Name -like "*Emergency*" }
    if ($emergencyRule) {
        Write-Output "  🚨 EMERGENCY RULE DETECTED: $($emergencyRule.Name)"
    }
}

# Check Key Vault Access
Write-Output "Checking Key Vault Access..."
$keyVaults = Get-AzKeyVault -ResourceGroupName $ResourceGroupName
foreach ($kv in $keyVaults) {
    $secrets = Get-AzKeyVaultSecret -VaultName $kv.VaultName
    Write-Output "KeyVault: $($kv.VaultName) - Secrets: $($secrets.Count)"
    
    # Check for recent access
    $recentAccess = Get-AzKeyVault -VaultName $kv.VaultName -InRemovedState $false | Select-Object LastModified
    Write-Output "  Last Modified: $($kv.LastModified)"
}

# Check Log Analytics for Security Events
Write-Output "Checking Log Analytics for Security Events..."
$workspace = Get-AzOperationalInsightsWorkspace -Name $LogAnalyticsWorkspaceName -ResourceGroupName $ResourceGroupName

# Query for failed logins
$failedLogins = Invoke-AzOperationalInsightsQuery -WorkspaceId $workspace.ResourceId -Query "AzureActivity | where Category == 'Audit' and ActivityStatusValue == 'Failure' | summarize count() by bin(TimeGenerated, 1h)" -ErrorAction SilentlyContinue
if ($failedLogins) {
    Write-Output "Failed Logins (Last Hour): $($failedLogins.Results[0].Count)"
}

# Query for security events
$securityEvents = Invoke-AzOperationalInsightsQuery -WorkspaceId $workspace.ResourceId -Query "AzureActivity | where Category == 'Security' | summarize count() by bin(TimeGenerated, 1h)" -ErrorAction SilentlyContinue
if ($securityEvents) {
    Write-Output "Security Events (Last Hour): $($securityEvents.Results[0].Count)"
}

Write-Output "Security Health Check Completed"
'''
    }
  }
}

// Schedule for Security Health Check
resource securityCheckSchedule 'Microsoft.Automation/automationAccounts/jobSchedules@2023-11-01' = {
  name: 'daily-security-check'
  parent: monitoringAutomation
  properties: {
    schedule: {
      name: 'daily-check'
      startTime: utcNow()
      expiryTime: dateTimeAdd(utcNow(), 'P1Y')
      interval: 1
      frequency: 'Day'
      advancedSchedule: {
        hour: 6
        minute: 0
      }
    }
    runbook: {
      name: monitoringRunbook.name
    }
    parameters: {
      ResourceGroupName: resourceGroup().name
      LogAnalyticsWorkspaceName: split(logAnalyticsWorkspaceId, '/')[8]
    }
  }
}

// Outputs
output actionGroupId string = actionGroup.id
output dashboardId string = monitoringDashboard.id
output workbookId string = securityWorkbook.id
output automationAccountId string = monitoringAutomation.id
