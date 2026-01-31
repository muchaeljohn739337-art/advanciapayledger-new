#!/bin/bash
# SSL Certificate Setup Script for Advancia PayLedger
# Run this on your server (147.182.193.11)

set -e

echo "🔐 Setting up SSL Certificate for Advancia PayLedger..."
echo "=================================================="

# Step 1: Create certificate directory
echo ""
echo "📁 Step 1: Creating certificate directory..."
mkdir -p /etc/ssl/advanciapayledger

# Step 2: Create certificate file
echo ""
echo "📄 Step 2: Creating certificate file..."
cat > /etc/ssl/advanciapayledger/cert.pem << 'CERT_EOF'
-----BEGIN CERTIFICATE-----
MIIEtjCCA56gAwIBAgIUXXkz/ElcSRtOS5jEJn6Q8LS2rmEwDQYJKoZIhvcNAQEL
BQAwgYsxCzAJBgNVBAYTAlVTMRkwFwYDVQQKExBDbG91ZEZsYXJlLCBJbmMuMTQw
MgYDVQQLEytDbG91ZEZsYXJlIE9yaWdpbiBTU0wgQ2VydGlmaWNhdGUgQXV0aG9y
aXR5MRYwFAYDVQQHEw1TYW4gRnJhbmNpc2NvMRMwEQYDVQQIEwpDYWxpZm9ybmlh
MB4XDTI2MDEzMTAwNTMwMFoXDTQxMDEyNzAwNTMwMFowYjEZMBcGA1UEChMQQ2xv
dWRGbGFyZSwgSW5jLjEdMBsGA1UECxMUQ2xvdWRGbGFyZSBPcmlnaW4gQ0ExJjAk
BgNVBAMTHUNsb3VkRmxhcmUgT3JpZ2luIENlcnRpZmljYXRlMIIBIjANBgkqhkiG
9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuw5IIjb2/I0j8u9/Y+4FhyM0eVirEEFnJJay
3sVwTikWdPYzpzG2g/kSqkBVJnGFo1BBMt/3w4fMr4+rBMCff40L6LrlhEiYLIW2
gPyOcIso+RYAKte65AwF5QZazB3LT/HdX5579aExjA39hH9Aws58MyQXHm81TLUC
9U9d+2SRxQgDBbcSHPW6syauMmFV1bXvD9W+YqQwUSKR41jyYdFwERMdmB7TsYkk
w9UDluZqjD1nKk329o4E4ZfopBuW+94TeL16kTgOFRVWllyyP6lIjUCwbTIAaSPw
mIy9i09jqhwNCp51u6yY/FWXdyhM8jTD2rVd/D8Zo7g/ZqyPvQIDAQABo4IBODCC
ATQwDgYDVR0PAQH/BAQDAgWgMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcD
ATAMBgNVHRMBAf8EAjAAMB0GA1UdDgQWBBQn5XGXuTkJsR7Q5KxvYQ9LHvw7GzAf
BgNVHSMEGDAWgBQk6FNXXXw0QIep65TbuuEWePwppDBABggrBgEFBQcBAQQ0MDIw
MAYIKwYBBQUHMAGGJGh0dHA6Ly9vY3NwLmNsb3VkZmxhcmUuY29tL29yaWdpbl9j
YTA5BgNVHREEMjAwghcqLmFkdmFuY2lhcGF5bGVkZ2VyLmNvbYIVYWR2YW5jaWFw
YXlsZWRnZXIuY29tMDgGA1UdHwQxMC8wLaAroCmGJ2h0dHA6Ly9jcmwuY2xvdWRm
bGFyZS5jb20vb3JpZ2luX2NhLmNybDANBgkqhkiG9w0BAQsFAAOCAQEAb1TBjwj/
GF1nQ0C8Ewc+KvvjmnIEZL30J3qbspFJbsEYE06R0Kq7TT6s8GAgN79JOt8UFley
ag+B93yOfCKoE8ohH8934aA+MR60XsHfIP3Jjdw+QKEolVdWTUhbTWwhNUdxNdc0
G7Qy05SQpLT8StrJBuWzukWIsxDWYqCA+cwL0xgnX17gkxKeJvdLds8CDJzgXuKn
Mmn6j0EfQXx0dRXbNQn/mZtR3URhu9gJ7I0A77WOxx5ovgBWz90a8wA8+Q9VmHTL
ft+qSozcGAxjSMUahD3aFVWLMGgJsCYgiRzfCt2vkn8gRJciLvM6t7unvJrTb5J/
lF9UmMlXoekHHw==
-----END CERTIFICATE-----
CERT_EOF

