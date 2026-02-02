# Monitoring Stack Setup

## Quick Start

### 1. Start Monitoring Stack
```bash
cd infrastructure/monitoring
docker-compose up -d
```

### 2. Access Services
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (admin/admin)

### 3. Configure Grafana

1. Login to Grafana (admin/admin)
2. Change password when prompted
3. Prometheus datasource should be auto-configured
4. Import dashboards:
   - Go to Dashboards → Import
   - Use ID: `1860` (Node Exporter Full)
   - Select Prometheus datasource

### 4. Verify Metrics

Visit your backend metrics endpoint:
```bash
curl http://localhost:3001/api/metrics
```

You should see Prometheus-formatted metrics.

## Available Metrics

### HTTP Metrics
- `http_request_duration_seconds` - Request duration histogram
- `http_requests_total` - Total request counter

### Business Metrics
- `payments_total` - Total payments by status/type
- `payments_amount_cents` - Payment amounts
- `active_users_total` - Current active users
- `wallet_balance_cents` - Total wallet balances

### Database Metrics
- `db_query_duration_seconds` - Query performance
- `db_connections_active` - Active connections

### System Metrics (auto-collected)
- CPU usage
- Memory usage
- Event loop lag
- Garbage collection stats

## Custom Dashboards

Create custom Grafana dashboards using PromQL queries:

### Example Queries

**Request Rate (per minute)**
```promql
rate(http_requests_total[1m])
```

**Average Response Time**
```promql
rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])
```

**Payment Success Rate**
```promql
rate(payments_total{status="completed"}[5m]) / rate(payments_total[5m])
```

**Active Users**
```promql
active_users_total
```

## Alerts (Optional)

Add alerting rules in `prometheus.yml`:

```yaml
rule_files:
  - 'alerts.yml'

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']
```

## Troubleshooting

### Prometheus not scraping metrics
1. Check backend is running: `curl http://localhost:3001/api/metrics`
2. Check Prometheus targets: http://localhost:9090/targets
3. Verify network connectivity

### Grafana not showing data
1. Check datasource configuration
2. Verify time range in dashboard
3. Check Prometheus is receiving metrics

## Production Deployment

For production, consider:
1. Persistent storage volumes
2. Authentication for Grafana
3. HTTPS/TLS encryption
4. Backup strategy
5. Retention policies

## Cost

**Total: $0/month** (self-hosted)

Optional upgrades:
- Grafana Cloud: $49/month (managed service)
- Prometheus Cloud: Various pricing tiers
