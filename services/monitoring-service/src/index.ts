import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { systemMonitor } from './lib/system-monitor';
import { databaseMonitor } from './lib/database-monitor';

dotenv.config();

const app = express();
const PORT = process.env.MONITORING_SERVICE_PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Initialize monitoring
databaseMonitor.initialize().catch(console.error);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'monitoring-service',
    timestamp: new Date().toISOString(),
  });
});

// Monitoring Service Class
class MonitoringService {
  private metrics: Map<string, any> = new Map();
  private alerts: any[] = [];
  private isCollecting = false;

  constructor() {
    this.startCollection();
  }

  private startCollection() {
    if (this.isCollecting) return;
    this.isCollecting = true;

    // Collect metrics every 30 seconds
    setInterval(async () => {
      try {
        await this.collectAllMetrics();
      } catch (error) {
        console.error('Error collecting metrics:', error);
      }
    }, 30000);

    console.log('Started metrics collection');
  }

  private async collectAllMetrics() {
    const timestamp = new Date().toISOString();

    // System metrics
    const systemMetrics = await systemMonitor.getSystemMetrics();
    this.metrics.set('system', {
      ...systemMetrics,
      timestamp,
    });

    // Database metrics
    const dbMetrics = await databaseMonitor.getDatabaseMetrics();
    this.metrics.set('database', {
      ...dbMetrics,
      timestamp,
    });

    // Check for alerts
    await this.checkAlerts(systemMetrics, dbMetrics);
  }

  private async checkAlerts(systemMetrics: any, dbMetrics: any) {
    const alerts: any[] = [];

    // System alerts
    if (systemMetrics.cpu.usage > 90) {
      alerts.push({
        type: 'SYSTEM',
        severity: 'HIGH',
        message: `High CPU usage: ${systemMetrics.cpu.usage}%`,
        timestamp: new Date().toISOString(),
      });
    }

    if (systemMetrics.memory.usage > 90) {
      alerts.push({
        type: 'SYSTEM',
        severity: 'HIGH',
        message: `High memory usage: ${systemMetrics.memory.usage}%`,
        timestamp: new Date().toISOString(),
      });
    }

    if (systemMetrics.disk.usage > 95) {
      alerts.push({
        type: 'SYSTEM',
        severity: 'CRITICAL',
        message: `Critical disk usage: ${systemMetrics.disk.usage}%`,
        timestamp: new Date().toISOString(),
      });
    }

    // Database alerts
    if (dbMetrics.status !== 'connected') {
      alerts.push({
        type: 'DATABASE',
        severity: 'CRITICAL',
        message: 'Database connection lost',
        timestamp: new Date().toISOString(),
      });
    }

    if (dbMetrics.connections.active > dbMetrics.connections.max * 0.8) {
      alerts.push({
        type: 'DATABASE',
        severity: 'MEDIUM',
        message: `High database connection usage: ${dbMetrics.connections.active}/${dbMetrics.connections.max}`,
        timestamp: new Date().toISOString(),
      });
    }

    if (dbMetrics.performance.avgQueryTime > 1000) {
      alerts.push({
        type: 'DATABASE',
        severity: 'MEDIUM',
        message: `Slow database queries: ${dbMetrics.performance.avgQueryTime}ms average`,
        timestamp: new Date().toISOString(),
      });
    }

    // Add new alerts to the list
    if (alerts.length > 0) {
      this.alerts.push(...alerts);
      console.log(`Generated ${alerts.length} alerts`);
    }

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
  }

  getMetrics(service?: string) {
    if (service) {
      return this.metrics.get(service) || null;
    }
    return Object.fromEntries(this.metrics);
  }

  getAlerts(severity?: string) {
    if (severity) {
      return this.alerts.filter(alert => alert.severity === severity);
    }
    return this.alerts;
  }

  getHealthStatus() {
    const systemMetrics = this.metrics.get('system');
    const dbMetrics = this.metrics.get('database');

    const issues: string[] = [];

    if (systemMetrics) {
      if (systemMetrics.cpu.usage > 90) issues.push('High CPU usage');
      if (systemMetrics.memory.usage > 90) issues.push('High memory usage');
      if (systemMetrics.disk.usage > 95) issues.push('Critical disk usage');
    }

    if (dbMetrics) {
      if (dbMetrics.status !== 'connected') issues.push('Database disconnected');
      if (dbMetrics.connections.active > dbMetrics.connections.max * 0.8) {
        issues.push('High database connections');
      }
    }

    return {
      status: issues.length === 0 ? 'healthy' : 'warning',
      issues,
      timestamp: new Date().toISOString(),
    };
  }
}

const monitoringService = new MonitoringService();

// API Routes

// Get all metrics
app.get('/metrics', (req, res) => {
  const { service } = req.query;
  const metrics = monitoringService.getMetrics(service as string);
  res.json(metrics);
});

