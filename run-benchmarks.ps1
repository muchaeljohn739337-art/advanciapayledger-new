# Master Benchmark Script for Windows (PowerShell)
# Runs all performance benchmarks for Advancia PayLedger

param(
    [Parameter(Mandatory=$true)]
    [string]$ApiUrl,
    
    [Parameter(Mandatory=$true)]
    [string]$FrontendUrl,
    
    [Parameter(Mandatory=$true)]
    [string]$DatabaseUrl
)

Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║  Advancia PayLedger Benchmark Suite   ║" -ForegroundColor Blue
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""

# Create results directory
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$resultsDir = "benchmark-results-$timestamp"
New-Item -ItemType Directory -Path $resultsDir -Force | Out-Null

Write-Host "📋 Configuration:" -ForegroundColor Green
Write-Host "  API URL: $ApiUrl"
Write-Host "  Frontend URL: $FrontendUrl"
Write-Host "  Database: $($DatabaseUrl -replace '@.*', '@***')"
Write-Host "  Results Directory: $resultsDir"
Write-Host ""

# Check prerequisites
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow

$missingTools = @()

if (-not (Get-Command k6 -ErrorAction SilentlyContinue)) {
    $missingTools += "k6"
}

if (-not (Get-Command lighthouse -ErrorAction SilentlyContinue)) {
    $missingTools += "lighthouse"
}

if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
    $missingTools += "psql"
}

if ($missingTools.Count -gt 0) {
    Write-Host "❌ Missing required tools: $($missingTools -join ', ')" -ForegroundColor Red
    Write-Host ""
    Write-Host "Install missing tools:"
    foreach ($tool in $missingTools) {
        switch ($tool) {
            "k6" {
                Write-Host "  k6: choco install k6 or see https://k6.io/docs/getting-started/installation/"
            }
            "lighthouse" {
                Write-Host "  lighthouse: npm install -g lighthouse"
            }
            "psql" {
                Write-Host "  psql: Install PostgreSQL client tools"
            }
        }
    }
    exit 1
}

Write-Host "✓ All prerequisites installed" -ForegroundColor Green
Write-Host ""

# Start benchmarks
$startTime = Get-Date

Write-Host "═══════════════════════════════════════" -ForegroundColor Blue
Write-Host "  1/3: API Load Testing (k6)" -ForegroundColor Blue
Write-Host "═══════════════════════════════════════" -ForegroundColor Blue
Write-Host ""

if (Test-Path "load-test.js") {
    $env:API_URL = $ApiUrl
    k6 run load-test.js --out "json=$resultsDir/k6-results.json"
    if (Test-Path "load-test-results.json") {
        Move-Item "load-test-results.json" $resultsDir -Force
    }
    Write-Host "✓ API load testing complete" -ForegroundColor Green
} else {
    Write-Host "⚠ load-test.js not found, skipping..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Blue
Write-Host "  2/3: Database Benchmarking" -ForegroundColor Blue
Write-Host "═══════════════════════════════════════" -ForegroundColor Blue
Write-Host ""

# Database benchmark (simplified for Windows)
$dbResultsFile = "$resultsDir/db-benchmark-results.txt"
"Database Benchmark Results - $(Get-Date)" | Out-File $dbResultsFile
"========================================" | Out-File $dbResultsFile -Append
"" | Out-File $dbResultsFile -Append

Write-Host "Running database benchmarks..." -ForegroundColor Yellow

# Test 1: Connection Test
Write-Host "Test 1: Connection Test"
$start = Get-Date
psql "$DatabaseUrl" -c "SELECT 1;" 2>$null | Out-Null
$duration = ((Get-Date) - $start).TotalMilliseconds
Write-Host "✓ Connection time: $([math]::Round($duration, 2))ms"
"Connection time: $([math]::Round($duration, 2))ms" | Out-File $dbResultsFile -Append

# Test 2: Simple SELECT
Write-Host "Test 2: Simple SELECT Query"
$start = Get-Date
psql "$DatabaseUrl" -c "SELECT COUNT(*) FROM users;" 2>$null | Out-Null
$duration = ((Get-Date) - $start).TotalMilliseconds
Write-Host "✓ Simple SELECT: $([math]::Round($duration, 2))ms"
"Simple SELECT: $([math]::Round($duration, 2))ms" | Out-File $dbResultsFile -Append

Write-Host "✓ Database benchmarking complete" -ForegroundColor Green

Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Blue
Write-Host "  3/3: Frontend Performance (Lighthouse)" -ForegroundColor Blue
Write-Host "═══════════════════════════════════════" -ForegroundColor Blue
Write-Host ""

$pages = @("/", "/login", "/dashboard", "/wallet", "/transactions")
$lighthouseDir = "$resultsDir/lighthouse"
New-Item -ItemType Directory -Path $lighthouseDir -Force | Out-Null

foreach ($page in $pages) {
    $pageName = $page -replace '/', '-'
    if ($pageName -eq '-' -or $pageName -eq '') {
        $pageName = 'home'
    }
    
    Write-Host "Testing: $page" -ForegroundColor Yellow
    
    try {
        lighthouse "$FrontendUrl$page" `
            --output=html `
            --output=json `
            --output-path="$lighthouseDir/$pageName" `
            --chrome-flags="--headless --no-sandbox" `
            --quiet `
            --only-categories=performance,accessibility,best-practices,seo 2>$null
        
        Write-Host "✓ Completed: $page"
    } catch {
        Write-Host "⚠ Could not test $page" -ForegroundColor Yellow
    }
}

Write-Host "✓ Frontend benchmarking complete" -ForegroundColor Green

# Calculate total time
$endTime = Get-Date
$duration = $endTime - $startTime
$minutes = [math]::Floor($duration.TotalMinutes)
$seconds = [math]::Floor($duration.TotalSeconds % 60)

Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Blue
Write-Host "✅ All benchmarks complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════" -ForegroundColor Blue
Write-Host ""
Write-Host "📊 Results Summary:" -ForegroundColor Green
Write-Host "  Total Duration: ${minutes}m ${seconds}s"
Write-Host "  Results Directory: $resultsDir/"
Write-Host ""
Write-Host "📁 Generated Reports:" -ForegroundColor Yellow
Get-ChildItem $resultsDir -Recurse -File | ForEach-Object {
    Write-Host "  - $($_.Name) ($([math]::Round($_.Length/1KB, 2)) KB)"
}
Write-Host ""
Write-Host "💡 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Review HTML reports in $resultsDir/"
Write-Host "  2. Check JSON files for detailed metrics"
Write-Host "  3. Compare results with previous benchmarks"
Write-Host "  4. Identify performance bottlenecks"
Write-Host ""
Write-Host "🎉 Benchmark suite completed successfully!" -ForegroundColor Green
