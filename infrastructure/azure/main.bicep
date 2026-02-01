@description('Azure location for all resources')
param location string = resourceGroup().location

@description('Environment name for resource naming')
param environment string = 'prod'

@description('GitHub repository owner')
param githubOwner string

@description('GitHub repository name')
param githubRepo string

@description('Docker image tag to deploy')
param imageTag string = 'latest'

@description('Admin SSH public key')
param adminSshPublicKey string = ''

@description('List of developer user principals')
param developers array = []

@description('Database connection string')
param databaseConnectionString string = ''

@description('SMTP settings')
param smtpSettings object = {
  server: ''
  port: 587
  username: ''
  password: ''
}

@description('External API keys')
param externalApiKeys array = []

// Deploy all infrastructure components
module identity 'identity-setup.bicep' = {
  name: 'identity-deployment'
  params: {
    location: location
    environment: environment
    githubOwner: githubOwner
    githubRepo: githubRepo
    developers: developers
    servicePrincipals: [] // Will be populated during deployment
  }
}

module network 'network-setup.bicep' = {
  name: 'network-deployment'
  params: {
    location: location
    environment: environment
    resourceGroupName: resourceGroup().name
  }
}

module compute 'compute-setup.bicep' = {
  name: 'compute-deployment'
  params: {
    location: location
    environment: environment
    adminUsername: 'azureuser'
    sshPublicKey: !empty(adminSshPublicKey) ? adminSshPublicKey : 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC7...'
    prodSubnetId: network.outputs.prodSubnetId
    vmIdentityId: identity.outputs.vmIdentityId
    keyVaultName: identity.outputs.keyVaultName
    logAnalyticsWorkspaceId: identity.outputs.logAnalyticsWorkspaceId
  }
}

module secrets 'secrets-setup.bicep' = {
  name: 'secrets-deployment'
  params: {
    location: location
    environment: environment
    keyVaultName: identity.outputs.keyVaultName
    vmIdentityId: identity.outputs.vmIdentityId
    ciIdentityId: identity.outputs.ciIdentityId
    prodSubnetId: network.outputs.prodSubnetId
    developers: developers
    appJwtSecret: newGuid()
    databaseConnectionString: databaseConnectionString
    smtpPassword: smtpSettings.password
    externalApiKeys: externalApiKeys
    sslPrivateKey: '' // Will be populated during deployment
    sslPublicKey: '' // Will be populated during deployment
  }
}

module gateway 'gateway-setup.bicep' = {
  name: 'gateway-deployment'
  params: {
    location: location
    environment: environment
    gatewaySubnetId: network.outputs.gatewaySubnetId
    prodSubnetId: network.outputs.prodSubnetId
    gatewayNsgId: network.outputs.gatewayNsgId
    keyVaultName: secrets.outputs.keyVaultName
    keyVaultUri: secrets.outputs.keyVaultUri
    certificateId: secrets.outputs.certificateId
    imageTag: imageTag
    vmId: compute.outputs.vmId
  }
}

module monitoring 'monitoring-setup.bicep' = {
  name: 'monitoring-deployment'
  params: {
    location: location
    environment: environment
    logAnalyticsWorkspaceId: identity.outputs.logAnalyticsWorkspaceId
    applicationInsightsId: identity.outputs.applicationInsightsId
    vmId: compute.outputs.vmId
    gatewaySubnetId: network.outputs.gatewaySubnetId
    prodSubnetId: network.outputs.prodSubnetId
    keyVaultName: secrets.outputs.keyVaultName
  }
}

module backup 'backup-setup.bicep' = {
  name: 'backup-deployment'
  params: {
    location: location
    environment: environment
    vmId: compute.outputs.vmId
    keyVaultName: secrets.outputs.keyVaultName
    storageAccountId: compute.outputs.storageAccountId
    recoveryVaultId: compute.outputs.recoveryVaultId
  }
}

module killswitch 'killswitch-setup.bicep' = {
  name: 'killswitch-deployment'
  params: {
    location: location
    environment: environment
    gatewayNsgId: network.outputs.gatewayNsgId
    keyVaultName: secrets.outputs.keyVaultName
    vmId: compute.outputs.vmId
    automationAccountId: secrets.outputs.automationAccountId
  }
}

// Outputs for consumption by CI/CD and monitoring
output gatewayUrl string = gateway.outputs.gatewayUrl
output keyVaultName string = secrets.outputs.keyVaultName
output vmId string = compute.outputs.vmId
output logAnalyticsWorkspaceId string = identity.outputs.logAnalyticsWorkspaceId
output applicationInsightsId string = identity.outputs.applicationInsightsId
output networkSecurityGroups object = {
  gateway: network.outputs.gatewayNsgId
  sandbox: network.outputs.sandboxNsgId
  prod: network.outputs.prodNsgId
}
output managedIdentities object = {
  vm: identity.outputs.vmIdentityId
  ci: identity.outputs.ciIdentityId
}
output certificates object = {
  ssl: secrets.outputs.certificateId
}
output backups object = {
  recoveryVault: compute.outputs.recoveryVaultId
  storageAccount: compute.outputs.storageAccountId
}