# Step 3: Create private key file
echo ""
echo "🔑 Step 3: Creating private key file..."
cat > /etc/ssl/advanciapayledger/key.pem << 'KEY_EOF'
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7DkgiNvb8jSPy
739j7gWHIzR5WKsQQWcklrLexXBOKRZ09jOnMbaD+RKqQFUmcYWjUEEy3/fDh8yv
j6sEwJ9/jQvouuWESJgshbaA/I5wiyj5FgAq17rkDAXlBlrMHctP8d1fnnv1oTGM
Df2Ef0DCznwzJBcebzVMtQL1T137ZJHFCAMFtxIc9bqzJq4yYVXVte8P1b5ipDBR
IpHjWPJh0XAREx2YHtOxiSTD1QOW5mqMPWcqTfb2jgThl+ikG5b73hN4vXqROA4V
FVaWXLI/qUiNQLBtMgBpI/CYjL2LT2OqHA0KnnW7rJj8VZd3KEzyNMPatV38Pxmj
uD9mrI+9AgMBAAECggEACKf0yRaLj+zVHssb9UsguNv1c+8ZPW+VXxFVNi9jTs6i
ciephMFtbYaDaVsARb7nnQLb/Yd1PvhkDbTDiH0EdIHZrPunHtvAJQFMDISDb+xU
qVAuEk144dA3np1QatUvISQzZxcdq+R5dz53fp/n5ovpHfG72yXwzLuspx703ar5
n2cT+syV9BNeI7FJhjt4XUecj/1jmCCRuIgVanhs0VbkabbM6PmZJBgp/YfXH+8X
qE9gDxE1DG7x1J2dsUmcguROh60mUsCSYlqlrH2z4PStJgR0e9cF5/V/MU08eyZu
7/CDuZKyt1lc3sLMkvy1gZxPqHS7l7VG0CokZABa0QKBgQDz+gAAqAf8E4StkYKW
3MfUQcMfopHuK2C7RlEGXBueM5IYKgNZC/VE16u1Fh0rkmIvM4/A4D+Ir7MOlMmY
M4CiIgWB4m6oGm+mtFc9hFcIHRIlxc9TKSk+zmz6YPPg8b1Iyv6naTZDWXdt5vAf
GkB7wz6kql6NUvtSy0OdkBfa0QKBgQDERivUtaKyzBF1NMQ2cEDNYTgP+OLb+AZ2
HCkbC4FXJ6qsPfzewVdSDunGOfuSOmUpGb8c3yW9YUF1QBXZLJCXPOsqwPvom/mg
IUiH7wXSxBuXH9sBcWetfqfsdqik2v9DYPyMAmcYnOjSBMYoIFu8eb6elgBUv+Xu
GhxVLh3JLQKBgQCvn56w2kQlKMexSbV/c55FJLGY7CWwFHmlVZCty0/2KZlY26Vd
TEZaMAXibPDClLUo1Sz94m7ZreBu9pvHfAt0qpjcTmrph14n2lmSZtlfdc3Ccwoz
CsYt99pqwa/MlTd0VuvJBuuQv65A5qSjPvp8HKfTUPCPOtS/XKJnoXoKgQKBgHZc
HphyRD/wQeLdRCnT/bAcnXM8Uon2Aud8yekOQhwtxoWCCBjInQDWD3HDi4q9/j0P
0qj1hEu094VedQ53Cma5jNNGd2LplFpVV+jpYiicrEqxIh+3pJ8CTv+Q+tgXXHHk
bcd8t3EnRltIF7sg8FEzVZlKub5hzqWMR2OyoLGtAoGAJ9jsxzFoExMobZyyeiuf
biwqSTpuLNKqaNREIX/TL6Mtt2adgl7dMkHp0lmeHfNia3E/5M+8Gwi6sWi2EwU3
49EXUl3rUVRmkhh7eqnLPQPdp1C/Q4BvTz5OrXlZyRHJgDEeVbOgW5lKUACZ8O4/
MibpAnW03qJqdhPZvugbzgo=
-----END PRIVATE KEY-----
KEY_EOF

