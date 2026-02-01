# 🔒 Docker Security Audit & Fixes

## ⚠️ CRITICAL: /var/run/docker.sock Exposure

### **What is docker.sock?**
The Docker daemon socket that provides **ROOT-LEVEL** access to the host system.

### **Why is it dangerous?**
If exposed in a container:
- ✅ Full server takeover
- ✅ Container escape
- ✅ Root access to host
- ✅ Access to ALL containers
- ✅ Read ALL secrets
- ✅ Modify ANY file on host

### **How attackers exploit it:**
```bash
# Inside compromised container with docker.sock mounted
docker run -v /:/host -it alpine chroot /host
# Now attacker has root on HOST machine
```

---

## 🔍 Audit Your Configuration

### **Check docker-compose.yml:**
```bash
grep -r "docker.sock" docker-compose*.yml
```

### **Check Kubernetes configs:**
```bash
grep -r "docker.sock" *.yaml
```

### **Check running containers:**
```bash
docker ps --format '{{.Names}}' | xargs -I {} docker inspect {} | grep docker.sock
```

---

## ✅ Fixes Required

### **1. Remove docker.sock from docker-compose.yml**

**❌ DANGEROUS (Remove this):**
```yaml
services:
  backend:
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock  # REMOVE THIS!
```

**✅ SAFE:**
```yaml
services:
  backend:
    volumes:
      - ./backend:/app
      - /app/node_modules
    # No docker.sock mounting
```

### **2. Remove docker.sock from Kubernetes**

**❌ DANGEROUS:**
```yaml
volumes:
  - name: docker-sock
    hostPath:
      path: /var/run/docker.sock
```

**✅ SAFE:**
Remove the entire volume definition.

### **3. Check CI/CD Pipelines**

**GitHub Actions - ❌ DANGEROUS:**
```yaml
- name: Build
  run: |
    docker run -v /var/run/docker.sock:/var/run/docker.sock ...
```

**✅ SAFE:**
```yaml
- name: Build
  run: |
    docker build -t myapp .
    docker push myapp
```

---

## 🔐 Additional Docker Security Hardening

### **1. Run as Non-Root User**

**Dockerfile:**
```dockerfile
FROM node:18-alpine

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy files
COPY --chown=nodejs:nodejs . .

# Install dependencies
RUN npm ci --only=production

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### **2. Use Read-Only Root Filesystem**

**docker-compose.yml:**
```yaml
services:
  backend:
    image: myapp:latest
    read_only: true
    tmpfs:
      - /tmp
      - /app/logs
    security_opt:
      - no-new-privileges:true
```

### **3. Limit Container Capabilities**

**docker-compose.yml:**
```yaml
services:
  backend:
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
```

### **4. Set Resource Limits**

**docker-compose.yml:**
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### **5. Use Docker Secrets (Not Environment Variables)**

**❌ INSECURE:**
```yaml
services:
  backend:
    environment:
      - DATABASE_PASSWORD=supersecret123
      - STRIPE_SECRET_KEY=sk_live_...
```

**✅ SECURE:**
```yaml
services:
  backend:
    secrets:
      - db_password
      - stripe_key

secrets:
  db_password:
    external: true
  stripe_key:
    external: true
```

### **6. Enable Docker Content Trust**

```bash
export DOCKER_CONTENT_TRUST=1
docker pull node:18-alpine
```

### **7. Scan Images for Vulnerabilities**

```bash
# Using Trivy
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image myapp:latest

