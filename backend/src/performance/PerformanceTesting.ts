import { logger } from '../lib/logger';

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  type: 'load' | 'stress' | 'spike' | 'endurance' | 'capacity';
  target: {
    endpoint: string;
    method: string;
    headers?: Record<string, string>;
    body?: any;
  };
  parameters: {
    concurrentUsers: number;
    duration: number; // seconds
    rampUp: number; // seconds
    thinkTime: number; // seconds between requests
    requestsPerSecond?: number;
  };
  thresholds: {
    responseTime: number; // milliseconds
    errorRate: number; // percentage
    throughput: number; // requests per second
    cpuUsage: number; // percentage
    memoryUsage: number; // percentage
  };
  status: 'draft' | 'running' | 'completed' | 'failed' | 'cancelled';
}

export interface TestResult {
  id: string;
  scenarioId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  metrics: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    p50ResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    throughput: number;
    errorRate: number;
    cpuUsage: number[];
    memoryUsage: number[];
  };
  errors: Array<{
    timestamp: Date;
    error: string;
    statusCode?: number;
    responseTime?: number;
  }>;
  samples: Array<{
    timestamp: Date;
    responseTime: number;
    statusCode: number;
    success: boolean;
  }>;
}

export interface PerformanceBaseline {
  id: string;
  service: string;
  endpoint: string;
  version: string;
  baselineMetrics: {
    averageResponseTime: number;
    p95ResponseTime: number;
    throughput: number;
    errorRate: number;
  };
  createdAt: Date;
  environment: 'development' | 'staging' | 'production';
}

