# 🔧 Cloudflare API Scripts for Custom Hostnames

## 📋 API Information

**Zone ID**: `0bff66558872c58ed5b8b7942acc34d9`  
**Base URL**: `https://api.cloudflare.com/client/v4/zones/0bff66558872c58ed5b8b7942acc34d9`

---

## 🚀 API Commands

### **1. Create Custom Hostname**

```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/0bff66558872c58ed5b8b7942acc34d9/custom_hostnames" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "hostname": "advanciapayledger.com",
    "ssl": {
      "method": "dv",
      "type": "dv",
      "settings": {
        "ciphers": ["ECDHE-RSA-AES128-GCM-SHA256", "ECDHE-RSA-AES256-GCM-SHA384"],
        "http2": "on",
        "min_tls_version": "1.2"
      }
    },
    "custom_origin_server": "your-server-ip-or-domain"
  }'
```

### **2. Create Multiple Custom Hostnames**

```bash
# Main domain
curl -X POST "https://api.cloudflare.com/client/v4/zones/0bff66558872c58ed5b8b7942acc34d9/custom_hostnames" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "hostname": "advanciapayledger.com",
    "ssl": {"method": "dv", "type": "dv"}
  }'

# API subdomain
curl -X POST "https://api.cloudflare.com/client/v4/zones/0bff66558872c58ed5b8b7942acc34d9/custom_hostnames" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "hostname": "api.advanciapayledger.com",
    "ssl": {"method": "dv", "type": "dv"}
  }'

# Admin subdomain
curl -X POST "https://api.cloudflare.com/client/v4/zones/0bff66558872c58ed5b8b7942acc34d9/custom_hostnames" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "hostname": "admin.advanciapayledger.com",
    "ssl": {"method": "dv", "type": "dv"}
  }'

# App subdomain
curl -X POST "https://api.cloudflare.com/client/v4/zones/0bff66558872c58ed5b8b7942acc34d9/custom_hostnames" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "hostname": "app.advanciapayledger.com",
    "ssl": {"method": "dv", "type": "dv"}
  }'
```

### **3. List All Custom Hostnames**

```bash
curl -X GET "https://api.cloudflare.com/client/v4/zones/0bff66558872c58ed5b8b7942acc34d9/custom_hostnames" \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

### **4. Get Specific Hostname Details**

```bash
# Replace :identifier with the hostname ID from the list command
curl -X GET "https://api.cloudflare.com/client/v4/zones/0bff66558872c58ed5b8b7942acc34d9/custom_hostnames/:identifier" \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

### **5. Update Custom Hostname**

```bash
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/0bff66558872c58ed5b8b7942acc34d9/custom_hostnames/:identifier" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "ssl": {
      "method": "dv",
      "type": "dv",
      "settings": {
        "http2": "on",
        "min_tls_version": "1.2"
      }
    }
  }'
```

### **6. Delete Custom Hostname**

```bash
curl -X DELETE "https://api.cloudflare.com/client/v4/zones/0bff66558872c58ed5b8b7942acc34d9/custom_hostnames/:identifier" \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

---

## 📜 PowerShell Scripts

### **Create All Hostnames (PowerShell)**

```powershell
# Variables
$ZoneId = "0bff66558872c58ed5b8b7942acc34d9"
$ApiToken = "YOUR_API_TOKEN"
$BaseUrl = "https://api.cloudflare.com/client/v4/zones/$ZoneId"

$Headers = @{
    "Authorization" = "Bearer $ApiToken"
    "Content-Type" = "application/json"
}

# Hostnames to create
$Hostnames = @(
    "advanciapayledger.com",
    "api.advanciapayledger.com", 
    "admin.advanciapayledger.com",
    "app.advanciapayledger.com"
)

foreach ($Hostname in $Hostnames) {
    $Body = @{
        hostname = $Hostname
        ssl = @{
            method = "dv"
            type = "dv"
        }
    } | ConvertTo-Json

    Write-Host "Creating hostname: $Hostname"
    
    try {
        $Response = Invoke-RestMethod -Uri "$BaseUrl/custom_hostnames" -Method POST -Headers $Headers -Body $Body
        Write-Host "✅ Success: $($Response.result.hostname) - ID: $($Response.result.id)"
    } catch {
        Write-Host "❌ Error for $Hostname`: $($_.Exception.Message)"
    }
}
```

### **List and Check Status (PowerShell)**

```powershell
$ZoneId = "0bff66558872c58ed5b8b7942acc34d9"
$ApiToken = "YOUR_API_TOKEN"
$BaseUrl = "https://api.cloudflare.com/client/v4/zones/$ZoneId"

