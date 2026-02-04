import express from 'express';
import { autoscalingEngine } from './AutoscalingEngine';
import { performanceTesting } from './PerformanceTesting';
import { authMiddleware } from '../middleware/auth';
import { rbacMiddleware } from '../middleware/rbac';

const router = express.Router();

// Apply authentication and RBAC to all performance routes
router.use(authMiddleware);
router.use(rbacMiddleware('performance', 'read'));

/**
 * GET /api/performance/autoscaling/policies
 * Get all autoscaling policies
 */
router.get('/autoscaling/policies', async (req, res) => {
  try {
    const policies = autoscalingEngine.getPolicies();
    
    res.json({
      success: true,
      data: policies,
      total: policies.length
    });
  } catch (error) {
    console.error('Error fetching autoscaling policies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch autoscaling policies',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/performance/autoscaling/policies/:policyId
 * Get specific autoscaling policy
 */
router.get('/autoscaling/policies/:policyId', async (req, res) => {
  try {
    const { policyId } = req.params;
    const policy = autoscalingEngine.getPolicy(policyId);
    
    if (!policy) {
      return res.status(404).json({
        success: false,
        error: 'Policy not found',
        message: `Policy ${policyId} not found`
      });
    }

    res.json({
      success: true,
      data: policy
    });
  } catch (error) {
    console.error('Error fetching autoscaling policy:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch autoscaling policy',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/performance/autoscaling/policies/:policyId
 * Update autoscaling policy
 */
router.put('/autoscaling/policies/:policyId', rbacMiddleware('performance', 'write'), async (req, res) => {
  try {
    const { policyId } = req.params;
    const updates = req.body;
    
    await autoscalingEngine.updatePolicy(policyId, updates);
    
    res.json({
      success: true,
      message: 'Policy updated successfully'
    });
  } catch (error) {
    console.error('Error updating autoscaling policy:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update autoscaling policy',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/performance/autoscaling/policies/:policyId/enable
 * Enable autoscaling policy
 */
router.post('/autoscaling/policies/:policyId/enable', rbacMiddleware('performance', 'write'), async (req, res) => {
  try {
    const { policyId } = req.params;
    
    await autoscalingEngine.enablePolicy(policyId);
    
    res.json({
      success: true,
      message: 'Policy enabled successfully'
    });
  } catch (error) {
    console.error('Error enabling autoscaling policy:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to enable autoscaling policy',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/performance/autoscaling/policies/:policyId/disable
 * Disable autoscaling policy
 */
router.post('/autoscaling/policies/:policyId/disable', rbacMiddleware('performance', 'write'), async (req, res) => {
  try {
    const { policyId } = req.params;
    
    await autoscalingEngine.disablePolicy(policyId);
    
    res.json({
      success: true,
      message: 'Policy disabled successfully'
    });
  } catch (error) {
    console.error('Error disabling autoscaling policy:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disable autoscaling policy',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/performance/autoscaling/history
 * Get autoscaling history
 */
router.get('/autoscaling/history', async (req, res) => {
  try {
    const { service, limit = 50 } = req.query;
    const history = await autoscalingEngine.getScalingHistory(
      service as string,
      parseInt(limit as string)
    );
    
    res.json({
      success: true,
      data: history,
      total: history.length
    });
  } catch (error) {
    console.error('Error fetching autoscaling history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch autoscaling history',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/performance/autoscaling/metrics
 * Get autoscaling metrics
 */
router.get('/autoscaling/metrics', async (req, res) => {
  try {
    const metrics = await autoscalingEngine.getScalingMetrics();
    
    res.json({
      success: true,
      data: metrics,
      calculatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching autoscaling metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch autoscaling metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/performance/testing/scenarios
 * Get all performance test scenarios
 */
router.get('/testing/scenarios', async (req, res) => {
  try {
    const scenarios = await performanceTesting.getScenarios();
    
    res.json({
      success: true,
      data: scenarios,
      total: scenarios.length
    });
  } catch (error) {
    console.error('Error fetching test scenarios:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch test scenarios',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/performance/testing/scenarios/:scenarioId
 * Get specific test scenario
 */
router.get('/testing/scenarios/:scenarioId', async (req, res) => {
  try {
    const { scenarioId } = req.params;
    const scenario = await performanceTesting.getScenario(scenarioId);
    
    if (!scenario) {
      return res.status(404).json({
        success: false,
        error: 'Scenario not found',
        message: `Scenario ${scenarioId} not found`
      });
    }

    res.json({
      success: true,
      data: scenario
    });
  } catch (error) {
    console.error('Error fetching test scenario:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch test scenario',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/performance/testing/scenarios/:scenarioId
 * Update test scenario
 */
router.put('/testing/scenarios/:scenarioId', rbacMiddleware('performance', 'write'), async (req, res) => {
  try {
    const { scenarioId } = req.params;
    const updates = req.body;
    
    await performanceTesting.updateScenario(scenarioId, updates);
    
    res.json({
      success: true,
      message: 'Scenario updated successfully'
    });
  } catch (error) {
    console.error('Error updating test scenario:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update test scenario',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/performance/testing/scenarios/:scenarioId/run
 * Run performance test
 */
router.post('/testing/scenarios/:scenarioId/run', rbacMiddleware('performance', 'write'), async (req, res) => {
  try {
    const { scenarioId } = req.params;
    const { environment = 'staging' } = req.body;
    
    const testId = await performanceTesting.runTest(scenarioId);
    
    res.json({
      success: true,
      data: {
        testId,
        scenarioId,
        environment,
        status: 'running'
      },
      startedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error running performance test:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run performance test',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/performance/testing/results
 * Get test results
 */
router.get('/testing/results', async (req, res) => {
  try {
    const { scenarioId, limit = 20 } = req.query;
    const results = await performanceTesting.getTestResults(
      scenarioId as string
    );
    
    const limitedResults = results.slice(0, parseInt(limit as string));
    
    res.json({
      success: true,
      data: limitedResults,
      total: results.length
    });
  } catch (error) {
    console.error('Error fetching test results:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch test results',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/performance/testing/results/:testId
 * Get specific test result
 */
router.get('/testing/results/:testId', async (req, res) => {
  try {
    const { testId } = req.params;
    const result = await performanceTesting.getTestResult(testId);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Test result not found',
        message: `Test result ${testId} not found`
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching test result:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch test result',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/performance/testing/results/:testId/cancel
 * Cancel running test
 */
router.post('/testing/results/:testId/cancel', rbacMiddleware('performance', 'write'), async (req, res) => {
  try {
    const { testId } = req.params;
    
    await performanceTesting.cancelTest(testId);
    
    res.json({
      success: true,
      message: 'Test cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling test:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel test',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/performance/testing/results/:testId/report
 * Get comprehensive test report
 */
router.get('/testing/results/:testId/report', async (req, res) => {
  try {
    const { testId } = req.params;
    const report = await performanceTesting.getPerformanceReport(testId);
    
    res.json({
      success: true,
      data: report,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating test report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate test report',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/performance/testing/baselines
 * Get performance baselines
 */
router.get('/testing/baselines', async (req, res) => {
  try {
    const baselines = await performanceTesting.getBaselines();
    
    res.json({
      success: true,
      data: baselines,
      total: baselines.length
    });
  } catch (error) {
    console.error('Error fetching baselines:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch baselines',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/performance/testing/baselines
 * Create performance baseline
 */
router.post('/testing/baselines', rbacMiddleware('performance', 'write'), async (req, res) => {
  try {
    const {
      service,
      endpoint,
      version,
      metrics,
      environment = 'staging'
    } = req.body;
    
    await performanceTesting.createBaseline(
      service,
      endpoint,
      version,
      metrics,
      environment
    );
    
    res.json({
      success: true,
      message: 'Baseline created successfully'
    });
  } catch (error) {
    console.error('Error creating baseline:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create baseline',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/performance/dashboard
 * Get performance dashboard data
 */
router.get('/dashboard', async (req, res) => {
  try {
    const [scalingMetrics, testResults, scenarios] = await Promise.all([
      autoscalingEngine.getScalingMetrics(),
      performanceTesting.getTestResults(),
      performanceTesting.getScenarios()
    ]);

    const recentTests = testResults.slice(0, 10);
    const activeScenarios = scenarios.filter(s => s.status === 'running');
    const completedTests = testResults.filter(r => r.status === 'completed');

    const dashboard = {
      autoscaling: {
        totalEvents: scalingMetrics.totalScalingEvents,
        scaleUpEvents: scalingMetrics.scaleUpEvents,
        scaleDownEvents: scalingMetrics.scaleDownEvents,
        averageScalingTime: scalingMetrics.averageScalingTime,
        servicesWithScaling: scalingMetrics.servicesWithScaling
      },
      testing: {
        totalTests: completedTests.length,
        runningTests: activeScenarios.length,
        recentTests: recentTests.map(test => ({
          id: test.id,
          scenarioId: test.scenarioId,
          status: test.status,
          duration: test.duration,
          averageResponseTime: test.metrics.averageResponseTime,
          errorRate: test.metrics.errorRate
        })),
        successRate: completedTests.length > 0 
          ? (completedTests.filter(t => t.status === 'completed').length / completedTests.length) * 100
          : 0
      },
      performance: {
        averageResponseTime: completedTests.length > 0
          ? completedTests.reduce((sum, t) => sum + t.metrics.averageResponseTime, 0) / completedTests.length
          : 0,
        averageErrorRate: completedTests.length > 0
          ? completedTests.reduce((sum, t) => sum + t.metrics.errorRate, 0) / completedTests.length
          : 0,
        averageThroughput: completedTests.length > 0
          ? completedTests.reduce((sum, t) => sum + t.metrics.throughput, 0) / completedTests.length
          : 0
      }
    };

    res.json({
      success: true,
      data: dashboard,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching performance dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch performance dashboard',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
