@description('Azure location for all resources')
param location string = resourceGroup().location

@description('Environment name for resource naming')
param environment string = 'prod'

@description('GitHub repository owner')
param githubOwner string

@description('GitHub repository name')
param githubRepo string

@description('List of developer user principals')
param developers array = []

@description('List of service principal names for CI/CD')
param servicePrincipals array = []

// Resource Group
resource rg 'Microsoft.Resources/resourceGroups@2021-04-01' = {
  name: 'rg-${environment}-advancia'
  location: location
}

// Log Analytics Workspace
resource law 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: 'law-${environment}-advancia'
  location: location
  resourceGroup: rg.name
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// Application Insights
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: 'ai-${environment}-advancia'
  location: location
  resourceGroup: rg.name
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: law.id
  }
}

// Key Vault
resource kv 'Microsoft.KeyVault/vaults@2022-07-01' = {
  name: 'kv-${environment}-advancia'
  location: location
  resourceGroup: rg.name
  properties: {
    tenantId: tenant().tenantId
    sku: {
      family: 'S'
      name: 'standard'
    }
    enableRbacAuthorization: true
    enabledForTemplateDeployment: true
    enabledForDeployment: true
    networkAcls: {
      defaultAction: 'Deny'
      bypass: 'AzureServices'
      ipRules: []
      virtualNetworkRules: []
    }
    publicNetworkAccess: 'Disabled'
  }
}

// User Assigned Managed Identity for VM
resource vmIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: 'id-${environment}-vm-advancia'
  location: location
  resourceGroup: rg.name
  properties: {}
}

// User Assigned Managed Identity for CI/CD
resource ciIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: 'id-${environment}-ci-advancia'
  location: location
  resourceGroup: rg.name
  properties: {}
}

// Federated Credential for GitHub OIDC
resource githubFederatedCredential 'Microsoft.ManagedIdentity/federatedIdentityCredentials@2023-01-31' = {
  name: 'github-${githubOwner}-${githubRepo}'
  parent: ciIdentity
  properties: {
    issuer: 'https://token.actions.githubusercontent.com'
    subject: 'repo:${githubOwner}/${githubRepo}:ref:refs/heads/main'
    audiences: [
      'api://AzureADTokenExchange'
    ]
  }
}

// Role Assignments for Key Vault Access
resource kvVmAccess 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(vmIdentity.id, kv.id, 'Key Vault Secrets User')
  scope: kv
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6') // Key Vault Secrets User
    principalId: vmIdentity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

resource kvCiAccess 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(ciIdentity.id, kv.id, 'Key Vault Secrets Officer')
  scope: kv
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'b86a8fe4-44ce-4968-9ee4-3ea2de7a6bb6') // Key Vault Secrets Officer
    principalId: ciIdentity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

// Developer Role Assignments
module developerRoles 'modules/role-assignment.bicep' = [for developer in developers: {
  name: 'developer-role-${developer}'
  params: {
    principalId: developer
    roleDefinitionId: '8e3af657-a8ff-443c-a75c-2fe8c4bcb635' // Contributor
    scope: rg.id
  }
}]

// Service Principal Role Assignments
module spRoles 'modules/role-assignment.bicep' = [for sp in servicePrincipals: {
  name: 'sp-role-${sp}'
  params: {
    principalId: sp
    roleDefinitionId: 'b24988ac-6180-42a0-ab88-20f7382dd24c' // Contributor
    scope: rg.id
  }
}]

// Custom Roles for Zero Trust
resource customRoleDev 'Microsoft.Authorization/roleDefinitions@2022-04-01' = {
  name: 'advancia-developer'
  properties: {
    description: 'Custom role for developers with limited access'
    assignableScopes: [
      rg.id
    ]
    permissions: [
      {
        actions: [
          'Microsoft.Resources/subscriptions/resourceGroups/read'
          'Microsoft.Network/virtualNetworks/read'
          'Microsoft.Network/networkSecurityGroups/read'
          'Microsoft.Compute/virtualMachines/read'
          'Microsoft.KeyVault/vaults/read'
          'Microsoft.KeyVault/vaults/secrets/list'
          'Microsoft.KeyVault/vaults/secrets/get'
          'Microsoft.Insights/components/read'
          'Microsoft.OperationalInsights/workspaces/read'
          'Microsoft.ContainerRegistry/registries/read'
          'Microsoft.ContainerRegistry/registries/pull'
        ]
        notActions: [
          'Microsoft.KeyVault/vaults/secrets/delete'
          'Microsoft.KeyVault/vaults/secrets/set'
          'Microsoft.Compute/virtualMachines/write'
          'Microsoft.Compute/virtualMachines/delete'
          'Microsoft.Network/virtualNetworks/write'
          'Microsoft.Network/virtualNetworks/delete'
          'Microsoft.Network/networkSecurityGroups/write'
          'Microsoft.Network/networkSecurityGroups/delete'
        ]
        dataActions: []
        notDataActions: []
      }
  }
}

resource customRoleCi 'Microsoft.Authorization/roleDefinitions@2022-04-01' = {
  name: 'advancia-cicd'
  properties: {
    description: 'Custom role for CI/CD with deployment permissions'
    assignableScopes: [
      rg.id
    ]
    permissions: [
      {
        actions: [
          'Microsoft.Resources/subscriptions/resourceGroups/read'
          'Microsoft.Network/virtualNetworks/read'
          'Microsoft.Network/networkSecurityGroups/read'
          'Microsoft.Compute/virtualMachines/read'
          'Microsoft.Compute/virtualMachines/runCommand/action'
          'Microsoft.ContainerRegistry/registries/read'
          'Microsoft.ContainerRegistry/registries/pull'
          'Microsoft.ContainerRegistry/registries/write'
          'Microsoft.KeyVault/vaults/read'
          'Microsoft.KeyVault/vaults/secrets/list'
          'Microsoft.KeyVault/vaults/secrets/get'
          'Microsoft.KeyVault/vaults/secrets/set'
          'Microsoft.Insights/components/read'
          'Microsoft.OperationalInsights/workspaces/read'
        ]
        notActions: [
          'Microsoft.KeyVault/vaults/delete'
          'Microsoft.KeyVault/vaults/secrets/delete'
          'Microsoft.Compute/virtualMachines/delete'
          'Microsoft.Network/virtualNetworks/delete'
          'Microsoft.Network/networkSecurityGroups/delete'
        ]
        dataActions: []
        notDataActions: []
      }
  }
}

// Output important values
output resourceId string = rg.id
output keyVaultName string = kv.name
output vmIdentityId string = vmIdentity.id
output ciIdentityId string = ciIdentity.id
output logAnalyticsWorkspaceId string = law.id
output applicationInsightsId string = appInsights.id
