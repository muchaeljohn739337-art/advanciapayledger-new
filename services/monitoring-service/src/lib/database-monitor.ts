import { createClient } from 'redis';

export interface DatabaseMetrics {
  status: 'connected' | 'disconnected' | 'maintenance';
  connections: {
    active: number;
    idle: number;
    max: number;
  };
  performance: {
    avgQueryTime: number;
    slowQueries: number;
    totalQueries: number;
  };
  storage: {
    size: string;
    tables: number;
    indexes: number;
  };
  lastBackup?: string;
  timestamp: string;
}

export class DatabaseMonitor {
  private redis: any;
  private metrics: DatabaseMetrics;

  constructor() {
    this.redis = null;
    this.metrics = this.getDefaultMetrics();
  }

  private getDefaultMetrics(): DatabaseMetrics {
    return {
      status: 'disconnected',
      connections: { active: 0, idle: 0, max: 100 },
      performance: { avgQueryTime: 0, slowQueries: 0, totalQueries: 0 },
      storage: { size: '0 MB', tables: 0, indexes: 0 },
      timestamp: new Date().toISOString(),
    };
  }

  async initialize() {
    try {
      // Initialize Redis connection
      this.redis = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      });
      
      await this.redis.connect();
      console.log('Redis connected for monitoring');
    } catch (error) {
      console.warn('Redis connection failed:', error);
      this.redis = null;
    }
  }

  async getDatabaseMetrics(): Promise<DatabaseMetrics> {
    try {
      // Simulate database connection check
      await this.testDatabaseConnection();
      
      const [connectionInfo, performanceInfo, storageInfo] = await Promise.allSettled([
        this.getConnectionInfo(),
        this.getPerformanceInfo(),
        this.getStorageInfo(),
      ]);

      this.metrics = {
        status: 'connected',
        connections: connectionInfo.status === 'fulfilled' ? connectionInfo.value : this.metrics.connections,
        performance: performanceInfo.status === 'fulfilled' ? performanceInfo.value : this.metrics.performance,
        storage: storageInfo.status === 'fulfilled' ? storageInfo.value : this.metrics.storage,
        lastBackup: await this.getLastBackupInfo(),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Database monitoring failed:', error);
      this.metrics.status = 'disconnected';
      this.metrics.timestamp = new Date().toISOString();
    }

    return this.metrics;
  }

  private async testDatabaseConnection() {
    // Simulate database connection test
    // In production, this would actually connect to PostgreSQL
    return Promise.resolve();
  }

  private async getConnectionInfo() {
    try {
      // Simulate connection info (PostgreSQL specific)
      return {
        active: Math.floor(Math.random() * 50) + 10,
        idle: Math.floor(Math.random() * 20) + 5,
        max: 100,
      };
    } catch (error) {
      console.warn('Could not get connection info:', error);
      return { active: 0, idle: 0, max: 100 };
    }
  }

  private async getPerformanceInfo() {
    try {
      // Simulate performance metrics
      return {
        avgQueryTime: Math.random() * 100 + 10,
        slowQueries: Math.floor(Math.random() * 5),
        totalQueries: Math.floor(Math.random() * 1000) + 100,
      };
    } catch (error) {
      console.warn('Could not get performance info:', error);
      return { avgQueryTime: 0, slowQueries: 0, totalQueries: 0 };
    }
  }

  private async getStorageInfo() {
    try {
      // Simulate storage info
      return {
        size: `${(Math.random() * 10 + 5).toFixed(2)} GB`,
        tables: Math.floor(Math.random() * 50) + 10,
        indexes: Math.floor(Math.random() * 100) + 20,
      };
    } catch (error) {
      console.warn('Could not get storage info:', error);
      return { size: '0 MB', tables: 0, indexes: 0 };
    }
  }

  private async getLastBackupInfo(): Promise<string> {
    try {
      // Check Redis for backup timestamp
      if (this.redis) {
        const backupTimestamp = await this.redis.get('last_backup_timestamp');
        if (backupTimestamp) {
          return new Date(parseInt(backupTimestamp)).toISOString();
        }
      }
      
      // Return recent backup time
      return new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString();
    } catch (error) {
      console.warn('Could not get backup info:', error);
      return 'Unknown';
    }
  }

  async getRedisMetrics() {
    if (!this.redis) {
      return { status: 'disconnected', memory: 0, keys: 0, connections: 0 };
    }

    try {
      const info = await this.redis.info();
      const memory = this.parseRedisInfo(info, 'used_memory_human');
      const keys = this.parseRedisInfo(info, 'db0');
      const connections = this.parseRedisInfo(info, 'connected_clients');

      return {
        status: 'connected',
        memory: memory || '0B',
        keys: keys ? parseInt(keys.split('=')[1] || '0') : 0,
        connections: parseInt(connections || '0'),
      };
    } catch (error) {
      console.warn('Redis metrics failed:', error);
      return { status: 'error', memory: 0, keys: 0, connections: 0 };
    }
  }

  private parseRedisInfo(info: string, key: string): string | null {
    const lines = info.split('\r\n');
    for (const line of lines) {
      if (line.startsWith(key)) {
        return line.split(':')[1] || null;
      }
    }
    return null;
  }

  async runHealthCheck() {
    const dbMetrics = await this.getDatabaseMetrics();
    const redisMetrics = await this.getRedisMetrics();
    
    const issues: string[] = [];

    // Check database health
    if (dbMetrics.status !== 'connected') {
      issues.push('Database connection failed');
    }

    if (dbMetrics.connections.active > dbMetrics.connections.max * 0.8) {
      issues.push('High database connection usage');
    }

    if (dbMetrics.performance.avgQueryTime > 1000) {
      issues.push('Slow database queries detected');
    }

    // Check Redis health
    if (redisMetrics.status !== 'connected') {
      issues.push('Redis connection failed');
    }

    return {
      status: issues.length === 0 ? 'healthy' : 'warning',
      issues,
      database: dbMetrics,
      redis: redisMetrics,
    };
  }

  async cleanup() {
    try {
      if (this.redis) {
        await this.redis.disconnect();
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }
}

export const databaseMonitor = new DatabaseMonitor();