// Get system metrics
app.get('/metrics/system', async (req, res) => {
  try {
    const metrics = await systemMonitor.getSystemMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Error getting system metrics:', error);
    res.status(500).json({
      error: 'Failed to get system metrics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get database metrics
app.get('/metrics/database', async (req, res) => {
  try {
    const metrics = await databaseMonitor.getDatabaseMetrics();
    const redisMetrics = await databaseMonitor.getRedisMetrics();
    
    res.json({
      database: metrics,
      redis: redisMetrics,
    });
  } catch (error) {
    console.error('Error getting database metrics:', error);
    res.status(500).json({
      error: 'Failed to get database metrics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get alerts
app.get('/alerts', (req, res) => {
  const { severity, limit = 50 } = req.query;
  const alerts = monitoringService.getAlerts(severity as string);
  
  res.json({
    alerts: alerts.slice(-parseInt(limit as string)),
    total: alerts.length,
  });
});

// Get health status
app.get('/health/status', (req, res) => {
  const health = monitoringService.getHealthStatus();
  res.json(health);
});

// Get process list
app.get('/processes', async (req, res) => {
  try {
    const processes = await systemMonitor.getProcessList();
    res.json(processes);
  } catch (error) {
    console.error('Error getting process list:', error);
    res.status(500).json({
      error: 'Failed to get process list',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Prometheus metrics endpoint
app.get('/metrics/prometheus', (req, res) => {
  const metrics = monitoringService.getMetrics();
  const systemMetrics = metrics.system;
  const dbMetrics = metrics.database;

  let prometheusMetrics = '';

  // System metrics
  if (systemMetrics) {
    prometheusMetrics += `# HELP system_cpu_usage CPU usage percentage\n`;
    prometheusMetrics += `# TYPE system_cpu_usage gauge\n`;
    prometheusMetrics += `system_cpu_usage ${systemMetrics.cpu.usage}\n`;

    prometheusMetrics += `# HELP system_memory_usage Memory usage percentage\n`;
    prometheusMetrics += `# TYPE system_memory_usage gauge\n`;
    prometheusMetrics += `system_memory_usage ${systemMetrics.memory.usage}\n`;

    prometheusMetrics += `# HELP system_disk_usage Disk usage percentage\n`;
    prometheusMetrics += `# TYPE system_disk_usage gauge\n`;
    prometheusMetrics += `system_disk_usage ${systemMetrics.disk.usage}\n`;

    prometheusMetrics += `# HELP system_uptime System uptime in seconds\n`;
    prometheusMetrics += `# TYPE system_uptime counter\n`;
    prometheusMetrics += `system_uptime ${systemMetrics.uptime}\n`;
  }

  // Database metrics
  if (dbMetrics) {
    prometheusMetrics += `# HELP database_connections_active Active database connections\n`;
    prometheusMetrics += `# TYPE database_connections_active gauge\n`;
    prometheusMetrics += `database_connections_active ${dbMetrics.connections.active}\n`;

    prometheusMetrics += `# HELP database_query_time Average query time in milliseconds\n`;
    prometheusMetrics += `# TYPE database_query_time gauge\n`;
    prometheusMetrics += `database_query_time ${dbMetrics.performance.avgQueryTime}\n`;
  }

  res.set('Content-Type', 'text/plain');
  res.send(prometheusMetrics);
});

// Custom metrics endpoint
app.post('/metrics/custom', (req, res) => {
  try {
    const { service, metrics } = req.body;

    if (!service || !metrics) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['service', 'metrics'],
      });
    }

    // Store custom metrics
    const timestamp = new Date().toISOString();
    monitoringService['metrics'].set(service, {
      ...metrics,
      timestamp,
    });

    res.json({
      success: true,
      message: 'Custom metrics stored',
      service,
      timestamp,
    });
  } catch (error) {
    console.error('Error storing custom metrics:', error);
    res.status(500).json({
      error: 'Failed to store custom metrics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Create custom alert
app.post('/alerts', (req, res) => {
  try {
    const { type, severity, message, metadata } = req.body;

    if (!type || !severity || !message) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['type', 'severity', 'message'],
      });
    }

    const alert = {
      type: type.toUpperCase(),
      severity: severity.toUpperCase(),
      message,
      metadata,
      timestamp: new Date().toISOString(),
    };

    monitoringService['alerts'].push(alert);

    res.json({
      success: true,
      message: 'Alert created',
      alert,
    });
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({
      error: 'Failed to create alert',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get metrics history (placeholder)
app.get('/metrics/history', (req, res) => {
  const { service, hours = 24 } = req.query;
  
  // This would implement actual metrics history retrieval
  // For now, return empty array
  res.json({
    service,
    history: [],
    timeRange: `${hours}h`,
  });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Monitoring Service running on port ${PORT}`);
    console.log(`📊 Collecting metrics every 30 seconds`);
  });
}

export default app;
