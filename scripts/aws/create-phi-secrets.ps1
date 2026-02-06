#requires -Version 7
param(
    [string]$Region = "us-east-1",
    [string]$Profile = "",
    [string]$Env = "prod",
    [string]$Prefix = "advancia",
    [switch]$DryRun,

    [string]$HealthBillingDatabaseUrl,
    [string]$HealthBillingJwtSecret,

    [string]$PatientLinkDatabaseUrl,
    [string]$PatientLinkJwtSecret,

    [string]$PhiDocsDatabaseUrl,
    [string]$PhiDocsJwtSecret
)

function Ensure-AwsCli() {
    $aws = Get-Command aws -ErrorAction SilentlyContinue
    if (-not $aws) {
        Write-Error "AWS CLI not found. Please install: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
        exit 1
    }
}

function Invoke-Aws([string]$args) {
    if ([string]::IsNullOrWhiteSpace($Profile)) {
        $cmd = "aws --region $Region $args"
    } else {
        $cmd = "aws --profile $Profile --region $Region $args"
    }
    # Use PowerShell to run to capture exit code
    $result = Invoke-Expression $cmd
    return $result
}

function Ensure-Secret([string]$name, [string]$json) {
    if ($DryRun) {
        Write-Host "DRYRUN: Ensure secret '$name' with keys: database_url, jwt_access_secret"
        return
    }
    try {
        Invoke-Aws "secretsmanager describe-secret --secret-id `"$name`"" | Out-Null
        Write-Host "Updating secret '$name'..."
        Invoke-Aws "secretsmanager put-secret-value --secret-id `"$name`" --secret-string `'$json`'" | Out-Null
    } catch {
        Write-Host "Creating secret '$name'..."
        Invoke-Aws "secretsmanager create-secret --name `"$name`" --description `"Service secret for $name`" --secret-string `'$json`'" | Out-Null
    }
}

Ensure-AwsCli

if (-not $DryRun -and -not $HealthBillingDatabaseUrl) { $HealthBillingDatabaseUrl = Read-Host "Enter Health Billing database_url" }
if (-not $DryRun -and -not $HealthBillingJwtSecret) { $HealthBillingJwtSecret = Read-Host "Enter Health Billing jwt_access_secret" }

if (-not $DryRun -and -not $PatientLinkDatabaseUrl) { $PatientLinkDatabaseUrl = Read-Host "Enter Patient Link database_url" }
if (-not $DryRun -and -not $PatientLinkJwtSecret) { $PatientLinkJwtSecret = Read-Host "Enter Patient Link jwt_access_secret" }

if (-not $DryRun -and -not $PhiDocsDatabaseUrl) { $PhiDocsDatabaseUrl = Read-Host "Enter PHI Docs database_url" }
if (-not $DryRun -and -not $PhiDocsJwtSecret) { $PhiDocsJwtSecret = Read-Host "Enter PHI Docs jwt_access_secret" }

$hbName = "$Prefix/$Env/health-billing-service"
$plName = "$Prefix/$Env/patient-link-service"
$pdName = "$Prefix/$Env/phi-docs-service"

$hbJson = (@{ database_url = $HealthBillingDatabaseUrl; jwt_access_secret = $HealthBillingJwtSecret } | ConvertTo-Json -Compress)
$plJson = (@{ database_url = $PatientLinkDatabaseUrl; jwt_access_secret = $PatientLinkJwtSecret } | ConvertTo-Json -Compress)
$pdJson = (@{ database_url = $PhiDocsDatabaseUrl; jwt_access_secret = $PhiDocsJwtSecret } | ConvertTo-Json -Compress)

Ensure-Secret -name $hbName -json $hbJson
Ensure-Secret -name $plName -json $plJson
Ensure-Secret -name $pdName -json $pdJson

Write-Host "Done: Secrets ensured in region '$Region' (profile: '$Profile'). DryRun=$($DryRun.IsPresent)"
