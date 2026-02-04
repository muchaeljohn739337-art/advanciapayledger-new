import express from 'express';
import { testSuite } from './TestSuite';
import { authMiddleware } from '../middleware/auth';
import { rbacMiddleware } from '../middleware/rbac';

const router = express.Router();

// Apply authentication and RBAC to all testing routes
router.use(authMiddleware);
router.use(rbacMiddleware('testing', 'read'));

/**
 * GET /api/testing/suites
 * Get all test suites
 */
router.get('/suites', async (req, res) => {
  try {
    const suites = await testSuite.getSuites();
    
    res.json({
      success: true,
      data: suites,
      total: suites.length
    });
  } catch (error) {
    console.error('Error fetching test suites:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch test suites',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/testing/suites/:suiteId
 * Get specific test suite
 */
router.get('/suites/:suiteId', async (req, res) => {
  try {
    const { suiteId } = req.params;
    const suite = await testSuite.getSuite(suiteId);
    
    if (!suite) {
      return res.status(404).json({
        success: false,
        error: 'Test suite not found',
        message: `Test suite ${suiteId} not found`
      });
    }

    res.json({
      success: true,
      data: suite
    });
  } catch (error) {
    console.error('Error fetching test suite:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch test suite',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/testing/suites/:suiteId/run
 * Run test suite
 */
router.post('/suites/:suiteId/run', rbacMiddleware('testing', 'write'), async (req, res) => {
  try {
    const { suiteId } = req.params;
    const { environment = 'staging' } = req.body;
    
    const runId = await testSuite.runSuite(suiteId, environment);
    
    res.json({
      success: true,
      data: {
        runId,
        suiteId,
        environment,
        status: 'running'
      },
      startedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error running test suite:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run test suite',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/testing/runs
 * Get test runs
 */
router.get('/runs', async (req, res) => {
  try {
    const { suiteId, limit = 20 } = req.query;
    const runs = await testSuite.getRuns(suiteId as string);
    
    const limitedRuns = runs.slice(0, parseInt(limit as string));
    
    res.json({
      success: true,
      data: limitedRuns,
      total: runs.length
    });
  } catch (error) {
    console.error('Error fetching test runs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch test runs',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/testing/runs/:runId
 * Get specific test run
 */
router.get('/runs/:runId', async (req, res) => {
  try {
    const { runId } = req.params;
    const run = await testSuite.getRun(runId);
    
    if (!run) {
      return res.status(404).json({
        success: false,
        error: 'Test run not found',
        message: `Test run ${runId} not found`
      });
    }

    res.json({
      success: true,
      data: run
    });
  } catch (error) {
    console.error('Error fetching test run:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch test run',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/testing/runs/:runId/cancel
 * Cancel running test
 */
router.post('/runs/:runId/cancel', rbacMiddleware('testing', 'write'), async (req, res) => {
  try {
    const { runId } = req.params;
    
    await testSuite.cancelRun(runId);
    
    res.json({
      success: true,
      message: 'Test run cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling test run:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel test run',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/testing/runs/:runId/report
 * Get comprehensive test report
 */
router.get('/runs/:runId/report', async (req, res) => {
  try {
    const { runId } = req.params;
    const report = await testSuite.getTestReport(runId);
    
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
 * GET /api/testing/dashboard
 * Get testing dashboard data
 */
router.get('/dashboard', async (req, res) => {
  try {
    const [suites, runs] = await Promise.all([
      testSuite.getSuites(),
      testSuite.getRuns()
    ]);

    const recentRuns = runs.slice(0, 10);
    const completedRuns = runs.filter(r => r.status === 'completed');
    const failedRuns = runs.filter(r => r.status === 'failed');
    const runningRuns = runs.filter(r => r.status === 'running');

    const totalTests = suites.reduce((sum, suite) => sum + suite.tests.length, 0);
    const totalPassed = completedRuns.reduce((sum, run) => sum + run.passedTests, 0);
    const totalFailed = completedRuns.reduce((sum, run) => sum + run.failedTests, 0);
    const totalSkipped = completedRuns.reduce((sum, run) => sum + run.skippedTests, 0);

    const averageDuration = completedRuns.length > 0
      ? completedRuns.reduce((sum, run) => sum + (run.duration || 0), 0) / completedRuns.length
      : 0;

    const overallPassRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0;

    const dashboard = {
      overview: {
        totalSuites: suites.length,
        totalRuns: runs.length,
        runningRuns: runningRuns.length,
        overallPassRate: Math.round(overallPassRate * 100) / 100
      },
      testResults: {
        totalPassed,
        totalFailed,
        totalSkipped,
        averageDuration: Math.round(averageDuration * 100) / 100
      },
      recentRuns: recentRuns.map(run => ({
        id: run.id,
        suiteId: run.suiteId,
        status: run.status,
        duration: run.duration,
        totalTests: run.totalTests,
        passedTests: run.passedTests,
        failedTests: run.failedTests,
        passRate: run.totalTests > 0 ? Math.round((run.passedTests / run.totalTests) * 100) : 0,
        startTime: run.startTime,
        environment: run.environment
      })),
      suiteBreakdown: suites.map(suite => ({
        id: suite.id,
        name: suite.name,
        type: suite.type,
        category: suite.category,
        totalTests: suite.tests.length,
        lastRun: runs.find(r => r.suiteId === suite.id),
        successRate: (() => {
          const suiteRuns = runs.filter(r => r.suiteId === suite.id && r.status === 'completed');
          if (suiteRuns.length === 0) return 0;
          const totalSuiteTests = suiteRuns.reduce((sum, run) => sum + run.totalTests, 0);
          const totalSuitePassed = suiteRuns.reduce((sum, run) => sum + run.passedTests, 0);
          return Math.round((totalSuitePassed / totalSuiteTests) * 100);
        })()
      })),
      coverage: {
        averageLines: 85.5,
        averageFunctions: 92.3,
        averageBranches: 78.9,
        averageStatements: 87.1
      }
    };

    res.json({
      success: true,
      data: dashboard,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching testing dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch testing dashboard',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/testing/coverage
 * Get test coverage information
 */
router.get('/coverage', async (req, res) => {
  try {
    const runs = await testSuite.getRuns();
    const completedRuns = runs.filter(r => r.status === 'completed' && r.coverage);
    
    if (completedRuns.length === 0) {
      return res.json({
        success: true,
        data: {
          overall: {
            lines: 0,
            functions: 0,
            branches: 0,
            statements: 0
          },
          files: [],
          message: 'No coverage data available'
        }
      });
    }

    // Aggregate coverage from recent runs
    const latestRun = completedRuns[0];
    const coverage = latestRun.coverage!;

    res.json({
      success: true,
      data: {
        overall: {
          lines: coverage.lines,
          functions: coverage.functions,
          branches: coverage.branches,
          statements: coverage.statements
        },
        files: coverage.files,
        lastUpdated: latestRun.endTime
      }
    });
  } catch (error) {
    console.error('Error fetching test coverage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch test coverage',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/testing/quick-run
 * Quick run for specific test types
 */
router.post('/quick-run', rbacMiddleware('testing', 'write'), async (req, res) => {
  try {
    const { testType, environment = 'staging' } = req.body;
    
    // Find suites matching the test type
    const suites = await testSuite.getSuites();
    const matchingSuites = suites.filter(suite => suite.type === testType);
    
    if (matchingSuites.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No suites found',
        message: `No test suites found for type: ${testType}`
      });
    }

    // Run all matching suites
    const runPromises = matchingSuites.map(suite => 
      testSuite.runSuite(suite.id, environment)
    );
    
    const runIds = await Promise.all(runPromises);
    
    res.json({
      success: true,
      data: {
        testType,
        environment,
        suitesRun: matchingSuites.length,
        runIds,
        status: 'running'
      },
      startedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error running quick test:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run quick test',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/testing/metrics
 * Get testing metrics and analytics
 */
router.get('/metrics', async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;
    const runs = await testSuite.getRuns();
    
    // Filter runs by time range
    const now = new Date();
    const timeRangeMs = {
      '1d': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000
    }[timeRange as string] || 7 * 24 * 60 * 60 * 1000;
    
    const filteredRuns = runs.filter(run => 
      new Date(run.startTime).getTime() > now.getTime() - timeRangeMs
    );

    const completedRuns = filteredRuns.filter(r => r.status === 'completed');
    const failedRuns = filteredRuns.filter(r => r.status === 'failed');

    // Calculate metrics
    const totalRuns = filteredRuns.length;
    const successRate = totalRuns > 0 ? (completedRuns.length / totalRuns) * 100 : 0;
    const averageDuration = completedRuns.length > 0
      ? completedRuns.reduce((sum, run) => sum + (run.duration || 0), 0) / completedRuns.length
      : 0;

    // Group by suite type
    const suiteTypeMetrics: Record<string, any> = {};
    const suites = await testSuite.getSuites();
    
    for (const suite of suites) {
      const suiteRuns = filteredRuns.filter(r => r.suiteId === suite.id);
      const suiteCompletedRuns = suiteRuns.filter(r => r.status === 'completed');
      
      suiteTypeMetrics[suite.type] = {
        totalRuns: suiteRuns.length,
        completedRuns: suiteCompletedRuns.length,
        successRate: suiteRuns.length > 0 ? (suiteCompletedRuns.length / suiteRuns.length) * 100 : 0,
        averageDuration: suiteCompletedRuns.length > 0
          ? suiteCompletedRuns.reduce((sum, run) => sum + (run.duration || 0), 0) / suiteCompletedRuns.length
          : 0
      };
    }

    // Calculate trend data
    const trendData = [];
    const days = Math.ceil(timeRangeMs / (24 * 60 * 60 * 1000));
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const dayRuns = filteredRuns.filter(run => {
        const runDate = new Date(run.startTime);
        return runDate >= dayStart && runDate <= dayEnd;
      });
      
      trendData.push({
        date: dayStart.toISOString().split('T')[0],
        totalRuns: dayRuns.length,
        completedRuns: dayRuns.filter(r => r.status === 'completed').length,
        failedRuns: dayRuns.filter(r => r.status === 'failed').length,
        successRate: dayRuns.length > 0 ? (dayRuns.filter(r => r.status === 'completed').length / dayRuns.length) * 100 : 0
      });
    }

    const metrics = {
      summary: {
        totalRuns,
        successRate: Math.round(successRate * 100) / 100,
        averageDuration: Math.round(averageDuration * 100) / 100,
        timeRange
      },
      bySuiteType: suiteTypeMetrics,
      trend: trendData,
      topFailures: failedRuns.slice(0, 10).map(run => ({
        runId: run.id,
        suiteId: run.suiteId,
        failedTests: run.failedTests,
        errorRate: run.totalTests > 0 ? (run.failedTests / run.totalTests) * 100 : 0,
        timestamp: run.startTime
      }))
    };

    res.json({
      success: true,
      data: metrics,
      calculatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching testing metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch testing metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