# Step 4: Set permissions
echo ""
echo "🔒 Step 4: Setting file permissions..."
chmod 600 /etc/ssl/advanciapayledger/key.pem
chmod 644 /etc/ssl/advanciapayledger/cert.pem
chown root:root /etc/ssl/advanciapayledger/*

# Step 5: Install Nginx if not present
echo ""
echo "📦 Step 5: Checking/Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    apt update
    apt install nginx -y
    systemctl enable nginx
    systemctl start nginx
else
    echo "Nginx already installed"
fi

# Step 6: Create Nginx configuration
echo ""
echo "⚙️ Step 6: Creating Nginx configuration..."
cat > /etc/nginx/sites-available/advanciapayledger << 'NGINX_EOF'
server {
    listen 443 ssl http2;
    server_name advanciapayledger.com *.advanciapayledger.com;

    # SSL Configuration
    ssl_certificate /etc/ssl/advanciapayledger/cert.pem;
    ssl_certificate_key /etc/ssl/advanciapayledger/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;

    # Proxy Configuration
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3001/health;
        access_log off;
    }
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name advanciapayledger.com *.advanciapayledger.com;
    return 301 https://$host$request_uri;
}
NGINX_EOF

# Step 7: Enable site
echo ""
echo "🔗 Step 7: Enabling Nginx site..."
ln -sf /etc/nginx/sites-available/advanciapayledger /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Step 8: Test and restart Nginx
echo ""
echo "🧪 Step 8: Testing Nginx configuration..."
nginx -t

echo ""
echo "🔄 Step 9: Restarting Nginx..."
systemctl restart nginx
systemctl status nginx

# Step 10: Open firewall ports
echo ""
echo "🔥 Step 10: Configuring firewall..."
if command -v ufw &> /dev/null; then
    ufw allow 443/tcp
    ufw allow 80/tcp
    ufw allow 3001/tcp
    ufw --force enable
else
    echo "UFW not found, please configure firewall manually"
fi

# Step 11: Verify setup
echo ""
echo "✅ Step 11: Verification..."
echo "Certificate files:"
ls -la /etc/ssl/advanciapayledger/

echo ""
echo "Nginx configuration:"
nginx -T | grep -A 20 "server_name advanciapayledger.com"

echo ""
echo "=================================================="
echo "✅ SSL Certificate Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "   1. Set Cloudflare SSL mode to 'Full (strict)'"
echo "   2. Ensure DNS A records point to this server"
echo "   3. Test HTTPS access: curl -I https://advanciapayledger.com"
echo ""
echo "🌐 Your HTTPS URLs will be:"
echo "   - https://advanciapayledger.com"
echo "   - https://api.advanciapayledger.com"
echo "   - https://admin.advanciapayledger.com"
echo "   - https://app.advanciapayledger.com"
echo ""
echo "🔧 Useful commands:"
echo "   - Check Nginx status: systemctl status nginx"
echo "   - View Nginx logs: tail -f /var/log/nginx/error.log"
echo "   - Test SSL: openssl s_client -connect advanciapayledger.com:443"
echo "=================================================="
