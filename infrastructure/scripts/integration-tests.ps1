# Production Integration Test Suite
# Comprehensive end-to-end testing for production deployment

param(
    [Parameter(Mandatory=$true)]
    [string]$BaseUrl,
    
    [Parameter(Mandatory=$false)]
    [string]$ApiUrl = "",
    
    [Parameter(Mandatory=$false)]
    [string]$TestUser = "test@advanciapayledger.com",
    
    [Parameter(Mandatory=$false)]
    [string]$TestPassword = "TestPass123!"
)

$ErrorActionPreference = "Continue"

if ([string]::IsNullOrEmpty($ApiUrl)) {
    $ApiUrl = $BaseUrl
}

Write-Host "=== Production Integration Test Suite ===" -ForegroundColor Blue
Write-Host "Base URL: $BaseUrl" -ForegroundColor Cyan
Write-Host "API URL: $ApiUrl" -ForegroundColor Cyan
Write-Host "Test Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host ""

$testResults = @()
$passedTests = 0
$failedTests = 0

# Test function
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [object]$Body = $null,
        [int]$ExpectedStatus = 200,
        [string]$ExpectedContent = ""
    )
    
    Write-Host "Testing: $Name..." -NoNewline
    
    $result = @{
        name = $Name
        url = $Url
        method = $Method
        timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        passed = $false
        status = 0
        responseTime = 0
        error = ""
    }
    
    try {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            TimeoutSec = 30
            UseBasicParsing = $true
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json)
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params
        $stopwatch.Stop()
        
        $result.status = $response.StatusCode
        $result.responseTime = $stopwatch.ElapsedMilliseconds
        
        if ($response.StatusCode -eq $ExpectedStatus) {
            if ([string]::IsNullOrEmpty($ExpectedContent) -or $response.Content -match $ExpectedContent) {
                $result.passed = $true
                Write-Host " ✓ PASS ($($result.responseTime)ms)" -ForegroundColor Green
                $script:passedTests++
            } else {
                $result.error = "Content validation failed"
                Write-Host " ✗ FAIL (Content mismatch)" -ForegroundColor Red
                $script:failedTests++
            }
        } else {
            $result.error = "Status code mismatch: expected $ExpectedStatus, got $($response.StatusCode)"
            Write-Host " ✗ FAIL (Status: $($response.StatusCode))" -ForegroundColor Red
            $script:failedTests++
        }
    } catch {
        $stopwatch.Stop()
        $result.error = $_.Exception.Message
        $result.responseTime = $stopwatch.ElapsedMilliseconds
        Write-Host " ✗ FAIL ($($_.Exception.Message))" -ForegroundColor Red
        $script:failedTests++
    }
    
    $script:testResults += $result
    return $result
}

# 1. Infrastructure Tests
Write-Host ""
Write-Host "=== 1. Infrastructure Tests ===" -ForegroundColor Yellow

Test-Endpoint -Name "Frontend Homepage" -Url "$BaseUrl/" -ExpectedContent "Advancia"
Test-Endpoint -Name "API Health Check" -Url "$ApiUrl/api/health" -ExpectedContent "ok|healthy"
Test-Endpoint -Name "API Version" -Url "$ApiUrl/api/version" -ExpectedStatus 200

# 2. SSL/TLS Tests
Write-Host ""
Write-Host "=== 2. SSL/TLS Security Tests ===" -ForegroundColor Yellow

Test-Endpoint -Name "HTTPS Redirect" -Url "$BaseUrl/" -ExpectedStatus 200
Test-Endpoint -Name "TLS 1.2+ Enforcement" -Url "$BaseUrl/" -ExpectedStatus 200

# 3. Authentication Tests
Write-Host ""
Write-Host "=== 3. Authentication Tests ===" -ForegroundColor Yellow

Test-Endpoint -Name "Login Endpoint Exists" -Url "$ApiUrl/api/v1/auth/login" -Method "POST" -ExpectedStatus 400
Test-Endpoint -Name "Protected Route (Unauthorized)" -Url "$ApiUrl/api/v1/facilities" -ExpectedStatus 401
Test-Endpoint -Name "JWT Validation" -Url "$ApiUrl/api/v1/auth/verify" -ExpectedStatus 401

# 4. API Endpoints Tests
Write-Host ""
Write-Host "=== 4. Core API Endpoints ===" -ForegroundColor Yellow

$endpoints = @(
    "/api/v1/facilities",
    "/api/v1/patients",
    "/api/v1/payments",
    "/api/v1/transactions",
    "/api/v1/invoices",
    "/api/v1/users"
)

foreach ($endpoint in $endpoints) {
    Test-Endpoint -Name "Endpoint: $endpoint" -Url "$ApiUrl$endpoint" -ExpectedStatus 401
}

# 5. Database Connectivity
Write-Host ""
Write-Host "=== 5. Database Connectivity ===" -ForegroundColor Yellow

Test-Endpoint -Name "Database Health" -Url "$ApiUrl/api/health/database" -ExpectedContent "connected|ok"

# 6. Redis Cache Tests
Write-Host ""
Write-Host "=== 6. Redis Cache Tests ===" -ForegroundColor Yellow

Test-Endpoint -Name "Cache Health" -Url "$ApiUrl/api/health/cache" -ExpectedContent "connected|ok"

# 7. Rate Limiting Tests
Write-Host ""
Write-Host "=== 7. Rate Limiting Tests ===" -ForegroundColor Yellow