$Headers = @{
    "Authorization" = "Bearer $ApiToken"
}

try {
    $Response = Invoke-RestMethod -Uri "$BaseUrl/custom_hostnames" -Method GET -Headers $Headers
    
    Write-Host "Custom Hostnames Status:"
    Write-Host "========================"
    
    foreach ($Hostname in $Response.result) {
        $Status = $Hostname.ssl.status
        $Type = $Hostname.ssl.type
        $Method = $Hostname.ssl.method
        
        Write-Host "Domain: $($Hostname.hostname)"
        Write-Host "  Status: $Status"
        Write-Host "  Type: $Type"
        Write-Host "  Method: $Method"
        Write-Host "  ID: $($Hostname.id)"
        Write-Host "---"
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}
```

---

## 🐍 Python Scripts

### **Create All Hostnames (Python)**

```python
import requests
import json

# Configuration
ZONE_ID = "0bff66558872c58ed5b8b7942acc34d9"
API_TOKEN = "YOUR_API_TOKEN"
BASE_URL = f"https://api.cloudflare.com/client/v4/zones/{ZONE_ID}"

headers = {
    "Authorization": f"Bearer {API_TOKEN}",
    "Content-Type": "application/json"
}

# Hostnames to create
hostnames = [
    "advanciapayledger.com",
    "api.advanciapayledger.com",
    "admin.advanciapayledger.com", 
    "app.advanciapayledger.com"
]

for hostname in hostnames:
    data = {
        "hostname": hostname,
        "ssl": {
            "method": "dv",
            "type": "dv"
        }
    }
    
    print(f"Creating hostname: {hostname}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/custom_hostnames",
            headers=headers,
            data=json.dumps(data)
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success: {result['result']['hostname']} - ID: {result['result']['id']}")
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"❌ Exception: {e}")
```

---

## 📋 Expected API Responses

### **Success Response (201 Created)**
```json
{
  "result": {
    "id": "0d89c708d07b21c8a47cbed8d425cc5c",
    "hostname": "advanciapayledger.com",
    "ssl": {
      "id": "54321",
      "type": "dv",
      "method": "dv",
      "status": "pending_validation"
    }
  },
  "success": true
}
```

### **List Response**
```json
{
  "result": [
    {
      "id": "0d89c708d07b21c8a47cbed8d425cc5c",
      "hostname": "advanciapayledger.com",
      "ssl": {
        "status": "active",
        "type": "dv",
        "method": "dv"
      }
    }
  ],
  "success": true
}
```

---

## 🔧 Get Your API Token

1. **Go to Cloudflare Dashboard**
2. **My Profile → API Tokens**
3. **Create Token**
4. **Custom Token** with permissions:
   - **Zone**: Zone:Read, Zone:Edit
   - **Zone Resources**: Include `0bff66558872c58ed5b8b7942acc34d9`
   - **Custom Hostname**: Custom Hostname:Read, Custom Hostname:Edit

---

## 📊 SSL Status Values

- `pending_validation` - DNS validation in progress
- `pending_deployment` - Certificate issued, deploying
- `active` - Certificate active and working
- `pending_deletion` - Being deleted
- `deleted` - Deleted

---

## 🚀 Quick Start Commands

### **1. Get API Token**
- Create token at: https://dash.cloudflare.com/profile/api-tokens

### **2. Create All Hostnames**
```powershell
# Run the PowerShell script (replace YOUR_API_TOKEN)
.\create-hostnames.ps1
```

### **3. Check Status**
```powershell
# Run the status check script
.\check-hostname-status.ps1
```

### **4. Monitor Progress**
- Check every few minutes until status shows "active"
- DNS validation can take 5-60 minutes

---

## 📞 Troubleshooting

### **Common API Errors**
- `401 Unauthorized` - Check API token permissions
- `403 Forbidden` - Token lacks zone access
- `429 Too Many Requests` - Rate limited, wait a bit
- `404 Not Found` - Check zone ID

### **Validation Issues**
- Ensure DNS records are added first
- Wait for DNS propagation (5-60 minutes)
- Check TXT/CNAME values are correct

---

## 🎯 Complete Workflow

1. **Add DNS records** (CNAME + 2x TXT)
2. **Wait 5-10 minutes** for propagation
3. **Run API scripts** to create hostnames
4. **Monitor status** until "active"
5. **Test HTTPS** access to domains
6. **Configure applications** to use HTTPS URLs

---

**Use these scripts to automate your custom hostname setup!** 🚀
