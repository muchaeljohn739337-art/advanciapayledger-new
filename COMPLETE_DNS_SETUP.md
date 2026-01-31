# 🌐 Complete DNS Setup for Advancia PayLedger

## 📋 All Required DNS Records

I see you have **3 DNS records** to configure for complete SSL certificate validation:

---

## 🔐 Record 1: DCV Delegation CNAME

```
Type: CNAME
Name: _acme-challenge.advanciapayledger.com
Value: advanciapayledger.com.e9d5cf6889e77fa2.dcv.cloudflare.com
TTL: 3600
```

**Purpose:** Automated certificate issuance and renewal

---

## 📝 Record 2: Certificate Validation TXT

```
Type: TXT
Name: _acme-challenge.e9d5cf6889e77fa2.dcv.cloudflare.com
Value: XMfaCzsyUFt4deqi01zUfXfLvaTh6sGGntSpuiaaLwY
TTL: 3600
```

**Purpose:** Domain Control Validation for certificate issuance

---

## 🏷️ Record 3: Hostname Pre-Validation TXT

```
Type: TXT
Name: _cf-custom-hostname.e9d5cf6889e77fa2.dcv.cloudflare.com
Value: 9649a454-dbf5-4864-b9e7-27adf3b3ec62
TTL: 3600
```

**Purpose:** Pre-validation of custom hostname in Cloudflare

---

## 🚀 Setup Instructions

### **Step 1: Access Your DNS Provider**

Go to your domain registrar/DNS provider:
- GoDaddy
- Namecheap
- Google Domains
- Cloudflare DNS
- Network Solutions
- etc.

### **Step 2: Add All Three Records**

**In DNS Management Panel:**

#### **Record 1 - CNAME**
1. Click "Add Record"
2. Type: `CNAME`
3. Name/Host: `_acme-challenge`
4. Value/Points to: `advanciapayledger.com.e9d5cf6889e77fa2.dcv.cloudflare.com`
5. TTL: `3600`

#### **Record 2 - TXT (Certificate Validation)**
1. Click "Add Record"
2. Type: `TXT`
3. Name/Host: `_acme-challenge.e9d5cf6889e77fa2.dcv.cloudflare.com`
4. Value/Content: `XMfaCzsyUFt4deqi01zUfXfLvaTh6sGGntSpuiaaLwY`
5. TTL: `3600`

#### **Record 3 - TXT (Hostname Pre-Validation)**
1. Click "Add Record"
2. Type: `TXT`
3. Name/Host: `_cf-custom-hostname.e9d5cf6889e77fa2.dcv.cloudflare.com`
4. Value/Content: `9649a454-dbf5-4864-b9e7-27adf3b3ec62`
5. TTL: `3600`

---

## 🔍 Verification Commands

### **After Adding Records (Wait 5-60 minutes):**

```bash
# Check CNAME record
dig _acme-challenge.advanciapayledger.com CNAME

# Check TXT records
dig _acme-challenge.e9d5cf6889e77fa2.dcv.cloudflare.com TXT
dig _cf-custom-hostname.e9d5cf6889e77fa2.dcv.cloudflare.com TXT

# On Windows:
nslookup -type=CNAME _acme-challenge.advanciapayledger.com
nslookup -type=TXT _acme-challenge.e9d5cf6889e77fa2.dcv.cloudflare.com
nslookup -type=TXT _cf-custom-hostname.e9d5cf6889e77fa2.dcv.cloudflare.com
```

### **Expected Results:**

```
_acme-challenge.advanciapayledger.com. 3600 IN CNAME advanciapayledger.com.e9d5cf6889e77fa2.dcv.cloudflare.com.

_acme-challenge.e9d5cf6889e77fa2.dcv.cloudflare.com. 3600 IN TXT "XMfaCzsyUFt4deqi01zUfXfLvaTh6sGGntSpuiaaLwY"

_cf-custom-hostname.e9d5cf6889e77fa2.dcv.cloudflare.com. 3600 IN TXT "9649a454-dbf5-4864-b9e7-27adf3b3ec62"
```

---

## 📋 Common DNS Provider Instructions

### **GoDaddy**
1. DNS Management → Add Record
2. Select record type (CNAME/TXT)
3. Enter name and value
4. TTL: 1 Hour (3600)

### **Namecheap**
1. Domain → Advanced DNS
2. Add New Record
3. Select type (CNAME Record/TXT Record)
4. Fill in details
5. TTL: 1 hour

