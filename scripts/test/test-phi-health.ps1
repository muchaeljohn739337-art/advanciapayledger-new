param(
  [int]$Port = 3000
)

Write-Host "Testing health endpoint on port $Port..."
try {
  $resp = Invoke-RestMethod -Uri "http://localhost:$Port/health" -Method GET -TimeoutSec 3
  Write-Host "OK: $($resp | ConvertTo-Json -Compress)"
} catch {
  Write-Warning "Failed to reach /health on port $Port: $($_.Exception.Message)"
}
