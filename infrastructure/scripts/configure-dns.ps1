# DNS Configuration Script for Production Domain
# This script configures DNS records for Advancia Pay Ledger production deployment

param(
    [Parameter(Mandatory=$true)]
    [string]$Domain,
    
    [Parameter(Mandatory=$true)]
    [string]$GatewayPublicIP,
    
    [Parameter(Mandatory=$false)]
    [string]$DNSProvider = "Azure",
    
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroup = "rg-prod-advancia"
)

$ErrorActionPreference = "Stop"

Write-Host "=== DNS Configuration for Production ===" -ForegroundColor Blue
Write-Host "Domain: $Domain" -ForegroundColor Cyan
Write-Host "Gateway IP: $GatewayPublicIP" -ForegroundColor Cyan
Write-Host "DNS Provider: $DNSProvider" -ForegroundColor Cyan
Write-Host ""

# Function to configure Azure DNS
function Configure-AzureDNS {
    param($Domain, $IP, $ResourceGroup)
    
    Write-Host "Configuring Azure DNS..." -ForegroundColor Yellow
    
    # Extract zone name (e.g., example.com from api.example.com)
    $zoneName = ($Domain -split '\.')[-2..-1] -join '.'
    $recordName = ($Domain -split '\.')[0]
    
    # Check if DNS zone exists
    $zone = az network dns zone show --name $zoneName --resource-group $ResourceGroup 2>$null
    
    if (-not $zone) {
        Write-Host "Creating DNS zone: $zoneName" -ForegroundColor Cyan
        az network dns zone create --name $zoneName --resource-group $ResourceGroup
        Write-Host "✓ DNS zone created" -ForegroundColor Green
        
        # Display nameservers
        $nameservers = az network dns zone show --name $zoneName --resource-group $ResourceGroup --query nameServers -o json | ConvertFrom-Json
        Write-Host ""
        Write-Host "⚠ IMPORTANT: Update your domain registrar with these nameservers:" -ForegroundColor Yellow
        foreach ($ns in $nameservers) {
            Write-Host "  - $ns" -ForegroundColor White
        }
        Write-Host ""
    }
    
    # Create A record for main domain
    Write-Host "Creating A record: $recordName.$zoneName -> $IP" -ForegroundColor Cyan
    az network dns record-set a create --name $recordName --zone-name $zoneName --resource-group $ResourceGroup --ttl 300 2>$null
    az network dns record-set a add-record --record-set-name $recordName --zone-name $zoneName --resource-group $ResourceGroup --ipv4-address $IP
    Write-Host "✓ A record created" -ForegroundColor Green
    
    # Create www subdomain (if main domain)
    if ($recordName -eq "@" -or $recordName -eq $zoneName) {
        Write-Host "Creating www CNAME record" -ForegroundColor Cyan
        az network dns record-set cname create --name "www" --zone-name $zoneName --resource-group $ResourceGroup --ttl 300 2>$null
        az network dns record-set cname set-record --record-set-name "www" --zone-name $zoneName --resource-group $ResourceGroup --cname $zoneName
        Write-Host "✓ www CNAME created" -ForegroundColor Green
    }
    
    # Create API subdomain
    Write-Host "Creating api subdomain A record" -ForegroundColor Cyan
    az network dns record-set a create --name "api" --zone-name $zoneName --resource-group $ResourceGroup --ttl 300 2>$null
    az network dns record-set a add-record --record-set-name "api" --zone-name $zoneName --resource-group $ResourceGroup --ipv4-address $IP
    Write-Host "✓ api A record created" -ForegroundColor Green
    
    # Create app subdomain
    Write-Host "Creating app subdomain A record" -ForegroundColor Cyan
    az network dns record-set a create --name "app" --zone-name $zoneName --resource-group $ResourceGroup --ttl 300 2>$null
    az network dns record-set a add-record --record-set-name "app" --zone-name $zoneName --resource-group $ResourceGroup --ipv4-address $IP
    Write-Host "✓ app A record created" -ForegroundColor Green
}

