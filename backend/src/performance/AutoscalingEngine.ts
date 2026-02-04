import { PrismaClient } from '@prisma/client';
import { logger } from '../lib/logger';

export interface ScalingPolicy {
  id: string;
  name: string;
  service: string;
  metric: 'cpu' | 'memory' | 'request_rate' | 'queue_length' | 'response_time';
  threshold: number;
  comparison: 'greater_than' | 'less_than';
  scaleUpCooldown: number; // seconds
  scaleDownCooldown: number; // seconds
  minReplicas: number;
  maxReplicas: number;
  scaleUpStep: number;
  scaleDownStep: number;
  enabled: boolean;
  lastScaled?: Date;
}

export interface ScalingEvent {
  id: string;
  policyId: string;
  service: string;
  action: 'scale_up' | 'scale_down';
  fromReplicas: number;
  toReplicas: number;
  metric: string;
  currentValue: number;
  threshold: number;
  reason: string;
  timestamp: Date;
  duration: number; // seconds
}

export interface PerformanceMetrics {
  service: string;
  timestamp: Date;
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  memory: {
    usage: number;
    total: number;
    used: number;
    free: number;
  };
  network: {
    requestRate: number;
    responseTime: number;
    errorRate: number;
    throughput: number;
  };
  queue: {
    length: number;
    processingRate: number;
    avgWaitTime: number;
  };
  replicas: number;
}

export class AutoscalingEngine {
  private prisma: PrismaClient;
  private policies: Map<string, ScalingPolicy> = new Map();
  private metrics: Map<string, PerformanceMetrics[]> = new Map();
  private scalingHistory: ScalingEvent[] = [];
  private isRunning = false;
  private interval: NodeJS.Timeout | null = null;

  constructor() {
    this.prisma = new PrismaClient();
    this.initializePolicies();
  }

  private async initializePolicies() {
    // API Gateway Scaling Policy
    this.addPolicy({
      id: 'api-gateway-cpu',
      name: 'API Gateway CPU Scaling',
      service: 'api-gateway',
      metric: 'cpu',
      threshold: 70,
      comparison: 'greater_than',
      scaleUpCooldown: 300, // 5 minutes
      scaleDownCooldown: 600, // 10 minutes
      minReplicas: 2,
      maxReplicas: 10,
      scaleUpStep: 2,
      scaleDownStep: 1,
      enabled: true
    });

    // Monitoring Service Scaling Policy
    this.addPolicy({
      id: 'monitoring-memory',
      name: 'Monitoring Service Memory Scaling',
      service: 'monitoring-service',
      metric: 'memory',
      threshold: 80,
      comparison: 'greater_than',
      scaleUpCooldown: 300,
      scaleDownCooldown: 600,
      minReplicas: 1,
      maxReplicas: 5,
      scaleUpStep: 1,
      scaleDownStep: 1,
      enabled: true
    });

    // Web3 Service Scaling Policy
    this.addPolicy({
      id: 'web3-queue',
      name: 'Web3 Service Queue Scaling',
      service: 'web3-service',
      metric: 'queue_length',
      threshold: 100,
      comparison: 'greater_than',
      scaleUpCooldown: 180, // 3 minutes
      scaleDownCooldown: 300,
      minReplicas: 2,
      maxReplicas: 8,
      scaleUpStep: 2,
      scaleDownStep: 1,
      enabled: true
    });

    // AI Orchestrator Scaling Policy
    this.addPolicy({
      id: 'ai-response-time',
      name: 'AI Orchestrator Response Time Scaling',
      service: 'ai-orchestrator',
      metric: 'response_time',
      threshold: 5000, // 5 seconds
      comparison: 'greater_than',
      scaleUpCooldown: 120, // 2 minutes
      scaleDownCooldown: 300,
      minReplicas: 2,
      maxReplicas: 6,
      scaleUpStep: 1,
      scaleDownStep: 1,
      enabled: true
    });

    logger.info('Autoscaling policies initialized', { count: this.policies.size });
  }

  private addPolicy(policy: ScalingPolicy) {
    this.policies.set(policy.id, policy);
  }

  start() {
    if (this.isRunning) {
      logger.warn('Autoscaling engine is already running');
      return;
    }

    this.isRunning = true;
    this.interval = setInterval(() => {
      this.evaluateScalingPolicies();
    }, 30000); // Evaluate every 30 seconds

    logger.info('Autoscaling engine started');
  }

  stop() {
    if (!this.isRunning) {
      logger.warn('Autoscaling engine is not running');
      return;
    }

    this.isRunning = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    logger.info('Autoscaling engine stopped');
  }