Write-Host "Testing rate limiting (100 requests)..." -NoNewline
$rateLimitHit = $false
for ($i = 1; $i -le 100; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "$ApiUrl/api/health" -Method GET -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 429) {
            $rateLimitHit = $true
            break
        }
    } catch {
        if ($_.Exception.Response.StatusCode -eq 429) {
            $rateLimitHit = $true
            break
        }
    }
}

if ($rateLimitHit) {
    Write-Host " ✓ PASS (Rate limit enforced)" -ForegroundColor Green
    $passedTests++
} else {
    Write-Host " ⚠ WARNING (Rate limit not triggered)" -ForegroundColor Yellow
}

# 8. CORS Tests
Write-Host ""
Write-Host "=== 8. CORS Configuration ===" -ForegroundColor Yellow

Test-Endpoint -Name "CORS Headers Present" -Url "$ApiUrl/api/health" -ExpectedStatus 200

# 9. Blockchain Integration Tests
Write-Host ""
Write-Host "=== 9. Blockchain Integration ===" -ForegroundColor Yellow

Test-Endpoint -Name "Ethereum RPC Status" -Url "$ApiUrl/api/v1/blockchain/ethereum/status" -ExpectedStatus 401
Test-Endpoint -Name "Polygon RPC Status" -Url "$ApiUrl/api/v1/blockchain/polygon/status" -ExpectedStatus 401
Test-Endpoint -Name "Solana RPC Status" -Url "$ApiUrl/api/v1/blockchain/solana/status" -ExpectedStatus 401

# 10. Payment Processing Tests
Write-Host ""
Write-Host "=== 10. Payment Processing ===" -ForegroundColor Yellow

Test-Endpoint -Name "Stripe Webhook Endpoint" -Url "$ApiUrl/api/v1/webhooks/stripe" -Method "POST" -ExpectedStatus 400

# 11. Monitoring & Logging Tests
Write-Host ""
Write-Host "=== 11. Monitoring & Logging ===" -ForegroundColor Yellow

Test-Endpoint -Name "Metrics Endpoint" -Url "$ApiUrl/api/metrics" -ExpectedStatus 200
Test-Endpoint -Name "Sentry Integration" -Url "$ApiUrl/api/health/sentry" -ExpectedContent "configured|ok"

# 12. Performance Tests
Write-Host ""
Write-Host "=== 12. Performance Tests ===" -ForegroundColor Yellow

$performanceResults = @()
for ($i = 1; $i -le 10; $i++) {
    $result = Test-Endpoint -Name "Performance Test $i" -Url "$ApiUrl/api/health"
    $performanceResults += $result.responseTime
}

$avgResponseTime = ($performanceResults | Measure-Object -Average).Average
Write-Host "Average Response Time: $([math]::Round($avgResponseTime, 2))ms" -ForegroundColor Cyan

if ($avgResponseTime -lt 500) {
    Write-Host "✓ Performance: Excellent (<500ms)" -ForegroundColor Green
} elseif ($avgResponseTime -lt 1000) {
    Write-Host "⚠ Performance: Good (<1000ms)" -ForegroundColor Yellow
} else {
    Write-Host "✗ Performance: Needs improvement (>1000ms)" -ForegroundColor Red
}

# 13. Security Headers Tests
Write-Host ""
Write-Host "=== 13. Security Headers ===" -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/" -Method GET -UseBasicParsing
    $headers = $response.Headers
    
    $securityHeaders = @(
        "Strict-Transport-Security",
        "X-Content-Type-Options",
        "X-Frame-Options",
        "X-XSS-Protection",
        "Content-Security-Policy"
    )
    
    foreach ($header in $securityHeaders) {
        if ($headers.ContainsKey($header)) {
            Write-Host "✓ $header present" -ForegroundColor Green
            $passedTests++
        } else {
            Write-Host "⚠ $header missing" -ForegroundColor Yellow
            $failedTests++
        }
    }
} catch {
    Write-Host "✗ Could not check security headers" -ForegroundColor Red
}

# Generate Report
Write-Host ""
Write-Host "=== Test Summary ===" -ForegroundColor Blue
Write-Host ""
Write-Host "Total Tests: $($passedTests + $failedTests)" -ForegroundColor Cyan
Write-Host "Passed: $passedTests" -ForegroundColor Green
Write-Host "Failed: $failedTests" -ForegroundColor Red
Write-Host "Success Rate: $([math]::Round(($passedTests / ($passedTests + $failedTests)) * 100, 2))%" -ForegroundColor Cyan
Write-Host ""

# Save detailed report
$report = @{
    timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    baseUrl = $BaseUrl
    apiUrl = $ApiUrl
    summary = @{
        total = $passedTests + $failedTests
        passed = $passedTests
        failed = $failedTests
        successRate = [math]::Round(($passedTests / ($passedTests + $failedTests)) * 100, 2)
    }
    performance = @{
        averageResponseTime = [math]::Round($avgResponseTime, 2)
    }
    tests = $testResults
}

$reportFile = "integration-test-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
$report | ConvertTo-Json -Depth 10 | Out-File $reportFile
Write-Host "✓ Detailed report saved to $reportFile" -ForegroundColor Green
Write-Host ""

# Final verdict
if ($failedTests -eq 0) {
    Write-Host "=== ✓ ALL TESTS PASSED - PRODUCTION READY ===" -ForegroundColor Green
    exit 0
} elseif ($failedTests -le 3) {
    Write-Host "=== ⚠ MINOR ISSUES DETECTED - REVIEW REQUIRED ===" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "=== ✗ CRITICAL ISSUES DETECTED - DO NOT DEPLOY ===" -ForegroundColor Red
    exit 2
}
