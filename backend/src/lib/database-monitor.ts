import { PrismaClient } from '@prisma/client';
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
  private prisma: PrismaClient;
  private redis: any;
  private metrics: DatabaseMetrics;

  constructor() {
    this.prisma = new PrismaClient();
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
      // Test database connection
      await this.prisma.$queryRaw`SELECT 1`;
      
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

  private async getConnectionInfo() {
    try {
      // Get connection info (PostgreSQL specific)
      const result = await this.prisma.$queryRaw`
        SELECT 
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections,
          setting::int as max_connections
        FROM pg_stat_activity 
        CROSS JOIN pg_settings 
        WHERE name = 'max_connections'
      ` as any[];

      const connections = result[0] || { active_connections: 0, idle_connections: 0, max_connections: 100 };

      return {
        active: parseInt(connections.active_connections),
        idle: parseInt(connections.idle_connections),
        max: parseInt(connections.max_connections),
      };
    } catch (error) {
      console.warn('Could not get connection info:', error);
      return { active: 0, idle: 0, max: 100 };
    }
  }

  private async getPerformanceInfo() {
    try {
      // Get performance metrics
      const result = await this.prisma.$queryRaw`
        SELECT 
          AVG(EXTRACT(EPOCH FROM (query_end - query_start)) * 1000) as avg_query_time,
          COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM (query_end - query_start)) * 1000 > 1000) as slow_queries,
          COUNT(*) as total_queries
        FROM pg_stat_statements 
        WHERE calls > 0
      ` as any[];

      const performance = result[0] || { avg_query_time: 0, slow_queries: 0, total_queries: 0 };

      return {
        avgQueryTime: Math.round(parseFloat(performance.avg_query_time) * 100) / 100,
        slowQueries: parseInt(performance.slow_queries),
        totalQueries: parseInt(performance.total_queries),
      };
    } catch (error) {
      console.warn('Could not get performance info:', error);
      return { avgQueryTime: 0, slowQueries: 0, totalQueries: 0 };
    }
  }

  private async getStorageInfo() {
    try {
      // Get database size and table count
      const result = await this.prisma.$queryRaw`
        SELECT 
          pg_size_pretty(pg_database_size(current_database())) as size,
          (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') as tables,
          (SELECT count(*) FROM pg_indexes WHERE schemaname = 'public') as indexes
      ` as any[];

      const storage = result[0] || { size: '0 MB', tables: 0, indexes: 0 };

      return {
        size: storage.size,
        tables: parseInt(storage.tables),
        indexes: parseInt(storage.indexes),
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
      
      // Fallback to database check
      const result = await this.prisma.$queryRaw`
        SELECT pg_last_wal_receive_lsn() as last_backup
      ` as any[];

      return result[0]?.last_backup ? 'Recent' : 'Unknown';
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
      await this.prisma.$disconnect();
      if (this.redis) {
        await this.redis.disconnect();
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }
}

export const databaseMonitor = new DatabaseMonitor();
