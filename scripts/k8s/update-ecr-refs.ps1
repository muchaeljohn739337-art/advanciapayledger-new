#!/usr/bin/env pwsh
#requires -Version 7

param(
    [string]$AccountId = "",
    [string]$Region = "us-east-1"
)

function Update-ImageReference {
    param(
        [string]$FilePath,
        [string]$ServiceName,
        [string]$AccountId,
        [string]$Region
    )
    
    if (-not (Test-Path $FilePath)) {
        Write-Warning "File not found: $FilePath"
        return
    }
    
    $placeholder = "ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/$ServiceName"
    $replacement = "$AccountId.dkr.ecr.$Region.amazonaws.com/$ServiceName"
    
    $content = Get-Content -Raw -Path $FilePath
    if ($content -match [regex]::Escape($placeholder)) {
        $updated = $content -replace [regex]::Escape($placeholder), $replacement
        Set-Content -Path $FilePath -Value $updated -NoNewline -Encoding UTF8
        Write-Host "Updated: $FilePath"
    } else {
        Write-Host "No placeholder found in: $FilePath"
    }
}

if (-not $AccountId) {
    Write-Host "Fetching AWS account ID..."
    $AccountId = (aws sts get-caller-identity --query Account --output text)
    if (-not $AccountId) {
        Write-Error "Could not determine AWS account ID. Ensure AWS CLI is configured."
        exit 1
    }
    Write-Host "Using account: $AccountId"
}

$RepoRoot = Split-Path -Parent $PSScriptRoot
$OverlaysBase = Join-Path $RepoRoot "infra/k8s/overlays/prod/platform-core"

$services = @("health-billing-service", "patient-link-service", "phi-docs-service")

foreach ($svc in $services) {
    $deploymentPath = Join-Path $OverlaysBase "$svc/deployment.yaml"
    Update-ImageReference -FilePath $deploymentPath -ServiceName $svc -AccountId $AccountId -Region $Region
}

Write-Host "Done. Commit changes and sync via ArgoCD."