# Function to display Cloudflare instructions
function Show-CloudflareDNS {
    param($Domain, $IP)
    
    Write-Host "Cloudflare DNS Configuration Instructions:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Log in to Cloudflare Dashboard: https://dash.cloudflare.com" -ForegroundColor White
    Write-Host "2. Select your domain: $Domain" -ForegroundColor White
    Write-Host "3. Go to DNS > Records" -ForegroundColor White
    Write-Host "4. Add the following A records:" -ForegroundColor White
    Write-Host ""
    Write-Host "   Type: A" -ForegroundColor Cyan
    Write-Host "   Name: @" -ForegroundColor Cyan
    Write-Host "   IPv4: $IP" -ForegroundColor Cyan
    Write-Host "   Proxy: Enabled (Orange Cloud)" -ForegroundColor Cyan
    Write-Host "   TTL: Auto" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   Type: A" -ForegroundColor Cyan
    Write-Host "   Name: api" -ForegroundColor Cyan
    Write-Host "   IPv4: $IP" -ForegroundColor Cyan
    Write-Host "   Proxy: Enabled (Orange Cloud)" -ForegroundColor Cyan
    Write-Host "   TTL: Auto" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   Type: A" -ForegroundColor Cyan
    Write-Host "   Name: app" -ForegroundColor Cyan
    Write-Host "   IPv4: $IP" -ForegroundColor Cyan
    Write-Host "   Proxy: Enabled (Orange Cloud)" -ForegroundColor Cyan
    Write-Host "   TTL: Auto" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   Type: CNAME" -ForegroundColor Cyan
    Write-Host "   Name: www" -ForegroundColor Cyan
    Write-Host "   Target: $Domain" -ForegroundColor Cyan
    Write-Host "   Proxy: Enabled (Orange Cloud)" -ForegroundColor Cyan
    Write-Host "   TTL: Auto" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "5. Enable SSL/TLS: Full (strict)" -ForegroundColor White
    Write-Host "6. Enable Always Use HTTPS" -ForegroundColor White
    Write-Host "7. Enable Automatic HTTPS Rewrites" -ForegroundColor White
    Write-Host ""
}

# Function to display generic DNS instructions
function Show-GenericDNS {
    param($Domain, $IP)
    
    Write-Host "Generic DNS Configuration Instructions:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Add these DNS records to your DNS provider:" -ForegroundColor White
    Write-Host ""
    Write-Host "A Records:" -ForegroundColor Cyan
    Write-Host "  @ (root)           -> $IP" -ForegroundColor White
    Write-Host "  api.$Domain        -> $IP" -ForegroundColor White
    Write-Host "  app.$Domain        -> $IP" -ForegroundColor White
    Write-Host ""
    Write-Host "CNAME Records:" -ForegroundColor Cyan
    Write-Host "  www.$Domain        -> $Domain" -ForegroundColor White
    Write-Host ""
    Write-Host "TTL: 300 seconds (5 minutes)" -ForegroundColor White
    Write-Host ""
}

# Configure DNS based on provider
switch ($DNSProvider.ToLower()) {
    "azure" {
        Configure-AzureDNS -Domain $Domain -IP $GatewayPublicIP -ResourceGroup $ResourceGroup
    }
    "cloudflare" {
        Show-CloudflareDNS -Domain $Domain -IP $GatewayPublicIP
    }
    default {
        Show-GenericDNS -Domain $Domain -IP $GatewayPublicIP
    }
}

# Verify DNS propagation
Write-Host ""
Write-Host "Verifying DNS configuration..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

$records = @("$Domain", "api.$Domain", "app.$Domain", "www.$Domain")

foreach ($record in $records) {
    try {
        $resolved = Resolve-DnsName -Name $record -Type A -ErrorAction SilentlyContinue
        if ($resolved) {
            Write-Host "✓ $record resolves to: $($resolved[0].IPAddress)" -ForegroundColor Green
        } else {
            Write-Host "⚠ $record not yet propagated (this may take 5-30 minutes)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠ $record not yet propagated (this may take 5-30 minutes)" -ForegroundColor Yellow
    }
}

# Summary
Write-Host ""
Write-Host "=== DNS Configuration Summary ===" -ForegroundColor Green
Write-Host ""
Write-Host "Domain Configuration:" -ForegroundColor Cyan
Write-Host "  Main Domain:     https://$Domain" -ForegroundColor White
Write-Host "  API Endpoint:    https://api.$Domain" -ForegroundColor White
Write-Host "  App Frontend:    https://app.$Domain" -ForegroundColor White
Write-Host "  WWW Redirect:    https://www.$Domain -> https://$Domain" -ForegroundColor White
Write-Host ""
Write-Host "Gateway IP:        $GatewayPublicIP" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Wait 5-30 minutes for DNS propagation" -ForegroundColor White
Write-Host "2. Verify DNS: nslookup $Domain" -ForegroundColor White
Write-Host "3. Configure SSL certificates: ./setup-ssl-certificates.sh $Domain" -ForegroundColor White
Write-Host "4. Update NGINX configuration with domain names" -ForegroundColor White
Write-Host "5. Test HTTPS access: curl https://$Domain" -ForegroundColor White
Write-Host ""

# Save configuration
$dnsConfig = @{
    timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    domain = $Domain
    gatewayIP = $GatewayPublicIP
    provider = $DNSProvider
    records = @{
        root = "$Domain -> $GatewayPublicIP"
        api = "api.$Domain -> $GatewayPublicIP"
        app = "app.$Domain -> $GatewayPublicIP"
        www = "www.$Domain -> $Domain (CNAME)"
    }
}

$dnsConfig | ConvertTo-Json -Depth 10 | Out-File "dns-configuration-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
Write-Host "✓ DNS configuration saved to dns-configuration-*.json" -ForegroundColor Green
Write-Host ""
