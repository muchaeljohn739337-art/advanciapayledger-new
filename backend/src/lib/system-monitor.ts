import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    model: string;
    loadAverage: number[];
  };
  memory: {
    total: number;
    free: number;
    used: number;
    usage: number;
  };
  disk: {
    total: number;
    free: number;
    used: number;
    usage: number;
  };
  network: {
    upload: number;
    download: number;
  };
  uptime: number;
  timestamp: string;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
  status: string;
}

export class SystemMonitor {
  private networkStats: { rx: number; tx: number; timestamp: number } = { rx: 0, tx: 0, timestamp: Date.now() };

  async getSystemMetrics(): Promise<SystemMetrics> {
    const cpuInfo = await this.getCpuInfo();
    const memoryInfo = await this.getMemoryInfo();
    const diskInfo = await this.getDiskInfo();
    const networkInfo = await this.getNetworkInfo();
    const uptime = os.uptime();

    return {
      cpu: cpuInfo,
      memory: memoryInfo,
      disk: diskInfo,
      network: networkInfo,
      uptime,
      timestamp: new Date().toISOString(),
    };
  }

  private async getCpuInfo() {
    const cpus = os.cpus();
    const loadAverage = os.loadavg();
    
    // Get CPU usage (simplified - in production, use proper CPU monitoring)
    let totalIdle = 0;
    let totalTick = 0;
    
    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });
    
    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - (idle / total) * 100;

    return {
      usage: Math.round(usage * 100) / 100,
      cores: cpus.length,
      model: cpus[0]?.model || 'Unknown',
      loadAverage: loadAverage.map(avg => Math.round(avg * 100) / 100),
    };
  }

  private async getMemoryInfo() {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const usage = (used / total) * 100;

    return {
      total: Math.round(total / 1024 / 1024), // MB
      free: Math.round(free / 1024 / 1024), // MB
      used: Math.round(used / 1024 / 1024), // MB
      usage: Math.round(usage * 100) / 100,
    };
  }

  private async getDiskInfo() {
    try {
      // Try to get disk usage on Unix-like systems
      const { stdout } = await execAsync('df -k /');
      const lines = stdout.split('\n');
      const data = lines[1]?.split(/\s+/);
      
      if (data && data.length >= 4) {
        const total = parseInt(data[1]) * 1024; // Convert KB to bytes
        const used = parseInt(data[2]) * 1024;
        const free = parseInt(data[3]) * 1024;
        const usage = (used / total) * 100;

        return {
          total: Math.round(total / 1024 / 1024), // MB
          free: Math.round(free / 1024 / 1024), // MB
          used: Math.round(used / 1024 / 1024), // MB
          usage: Math.round(usage * 100) / 100,
        };
      }
    } catch (error) {
      console.warn('Could not get disk info:', error);
    }

    // Fallback values
    return {
      total: 0,
      free: 0,
      used: 0,
      usage: 0,
    };
  }

  private async getNetworkInfo() {
    try {
      // Try to get network stats on Unix-like systems
      const { stdout } = await execAsync('cat /proc/net/dev | grep eth0 || cat /proc/net/dev | grep en0 || cat /proc/net/dev | grep wlan0');
      const parts = stdout.trim().split(/\s+/);
      
      if (parts.length >= 10) {
        const rx = parseInt(parts[1]); // Received bytes
        const tx = parseInt(parts[9]); // Transmitted bytes
        const now = Date.now();
        
        const timeDiff = (now - this.networkStats.timestamp) / 1000; // seconds
        const rxDiff = rx - this.networkStats.rx;
        const txDiff = tx - this.networkStats.tx;
        
        this.networkStats = { rx, tx, timestamp: now };
        
        return {
          download: Math.round((rxDiff / timeDiff / 1024) * 100) / 100, // KB/s
          upload: Math.round((txDiff / timeDiff / 1024) * 100) / 100, // KB/s
        };
      }
    } catch (error) {
      console.warn('Could not get network info:', error);
    }

    // Fallback values
    return {
      download: 0,
      upload: 0,
    };
  }

  async getProcessList(): Promise<ProcessInfo[]> {
    try {
      const { stdout } = await execAsync('ps aux --no-headers | head -20');
      const processes: ProcessInfo[] = [];
      
      stdout.split('\n').forEach(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 11) {
          const cpu = parseFloat(parts[2]);
          const mem = parseFloat(parts[3]);
          const pid = parseInt(parts[1]);
          const name = parts.slice(10).join(' ').substring(0, 50);
          
          processes.push({
            pid,
            name,
            cpu,
            memory: mem,
            status: 'running',
          });
        }
      });
      
      return processes;
    } catch (error) {
      console.warn('Could not get process list:', error);
      return [];
    }
  }

  async getHealthCheck() {
    const metrics = await this.getSystemMetrics();
    const issues: string[] = [];

    // Check CPU usage
    if (metrics.cpu.usage > 90) {
      issues.push('High CPU usage detected');
    }

    // Check memory usage
    if (metrics.memory.usage > 90) {
      issues.push('High memory usage detected');
    }

    // Check disk usage
    if (metrics.disk.usage > 90) {
      issues.push('High disk usage detected');
    }

    // Check load average
    if (metrics.cpu.loadAverage[0] > metrics.cpu.cores * 2) {
      issues.push('High system load');
    }

    return {
      status: issues.length === 0 ? 'healthy' : 'warning',
      issues,
      metrics,
    };
  }
}

export const systemMonitor = new SystemMonitor();
