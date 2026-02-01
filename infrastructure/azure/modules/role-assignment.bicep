@description('Principal ID to assign role to')
param principalId string

@description('Role definition ID to assign')
param roleDefinitionId string

@description('Scope for role assignment')
param scope string

@description('Optional name for role assignment')
param name string = ''

resource roleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: !empty(name) ? name : guid(principalId, scope, roleDefinitionId)
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roleDefinitionId)
    principalId: principalId
    principalType: 'User'
    scope: scope
  }
}
