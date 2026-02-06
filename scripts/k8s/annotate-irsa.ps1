#requires -Version 7
param(
    [string]$RepoRoot = "$(Split-Path -Parent (Split-Path -Parent $PSCommandPath))",
    [string]$TerraformEnvPath = "infra/terraform/envs/prod",

    [string]$HealthBillingRoleArn,
    [string]$PatientLinkRoleArn,
    [string]$PhiDocsRoleArn
)

function Get-RoleArnsFromTerraform([string]$envPath) {
    $fullPath = Join-Path -Path $RepoRoot -ChildPath $envPath
    if (-not (Test-Path $fullPath)) {
        throw "Terraform env path not found: $fullPath"
    }
    Push-Location $fullPath
    try {
        $json = terraform output -json 2>$null
        if (-not $json) { return $null }
        $obj = $json | ConvertFrom-Json
        return @{ 
            health_billing = $obj.health_billing_irsa_role_arn.value;
            patient_link   = $obj.patient_link_irsa_role_arn.value;
            phi_docs       = $obj.phi_docs_irsa_role_arn.value
        }
    } catch {
        return $null
    } finally {
        Pop-Location
    }
}

function Annotate-SA([string]$filePath, [string]$roleArn) {
    if (-not (Test-Path $filePath)) { throw "ServiceAccount file not found: $filePath" }
    $content = Get-Content -Raw -Path $filePath
    if ($content -match "REPLACE_WITH_IRSA_ROLE_ARN") {
        $new = $content -replace "REPLACE_WITH_IRSA_ROLE_ARN", [Regex]::Escape($roleArn)
        Set-Content -Path $filePath -Value $new -Encoding UTF8
        Write-Host "Annotated: $filePath"
    } else {
        Write-Host "No placeholder found in $filePath; skipping."
    }
}

$arns = @{ health_billing = $HealthBillingRoleArn; patient_link = $PatientLinkRoleArn; phi_docs = $PhiDocsRoleArn }
$tfArns = Get-RoleArnsFromTerraform -envPath $TerraformEnvPath
foreach ($key in $arns.Keys) {
    if (-not $arns[$key] -and $tfArns -and $tfArns[$key]) { $arns[$key] = $tfArns[$key] }
}

if (-not $arns.health_billing -or -not $arns.patient_link -or -not $arns.phi_docs) {
    Write-Warning "Missing one or more IRSA ARNs. Provide parameters or ensure terraform outputs exist: health_billing_irsa_role_arn, patient_link_irsa_role_arn, phi_docs_irsa_role_arn."
}

$hbPath = Join-Path $RepoRoot "infra/k8s/overlays/prod/platform-core/health-billing-service/serviceaccount.yaml"
$plPath = Join-Path $RepoRoot "infra/k8s/overlays/prod/platform-core/patient-link-service/serviceaccount.yaml"
$pdPath = Join-Path $RepoRoot "infra/k8s/overlays/prod/platform-core/phi-docs-service/serviceaccount.yaml"

if ($arns.health_billing) { Annotate-SA -filePath $hbPath -roleArn $arns.health_billing }
if ($arns.patient_link) { Annotate-SA -filePath $plPath -roleArn $arns.patient_link }
if ($arns.phi_docs) { Annotate-SA -filePath $pdPath -roleArn $arns.phi_docs }

Write-Host "Done. Commit changes and apply overlays via ArgoCD."