# Using Snyk
snyk container test myapp:latest
```

---

## 📋 Complete Secure docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    image: advancia-backend:latest
    container_name: advancia-backend
    restart: unless-stopped
    
    # Security settings
    read_only: true
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
    
    # Resource limits
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
    
    # Temporary filesystems
    tmpfs:
      - /tmp
      - /app/logs
    
    # Environment (non-sensitive only)
    environment:
      - NODE_ENV=production
      - PORT=3000
    
    # Secrets (sensitive data)
    secrets:
      - database_url
      - redis_url
      - stripe_secret
      - jwt_secret
    
    # Volumes (no docker.sock!)
    volumes:
      - ./backend/logs:/app/logs:rw
    
    # Network
    networks:
      - app-network
    
    # Health check
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15-alpine
    container_name: advancia-postgres
    restart: unless-stopped
    
    # Security
    read_only: true
    security_opt:
      - no-new-privileges:true
    
    # Secrets
    secrets:
      - postgres_password
    
    environment:
      - POSTGRES_DB=advancia
      - POSTGRES_USER=advancia
      - POSTGRES_PASSWORD_FILE=/run/secrets/postgres_password
    
    # Persistent storage
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - /var/run/postgresql:/var/run/postgresql
    
    # Temporary filesystems
    tmpfs:
      - /tmp
    
    networks:
      - app-network
    
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U advancia"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: advancia-redis
    restart: unless-stopped
    
    # Security
    read_only: true
    security_opt:
      - no-new-privileges:true
    
    command: redis-server --requirepass ${REDIS_PASSWORD}
    
    # Persistent storage
    volumes:
      - redis-data:/data
    
    # Temporary filesystems
    tmpfs:
      - /tmp
    
    networks:
      - app-network
    
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

networks:
  app-network:
    driver: bridge

volumes:
  postgres-data:
    driver: local
  redis-data:
    driver: local

secrets:
  database_url:
    external: true
  redis_url:
    external: true
  stripe_secret:
    external: true
  jwt_secret:
    external: true
  postgres_password:
    external: true
```

---

## 🔧 Create Docker Secrets

```bash
# Create secrets
echo "postgresql://user:pass@postgres:5432/advancia" | docker secret create database_url -
echo "redis://:password@redis:6379" | docker secret create redis_url -
echo "sk_live_..." | docker secret create stripe_secret -
echo "your-jwt-secret" | docker secret create jwt_secret -
echo "postgres-password" | docker secret create postgres_password -

# Verify secrets
docker secret ls
```

---

## ✅ Security Checklist

### **Docker Configuration:**
- [ ] No `/var/run/docker.sock` mounting
- [ ] Running as non-root user
- [ ] Read-only root filesystem
- [ ] Capabilities dropped (cap_drop: ALL)
- [ ] Resource limits set
- [ ] Health checks configured
- [ ] Using Docker secrets (not env vars)
- [ ] Images scanned for vulnerabilities
- [ ] Content trust enabled

### **Network Security:**
- [ ] Internal network for services
- [ ] No unnecessary port exposure
- [ ] TLS/SSL for external connections
- [ ] Firewall rules configured

### **Image Security:**
- [ ] Using official base images
- [ ] Minimal base images (alpine)
- [ ] No secrets in image layers
- [ ] Regular image updates
- [ ] Multi-stage builds

### **Runtime Security:**
- [ ] AppArmor/SELinux enabled
- [ ] Seccomp profiles applied
- [ ] No privileged containers
- [ ] Container isolation verified

---

## 🚨 Emergency Response

### **If docker.sock was exposed:**

1. **Immediately stop all containers:**
```bash
docker-compose down
```

2. **Audit all containers:**
```bash
docker ps -a
docker images
```

3. **Check for suspicious activity:**
```bash
docker logs <container-id>
grep -r "docker" /var/log/
```

4. **Rotate all secrets:**
- Database passwords
- API keys
- JWT secrets
- SSL certificates

5. **Rebuild from clean images:**
```bash
docker system prune -a
docker-compose build --no-cache
```

6. **Review access logs:**
```bash
# Check who accessed the system
tail -f /var/log/auth.log
tail -f /var/log/syslog
```

---

## 📊 Monitoring

### **Monitor Docker Security:**
```bash
# Install Falco for runtime security
helm install falco falcosecurity/falco

# Monitor container events
docker events --filter 'type=container'

# Check for privilege escalation
docker inspect --format='{{.HostConfig.Privileged}}' $(docker ps -q)
```

---

## 🎯 Summary

**Critical Fixes:**
1. ✅ Remove ALL `/var/run/docker.sock` mounts
2. ✅ Run containers as non-root
3. ✅ Use Docker secrets for sensitive data
4. ✅ Enable read-only filesystem
5. ✅ Drop all capabilities
6. ✅ Set resource limits
7. ✅ Scan images regularly

**Your Docker environment is now secure!** 🔒