export class PerformanceTesting {
  private scenarios: Map<string, TestScenario> = new Map();
  private results: Map<string, TestResult> = new Map();
  private baselines: Map<string, PerformanceBaseline> = new Map();
  private activeTests: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.initializeScenarios();
    this.initializeBaselines();
  }

  private initializeScenarios() {
    // API Gateway Load Test
    this.addScenario({
      id: 'api-gateway-load',
      name: 'API Gateway Load Test',
      description: 'Standard load test for API Gateway',
      type: 'load',
      target: {
        endpoint: '/health',
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      },
      parameters: {
        concurrentUsers: 100,
        duration: 300, // 5 minutes
        rampUp: 60, // 1 minute
        thinkTime: 1,
        requestsPerSecond: 50
      },
      thresholds: {
        responseTime: 500, // 500ms
        errorRate: 1, // 1%
        throughput: 45, // 45 RPS
        cpuUsage: 70, // 70%
        memoryUsage: 80 // 80%
      },
      status: 'draft'
    });

    // Web3 Service Stress Test
    this.addScenario({
      id: 'web3-stress',
      name: 'Web3 Service Stress Test',
      description: 'High-load stress test for Web3 event processing',
      type: 'stress',
      target: {
        endpoint: '/events/subscribe',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { contract: '0x123...', events: ['Transfer', 'Approval'] }
      },
      parameters: {
        concurrentUsers: 200,
        duration: 600, // 10 minutes
        rampUp: 120, // 2 minutes
        thinkTime: 0.5,
        requestsPerSecond: 100
      },
      thresholds: {
        responseTime: 1000, // 1s
        errorRate: 2, // 2%
        throughput: 90, // 90 RPS
        cpuUsage: 85, // 85%
        memoryUsage: 85 // 85%
      },
      status: 'draft'
    });

    // AI Orchestrator Spike Test
    this.addScenario({
      id: 'ai-spike',
      name: 'AI Orchestrator Spike Test',
      description: 'Sudden traffic spike test for AI service',
      type: 'spike',
      target: {
        endpoint: '/tasks/submit',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { type: 'code', input: 'Generate a simple API' }
      },
      parameters: {
        concurrentUsers: 50,
        duration: 180, // 3 minutes
        rampUp: 10, // 10 seconds
        thinkTime: 2,
        requestsPerSecond: 25
      },
      thresholds: {
        responseTime: 2000, // 2s
        errorRate: 3, // 3%
        throughput: 20, // 20 RPS
        cpuUsage: 80, // 80%
        memoryUsage: 80 // 80%
      },
      status: 'draft'
    });

    // Monitoring Service Endurance Test
    this.addScenario({
      id: 'monitoring-endurance',
      name: 'Monitoring Service Endurance Test',
      description: 'Long-running endurance test for monitoring service',
      type: 'endurance',
      target: {
        endpoint: '/metrics',
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      },
      parameters: {
        concurrentUsers: 20,
        duration: 3600, // 1 hour
        rampUp: 300, // 5 minutes
        thinkTime: 5,
        requestsPerSecond: 10
      },
      thresholds: {
        responseTime: 300, // 300ms
        errorRate: 0.5, // 0.5%
        throughput: 8, // 8 RPS
        cpuUsage: 60, // 60%
        memoryUsage: 70 // 70%
      },
      status: 'draft'
    });

    logger.info('Performance test scenarios initialized', { count: this.scenarios.size });
  }

  private initializeBaselines() {
    // API Gateway Baseline
    this.addBaseline({
      id: 'api-gateway-baseline',
      service: 'api-gateway',
      endpoint: '/health',
      version: 'v1.0.0',
      baselineMetrics: {
        averageResponseTime: 45,
        p95ResponseTime: 120,
        throughput: 1000,
        errorRate: 0.1
      },
      createdAt: new Date(),
      environment: 'staging'
    });

    // Web3 Service Baseline
    this.addBaseline({
      id: 'web3-baseline',
      service: 'web3-service',
      endpoint: '/events/subscribe',
      version: 'v1.0.0',
      baselineMetrics: {
        averageResponseTime: 150,
        p95ResponseTime: 300,
        throughput: 500,
        errorRate: 0.2
      },
      createdAt: new Date(),
      environment: 'staging'
    });

    // AI Orchestrator Baseline
    this.addBaseline({
      id: 'ai-baseline',
      service: 'ai-orchestrator',
      endpoint: '/tasks/submit',
      version: 'v1.0.0',
      baselineMetrics: {
        averageResponseTime: 800,
        p95ResponseTime: 1500,
        throughput: 50,
        errorRate: 1.0
      },
      createdAt: new Date(),
      environment: 'staging'
    });
  }

  private addScenario(scenario: TestScenario) {
    this.scenarios.set(scenario.id, scenario);
  }

  private addBaseline(baseline: PerformanceBaseline) {
    this.baselines.set(baseline.id, baseline);
  }

  async runTest(scenarioId: string): Promise<string> {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
      throw new Error(`Test scenario not found: ${scenarioId}`);
    }

    if (scenario.status === 'running') {
      throw new Error(`Test is already running: ${scenarioId}`);
    }

    const testId = `test-${Date.now()}`;
    const result: TestResult = {
      id: testId,
      scenarioId,
      startTime: new Date(),
      status: 'running',
      metrics: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        minResponseTime: Infinity,
        maxResponseTime: 0,
        p50ResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        throughput: 0,
        errorRate: 0,
        cpuUsage: [],
        memoryUsage: []
      },
      errors: [],
      samples: []
    };

    this.results.set(testId, result);
    scenario.status = 'running';

    // Start the test
    const timeout = setTimeout(() => {
      this.completeTest(testId);
    }, scenario.parameters.duration * 1000);

    this.activeTests.set(testId, timeout);

    // Execute the test (simulation)
    this.executeTest(scenario, result);

    logger.info('Performance test started', {
      testId,
      scenarioId,
      scenarioName: scenario.name,
      duration: scenario.parameters.duration
    });

    return testId;
  }

  private async executeTest(scenario: TestScenario, result: TestResult) {
    const { target, parameters } = scenario;
    const startTime = Date.now();

    // Simulate concurrent users
    for (let user = 0; user < parameters.concurrentUsers; user++) {
      setTimeout(() => {
        this.simulateUser(target, parameters, result, startTime);
      }, (user * parameters.rampUp * 1000) / parameters.concurrentUsers);
    }
  }

  private async simulateUser(
    target: TestScenario['target'],
    parameters: TestScenario['parameters'],
    result: TestResult,
    testStartTime: number
  ) {
    const endTime = testStartTime + (parameters.duration * 1000);
    let requestCount = 0;

    const makeRequest = async () => {
      if (Date.now() >= endTime) return;

      const requestStart = Date.now();
      
      try {
        // Simulate HTTP request
        const responseTime = this.simulateResponseTime(target.endpoint);
        const success = Math.random() > 0.01; // 99% success rate
        const statusCode = success ? 200 : [400, 500, 502, 503][Math.floor(Math.random() * 4)];

        // Record sample
        const sample = {
          timestamp: new Date(),
          responseTime,
          statusCode,
          success
        };

        result.samples.push(sample);
        result.metrics.totalRequests++;
        
        if (success) {
          result.metrics.successfulRequests++;
        } else {
          result.metrics.failedRequests++;
          result.errors.push({
            timestamp: new Date(),
            error: `HTTP ${statusCode}`,
            statusCode,
            responseTime
          });
        }

        // Update metrics
        this.updateMetrics(result);

      } catch (error) {
        result.metrics.failedRequests++;
        result.errors.push({
          timestamp: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Think time before next request
      setTimeout(makeRequest, parameters.thinkTime * 1000);
    };

    // Start making requests
    makeRequest();
  }

  private simulateResponseTime(endpoint: string): number {
    // Simulate different response times based on endpoint
    const baseTimes: Record<string, number> = {
      '/health': 50,
      '/events/subscribe': 150,
      '/tasks/submit': 800,
      '/metrics': 30
    };

    const baseTime = baseTimes[endpoint] || 100;
    const variance = baseTime * 0.5; // 50% variance
    return Math.max(10, baseTime + (Math.random() - 0.5) * variance * 2);
  }

  private updateMetrics(result: TestResult) {
    const samples = result.samples;
    
    if (samples.length === 0) return;

    // Response time metrics
    const responseTimes = samples.map(s => s.responseTime);
    result.metrics.averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    result.metrics.minResponseTime = Math.min(...responseTimes);
    result.metrics.maxResponseTime = Math.max(...responseTimes);
    
    // Percentiles
    const sorted = responseTimes.sort((a, b) => a - b);
    result.metrics.p50ResponseTime = sorted[Math.floor(sorted.length * 0.5)];
    result.metrics.p95ResponseTime = sorted[Math.floor(sorted.length * 0.95)];
    result.metrics.p99ResponseTime = sorted[Math.floor(sorted.length * 0.99)];

    // Error rate
    result.metrics.errorRate = (result.metrics.failedRequests / result.metrics.totalRequests) * 100;

    // Throughput (requests per second)
    const duration = (Date.now() - result.startTime.getTime()) / 1000;
    result.metrics.throughput = result.metrics.totalRequests / duration;

    // Simulate system metrics
    const cpuUsage = 50 + Math.random() * 30; // 50-80%
    const memoryUsage = 60 + Math.random() * 20; // 60-80%
    
    result.metrics.cpuUsage.push(cpuUsage);
    result.metrics.memoryUsage.push(memoryUsage);
  }

  private completeTest(testId: string) {
    const result = this.results.get(testId);
    const scenario = result ? this.scenarios.get(result.scenarioId) : null;

    if (!result || !scenario) return;

    result.endTime = new Date();
    result.duration = (result.endTime.getTime() - result.startTime.getTime()) / 1000;
    result.status = 'completed';
    scenario.status = 'completed';

    // Clear active test
    const timeout = this.activeTests.get(testId);
    if (timeout) {
      clearTimeout(timeout);
      this.activeTests.delete(testId);
    }

    // Compare with baseline
    this.compareWithBaseline(result);

    logger.info('Performance test completed', {
      testId,
      scenarioId: result.scenarioId,
      duration: result.duration,
      totalRequests: result.metrics.totalRequests,
      averageResponseTime: result.metrics.averageResponseTime,
      errorRate: result.metrics.errorRate
    });
  }

  private compareWithBaseline(result: TestResult) {
    const scenario = this.scenarios.get(result.scenarioId);
    if (!scenario) return;

    // Find baseline for this service
    const baseline = Array.from(this.baselines.values()).find(b => 
      b.service === scenario.target.endpoint.split('/')[1] // Extract service from endpoint
    );

    if (!baseline) return;

    const comparison = {
      responseTimeDiff: result.metrics.averageResponseTime - baseline.baselineMetrics.averageResponseTime,
      p95ResponseTimeDiff: result.metrics.p95ResponseTime - baseline.baselineMetrics.p95ResponseTime,
      throughputDiff: result.metrics.throughput - baseline.baselineMetrics.throughput,
      errorRateDiff: result.metrics.errorRate - baseline.baselineMetrics.errorRate
    };

    logger.info('Performance comparison with baseline', {
      testId: result.id,
      baselineId: baseline.id,
      comparison
    });
  }

  async cancelTest(testId: string): Promise<void> {
    const result = this.results.get(testId);
    const scenario = result ? this.scenarios.get(result.scenarioId) : null;

    if (!result || !scenario) {
      throw new Error(`Test not found: ${testId}`);
    }

    if (result.status !== 'running') {
      throw new Error(`Test is not running: ${testId}`);
    }

    // Clear timeout
    const timeout = this.activeTests.get(testId);
    if (timeout) {
      clearTimeout(timeout);
      this.activeTests.delete(testId);
    }

    // Update status
    result.endTime = new Date();
    result.duration = (result.endTime.getTime() - result.startTime.getTime()) / 1000;
    result.status = 'cancelled';
    scenario.status = 'cancelled';

    logger.info('Performance test cancelled', {
      testId,
      scenarioId: result.scenarioId,
      duration: result.duration
    });
  }

  async getTestResult(testId: string): Promise<TestResult | null> {
    return this.results.get(testId) || null;
  }

  async getTestResults(scenarioId?: string): Promise<TestResult[]> {
    let results = Array.from(this.results.values());
    
    if (scenarioId) {
      results = results.filter(result => result.scenarioId === scenarioId);
    }

    return results.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  async getScenarios(): Promise<TestScenario[]> {
    return Array.from(this.scenarios.values());
  }

  async getScenario(scenarioId: string): Promise<TestScenario | null> {
    return this.scenarios.get(scenarioId) || null;
  }

  async updateScenario(scenarioId: string, updates: Partial<TestScenario>): Promise<void> {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
      throw new Error(`Scenario not found: ${scenarioId}`);
    }

    const updatedScenario = { ...scenario, ...updates };
    this.scenarios.set(scenarioId, updatedScenario);
    
    logger.info('Performance test scenario updated', {
      scenarioId,
      updates: Object.keys(updates)
    });
  }

  async getBaselines(): Promise<PerformanceBaseline[]> {
    return Array.from(this.baselines.values());
  }

  async createBaseline(
    service: string,
    endpoint: string,
    version: string,
    metrics: PerformanceBaseline['baselineMetrics'],
    environment: 'development' | 'staging' | 'production'
  ): Promise<void> {
    const baseline: PerformanceBaseline = {
      id: `baseline-${Date.now()}`,
      service,
      endpoint,
      version,
      baselineMetrics: metrics,
      createdAt: new Date(),
      environment
    };

    this.baselines.set(baseline.id, baseline);
    
    logger.info('Performance baseline created', {
      baselineId: baseline.id,
      service,
      endpoint,
      version,
      environment
    });
  }

  async getPerformanceReport(testId: string): Promise<{
    test: TestResult;
    scenario: TestScenario;
    baseline?: PerformanceBaseline;
    comparison?: {
      responseTimeDiff: number;
      p95ResponseTimeDiff: number;
      throughputDiff: number;
      errorRateDiff: number;
    };
    recommendations: string[];
  }> {
    const result = this.results.get(testId);
    const scenario = result ? this.scenarios.get(result.scenarioId) : null;

    if (!result || !scenario) {
      throw new Error(`Test result not found: ${testId}`);
    }

    const baseline = Array.from(this.baselines.values()).find(b => 
      b.service === scenario.target.endpoint.split('/')[1]
    );

    const recommendations = this.generateRecommendations(result, scenario, baseline);

    return {
      test: result,
      scenario,
      baseline,
      comparison: baseline ? {
        responseTimeDiff: result.metrics.averageResponseTime - baseline.baselineMetrics.averageResponseTime,
        p95ResponseTimeDiff: result.metrics.p95ResponseTime - baseline.baselineMetrics.p95ResponseTime,
        throughputDiff: result.metrics.throughput - baseline.baselineMetrics.throughput,
        errorRateDiff: result.metrics.errorRate - baseline.baselineMetrics.errorRate
      } : undefined,
      recommendations
    };
  }

  private generateRecommendations(
    result: TestResult,
    scenario: TestScenario,
    baseline?: PerformanceBaseline
  ): string[] {
    const recommendations: string[] = [];
    const { metrics, thresholds } = scenario;

    // Response time recommendations
    if (result.metrics.averageResponseTime > thresholds.responseTime) {
      recommendations.push('Average response time exceeds threshold. Consider optimizing database queries or adding caching.');
    }

    if (result.metrics.p95ResponseTime > thresholds.responseTime * 2) {
      recommendations.push('P95 response time is significantly higher than average. Investigate outliers and performance bottlenecks.');
    }

    // Error rate recommendations
    if (result.metrics.errorRate > thresholds.errorRate) {
      recommendations.push('Error rate exceeds threshold. Review error logs and improve error handling.');
    }

    // Throughput recommendations
    if (result.metrics.throughput < thresholds.throughput) {
      recommendations.push('Throughput below expected. Consider scaling resources or optimizing application performance.');
    }

    // Baseline comparison recommendations
    if (baseline) {
      if (result.metrics.averageResponseTime > baseline.baselineMetrics.averageResponseTime * 1.2) {
        recommendations.push('Response time has degraded compared to baseline. Investigate recent changes.');
      }

      if (result.metrics.errorRate > baseline.baselineMetrics.errorRate * 2) {
        recommendations.push('Error rate has increased significantly from baseline. Review recent deployments.');
      }
    }

    // Resource usage recommendations
    const avgCpuUsage = result.metrics.cpuUsage.reduce((a, b) => a + b, 0) / result.metrics.cpuUsage.length;
    const avgMemoryUsage = result.metrics.memoryUsage.reduce((a, b) => a + b, 0) / result.metrics.memoryUsage.length;

    if (avgCpuUsage > thresholds.cpuUsage) {
      recommendations.push('CPU usage is high. Consider scaling horizontally or optimizing CPU-intensive operations.');
    }

    if (avgMemoryUsage > thresholds.memoryUsage) {
      recommendations.push('Memory usage is high. Check for memory leaks and consider increasing memory allocation.');
    }

    return recommendations;
  }
}

export const performanceTesting = new PerformanceTesting();