### **Google Domains**
1. DNS → Custom records
2. Add custom record
3. Select type (CNAME/TXT)
4. Enter details
5. TTL: 1h

### **Cloudflare DNS**
1. DNS → Records
2. Add record
3. Select type (CNAME/TXT)
4. Enter details
5. TTL: Auto (or 3600)

---

## 🎯 What Each Record Does

### **CNAME Record**
- Enables automated certificate issuance
- Handles renewals automatically
- Supports wildcard certificates

### **TXT Record 1 (Certificate Validation)**
- Proves domain ownership to ACME
- Required for certificate issuance
- Validates control of the domain

### **TXT Record 2 (Hostname Pre-Validation)**
- Pre-validates custom hostname
- Ensures Cloudflare can manage the hostname
- Required for custom hostname setup

---

## 📊 Setup Timeline

| Time | Action |
|------|--------|
| 0-5 min | Add DNS records |
| 5-60 min | DNS propagation |
| 10-30 min | Certificate issuance |
| 30-60 min | SSL activation |

---

## ✅ Verification Checklist

- [ ] CNAME record added: `_acme-challenge.advanciapayledger.com`
- [ ] TXT record added: `_acme-challenge.e9d5cf6889e77fa2.dcv.cloudflare.com`
- [ ] TXT record added: `_cf-custom-hostname.e9d5cf6889e77fa2.dcv.cloudflare.com`
- [ ] Wait for DNS propagation (5-60 minutes)
- [ ] Verify CNAME with dig/nslookup
- [ ] Verify TXT records with dig/nslookup
- [ ] Check Cloudflare dashboard for validation status
- [ ] Test HTTPS access once certificate is issued

---

## 🔧 After DNS Setup

### **In Cloudflare Dashboard:**

1. **SSL/TLS → Edge Certificates**
   - Enable "Always Use HTTPS"
   - Set encryption mode to "Full (strict)"

2. **SSL/TLS → Hostnames**
   - Add custom hostname: `advanciapayledger.com`
   - Wait for certificate issuance

3. **DNS → Records**
   - Ensure A/AAAA records point to your server
   - Set proxy status to orange cloud (proxied)

---

## 🌐 Production URLs After Setup

Once all records are configured and certificates issued:

```
https://advanciapayledger.com          (Main site)
https://api.advanciapayledger.com      (Backend API)
https://admin.advanciapayledger.com    (Admin panel)
https://app.advanciapayledger.com      (Application)
https://*.advanciapayledger.com        (Wildcard coverage)
```

---

## 🚨 Troubleshooting

### **DNS Not Propagating**
```bash
# Check propagation status
dig +trace _acme-challenge.advanciapayledger.com CNAME

# Try different DNS servers
dig @8.8.8.8 _acme-challenge.advanciapayledger.com CNAME
dig @1.1.1.1 _acme-challenge.advanciapayledger.com CNAME
```

### **Certificate Not Issuing**
1. Verify all 3 records are correct
2. Check for typos in values
3. Wait up to 24 hours for full propagation
4. Check Cloudflare dashboard for errors

### **HTTPS Not Working**
1. Ensure SSL mode is "Full (strict)"
2. Verify certificate is issued
3. Check proxy status (orange cloud)
4. Test with curl for debugging

---

## 📞 Quick Copy-Paste Records

```
# Record 1 - CNAME
Type: CNAME
Name: _acme-challenge.advanciapayledger.com
Value: advanciapayledger.com.e9d5cf6889e77fa2.dcv.cloudflare.com
TTL: 3600

# Record 2 - TXT (Certificate Validation)
Type: TXT
Name: _acme-challenge.e9d5cf6889e77fa2.dcv.cloudflare.com
Value: XMfaCzsyUFt4deqi01zUfXfLvaTh6sGGntSpuiaaLwY
TTL: 3600

# Record 3 - TXT (Hostname Pre-Validation)
Type: TXT
Name: _cf-custom-hostname.e9d5cf6889e77fa2.dcv.cloudflare.com
Value: 9649a454-dbf5-4864-b9e7-27adf3b3ec62
TTL: 3600
```

---

## 🎯 Next Steps

1. **Add all 3 DNS records** to your provider
2. **Wait 5-60 minutes** for propagation
3. **Verify records** with dig/nslookup
4. **Check Cloudflare dashboard** for validation
5. **Configure SSL** to "Full (strict)"
6. **Test HTTPS access** to your domain

---

**Add all 3 records to your DNS provider and you'll have complete automated SSL certificate management!** 🚀
