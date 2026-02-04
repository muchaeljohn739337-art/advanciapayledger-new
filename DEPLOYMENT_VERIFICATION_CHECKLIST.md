# ArgoCD Deployment Verification Checklist

## Pre-Deployment Prerequisites

### Vault Configuration
- **Server**: `http://vault.vault.svc:8200`
- **Auth Role**: `external-secrets`
- **Mount Path**: `kubernetes`
- **Secret Engine Path**: `secret`
- **Version**: `v2`

### Required Vault Secrets
```bash
# Create secrets in Vault
vault kv put secret/advancia/api-gateway \
  jwt_secret="your-jwt-secret" \
  database_url="postgresql://user:pass@host:5432/db" \
  auth_service_secret="auth-service-secret"

vault kv put secret/advancia/auth-service \
  jwt_access_secret="jwt-access-secret" \
  jwt_refresh_secret="jwt-refresh-secret" \
  database_url="postgresql://user:pass@host:5432/db" \
  cognito_client_id="cognito-client-id" \
  cognito_client_secret="cognito-client-secret"

vault kv put secret/advancia/shared \
  redis_url="redis://host:6379"
```

## ArgoCD Verification Steps

### 1. System Apps Deployment
```bash
# Apply system apps first
kubectl apply -f gitops/apps/system-apps.yaml

# Verify system apps status
argocd app get advancia-system-apps
```

**Expected Status**: `Healthy` and `Synced`

### 2. Service Applications
```bash
# Apply ApplicationSet for all services
kubectl apply -f gitops/appset/applicationset.yaml

# Check individual apps
argocd app list | grep advancia
```

**Expected Status**: All apps should show `Healthy` and `Synced`

### 3. ExternalSecrets Verification
```bash
# Check ExternalSecret status in platform-core
kubectl get externalsecrets -n platform-core

# Verify specific secrets
kubectl get externalsecret api-gateway-secrets -n platform-core -o yaml

# Check resulting Kubernetes secrets
kubectl get secrets -n platform-core | grep -E "(api-gateway|auth-service)"
```

**Expected Status**: 
- ExternalSecrets should show `SecretSynced` condition
- Kubernetes secrets should be created and populated

### 4. ServiceMonitor Discovery
```bash
# Check ServiceMonitors
kubectl get servicemonitors -A | grep -E "(api-gateway|auth-service)"

# Verify Prometheus targets
kubectl get prometheuses -n observability
kubectl port-forward svc/prometheus-operated 9090:9090 -n observability

# Access Prometheus UI: http://localhost:9090/targets
```

**Expected Status**:
- ServiceMonitors should be created
- Prometheus targets should show `up` status for all services

### 5. Pod Health Checks
```bash
# Check pod status
kubectl get pods -n platform-core

# Check pod logs for any issues
kubectl logs -n platform-core deployment/api-gateway
kubectl logs -n platform-core deployment/auth-service

# Verify pod readiness
kubectl get pods -n platform-core -o wide
```

**Expected Status**: All pods should be `Running` and `Ready`

## Troubleshooting Guide

### Common Issues

#### ExternalSecret Not Syncing
```bash
# Check ExternalSecret events
kubectl describe externalsecret api-gateway-secrets -n platform-core

# Check SecretStore status
kubectl get secretstore vault-backend -n platform-core -o yaml

# Verify external-secrets operator logs
kubectl logs -n external-secrets deployment/external-secrets
```

#### ServiceMonitor Not Discovered
```bash
# Check ServiceMonitor labels
kubectl get servicemonitor api-gateway-sm -n platform-core -o yaml

# Verify Prometheus configuration
kubectl get prometheus prometheus -n observability -o yaml

# Check Prometheus operator logs
kubectl logs -n observability deployment/prometheus-operator
```

#### ArgoCD Sync Issues
```bash
# Check application events
argocd app get api-gateway --log-level debug

# Verify repository access
argocd repo list

# Check ArgoCD application controller logs
kubectl logs -n argocd deployment/argocd-application-controller
```

## Health Check Commands

### Complete Verification Script
```bash
#!/bin/bash

echo "=== ArgoCD Applications Status ==="
argocd app list | grep advancia

echo -e "\n=== ExternalSecrets Status ==="
kubectl get externalsecrets -A

echo -e "\n=== Kubernetes Secrets ==="
kubectl get secrets -n platform-core | grep -E "(api-gateway|auth-service)"

echo -e "\n=== ServiceMonitors ==="
kubectl get servicemonitors -A | grep advancia

echo -e "\n=== Pod Status ==="
kubectl get pods -n platform-core

echo -e "\n=== Service Endpoints ==="
kubectl get svc -n platform-core

echo -e "\n=== Network Policies ==="
kubectl get networkpolicies -n platform-core
```

## Success Criteria

✅ **ArgoCD**: All applications `Healthy` and `Synced`
✅ **Secrets**: ExternalSecrets show `SecretSynced` 
✅ **Monitoring**: ServiceMonitors discovered by Prometheus
✅ **Pods**: All services running and ready
✅ **Network**: Traffic flows correctly through policies
✅ **Vault**: Secrets accessible and properly mounted

## Next Steps

1. **Load Testing**: Verify services handle expected traffic
2. **Security Audit**: Review network policies and RBAC
3. **Backup Testing**: Verify Vault and etcd backups
4. **Disaster Recovery**: Test restore procedures
5. **Monitoring Alerts**: Configure alerting rules
6. **Documentation**: Update runbooks and SOPs