  private async evaluateScalingPolicies() {
    const now = new Date();
    
    for (const policy of this.policies.values()) {
      if (!policy.enabled) continue;

      // Check cooldown period
      if (policy.lastScaled) {
        const timeSinceLastScale = now.getTime() - policy.lastScaled.getTime();
        const cooldown = policy.lastScaled && this.getLastScalingAction(policy.id) === 'scale_up' 
          ? policy.scaleUpCooldown * 1000 
          : policy.scaleDownCooldown * 1000;
        
        if (timeSinceLastScale < cooldown) {
          continue; // Still in cooldown period
        }
      }

      try {
        await this.evaluatePolicy(policy);
      } catch (error) {
        logger.error('Error evaluating scaling policy', {
          policyId: policy.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  private async evaluatePolicy(policy: ScalingPolicy) {
    const metrics = await this.getCurrentMetrics(policy.service);
    if (!metrics) {
      logger.warn('No metrics available for service', { service: policy.service });
      return;
    }

    const currentValue = this.getMetricValue(metrics, policy.metric);
    const shouldScale = this.shouldTriggerScaling(currentValue, policy);

    if (shouldScale) {
      const currentReplicas = metrics.replicas;
      const action = this.determineScalingAction(currentValue, policy);
      const newReplicas = this.calculateNewReplicas(currentReplicas, action, policy);

      if (newReplicas !== currentReplicas && newReplicas >= policy.minReplicas && newReplicas <= policy.maxReplicas) {
        await this.executeScaling(policy, action, currentReplicas, newReplicas, currentValue, metrics);
      }
    }
  }

  private getMetricValue(metrics: PerformanceMetrics, metric: string): number {
    switch (metric) {
      case 'cpu':
        return metrics.cpu.usage;
      case 'memory':
        return metrics.memory.usage;
      case 'request_rate':
        return metrics.network.requestRate;
      case 'queue_length':
        return metrics.queue.length;
      case 'response_time':
        return metrics.network.responseTime;
      default:
        return 0;
    }
  }

  private shouldTriggerScaling(currentValue: number, policy: ScalingPolicy): boolean {
    switch (policy.comparison) {
      case 'greater_than':
        return currentValue > policy.threshold;
      case 'less_than':
        return currentValue < policy.threshold;
      default:
        return false;
    }
  }

  private determineScalingAction(currentValue: number, policy: ScalingPolicy): 'scale_up' | 'scale_down' {
    switch (policy.comparison) {
      case 'greater_than':
        return 'scale_up';
      case 'less_than':
        return 'scale_down';
      default:
        return 'scale_up';
    }
  }

  private calculateNewReplicas(currentReplicas: number, action: 'scale_up' | 'scale_down', policy: ScalingPolicy): number {
    const step = action === 'scale_up' ? policy.scaleUpStep : policy.scaleDownStep;
    return action === 'scale_up' 
      ? Math.min(currentReplicas + step, policy.maxReplicas)
      : Math.max(currentReplicas - step, policy.minReplicas);
  }

  private async executeScaling(
    policy: ScalingPolicy,
    action: 'scale_up' | 'scale_down',
    fromReplicas: number,
    toReplicas: number,
    currentValue: number,
    metrics: PerformanceMetrics
  ) {
    const startTime = Date.now();
    
    try {
      // Execute scaling action (this would integrate with Kubernetes API)
      await this.performScalingAction(policy.service, toReplicas);
      
      const duration = (Date.now() - startTime) / 1000;
      
      // Record scaling event
      const event: ScalingEvent = {
        id: `scale-${Date.now()}`,
        policyId: policy.id,
        service: policy.service,
        action,
        fromReplicas,
        toReplicas,
        metric: policy.metric,
        currentValue,
        threshold: policy.threshold,
        reason: `${policy.metric} ${policy.comparison} ${policy.threshold} (current: ${currentValue})`,
        timestamp: new Date(),
        duration
      };

      this.scalingHistory.push(event);
      policy.lastScaled = new Date();

      // Log scaling event
      logger.info('Scaling executed', {
        service: policy.service,
        action,
        fromReplicas,
        toReplicas,
        metric: policy.metric,
        currentValue,
        threshold,
        duration
      });

      // Store in database
      await this.recordScalingEvent(event);

    } catch (error) {
      logger.error('Scaling execution failed', {
        service: policy.service,
        action,
        fromReplicas,
        toReplicas,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async performScalingAction(service: string, replicas: number): Promise<void> {
    // This would integrate with Kubernetes API to actually scale the deployment
    // For now, we'll simulate the scaling action
    
    logger.info('Performing scaling action', {
      service,
      replicas,
      action: 'simulated'
    });

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In a real implementation, this would use the Kubernetes client:
    /*
    const k8sApi = k8s.makeApi(Kubernetes.CoreV1Api);
    const deployment = await k8sApi.readNamespacedDeployment(service, 'advancia');
    deployment.body.spec.replicas = replicas;
    await k8sApi.replaceNamespacedDeployment(service, 'advancia', deployment.body);
    */
  }

  private async recordScalingEvent(event: ScalingEvent): Promise<void> {
    // Store scaling event in database for historical analysis
    try {
      // This would use Prisma to store the event
      logger.debug('Scaling event recorded', { eventId: event.id });
    } catch (error) {
      logger.error('Failed to record scaling event', {
        eventId: event.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private getLastScalingAction(policyId: string): 'scale_up' | 'scale_down' | null {
    const lastEvent = this.scalingHistory
      .filter(event => event.policyId === policyId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
    
    return lastEvent ? lastEvent.action : null;
  }

  async getCurrentMetrics(service: string): Promise<PerformanceMetrics | null> {
    // This would fetch real metrics from monitoring system
    // For now, we'll simulate metrics
    
    const serviceMetrics = this.metrics.get(service);
    const latestMetrics = serviceMetrics ? serviceMetrics[serviceMetrics.length - 1] : null;

    if (!latestMetrics) {
      // Generate simulated metrics
      return this.generateSimulatedMetrics(service);
    }

    return latestMetrics;
  }

  private generateSimulatedMetrics(service: string): PerformanceMetrics {
    const baseLoad = {
      'api-gateway': { cpu: 45, memory: 60, requestRate: 150, responseTime: 200 },
      'monitoring-service': { cpu: 30, memory: 70, requestRate: 50, responseTime: 100 },
      'web3-service': { cpu: 55, memory: 65, requestRate: 80, responseTime: 300 },
      'ai-orchestrator': { cpu: 70, memory: 75, requestRate: 40, responseTime: 800 }
    };

    const base = baseLoad[service as keyof typeof baseLoad] || { cpu: 50, memory: 60, requestRate: 100, responseTime: 250 };
    
    // Add some randomness
    const variance = 0.2; // 20% variance
    
    return {
      service,
      timestamp: new Date(),
      cpu: {
        usage: base.cpu * (1 + (Math.random() - 0.5) * variance),
        cores: 4,
        loadAverage: [base.cpu * 0.8, base.cpu * 0.9, base.cpu * 1.1]
      },
      memory: {
        usage: base.memory * (1 + (Math.random() - 0.5) * variance),
        total: 8192,
        used: base.memory * 81.92,
        free: 8192 - (base.memory * 81.92)
      },
      network: {
        requestRate: base.requestRate * (1 + (Math.random() - 0.5) * variance),
        responseTime: base.responseTime * (1 + (Math.random() - 0.5) * variance),
        errorRate: Math.random() * 5, // 0-5% error rate
        throughput: base.requestRate * 1000 // bytes per second
      },
      queue: {
        length: Math.floor(Math.random() * 200),
        processingRate: base.requestRate * 0.8,
        avgWaitTime: base.responseTime * 0.5
      },
      replicas: 2 // Default replica count
    };
  }

  async addMetrics(metrics: PerformanceMetrics): Promise<void> {
    if (!this.metrics.has(metrics.service)) {
      this.metrics.set(metrics.service, []);
    }
    
    const serviceMetrics = this.metrics.get(metrics.service)!;
    serviceMetrics.push(metrics);
    
    // Keep only last 100 data points per service
    if (serviceMetrics.length > 100) {
      serviceMetrics.splice(0, serviceMetrics.length - 100);
    }
  }

  async getScalingHistory(service?: string, limit: number = 50): Promise<ScalingEvent[]> {
    let history = this.scalingHistory;
    
    if (service) {
      history = history.filter(event => event.service === service);
    }
    
    return history
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async getScalingMetrics(): Promise<{
    totalScalingEvents: number;
    scaleUpEvents: number;
    scaleDownEvents: number;
    averageScalingTime: number;
    servicesWithScaling: string[];
    scalingFrequency: Record<string, number>;
  }> {
    const totalEvents = this.scalingHistory.length;
    const scaleUpEvents = this.scalingHistory.filter(event => event.action === 'scale_up').length;
    const scaleDownEvents = this.scalingHistory.filter(event => event.action === 'scale_down').length;
    
    const averageScalingTime = totalEvents > 0 
      ? this.scalingHistory.reduce((sum, event) => sum + event.duration, 0) / totalEvents
      : 0;

    const servicesWithScaling = Array.from(new Set(this.scalingHistory.map(event => event.service)));
    
    const scalingFrequency: Record<string, number> = {};
    servicesWithScaling.forEach(service => {
      scalingFrequency[service] = this.scalingHistory.filter(event => event.service === service).length;
    });

    return {
      totalScalingEvents: totalEvents,
      scaleUpEvents,
      scaleDownEvents,
      averageScalingTime: Math.round(averageScalingTime * 100) / 100,
      servicesWithScaling,
      scalingFrequency
    };
  }

  async updatePolicy(policyId: string, updates: Partial<ScalingPolicy>): Promise<void> {
    const policy = this.policies.get(policyId);
    if (!policy) {
      throw new Error(`Policy not found: ${policyId}`);
    }

    const updatedPolicy = { ...policy, ...updates };
    this.policies.set(policyId, updatedPolicy);
    
    logger.info('Scaling policy updated', {
      policyId,
      updates: Object.keys(updates)
    });
  }

  async enablePolicy(policyId: string): Promise<void> {
    await this.updatePolicy(policyId, { enabled: true });
  }

  async disablePolicy(policyId: string): Promise<void> {
    await this.updatePolicy(policyId, { enabled: false });
  }

  getPolicies(): ScalingPolicy[] {
    return Array.from(this.policies.values());
  }

  getPolicy(policyId: string): ScalingPolicy | undefined {
    return this.policies.get(policyId);
  }
}

export const autoscalingEngine = new AutoscalingEngine();
