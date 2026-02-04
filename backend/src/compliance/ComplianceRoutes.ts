import express from 'express';
import { complianceEngine } from './ComplianceEngine';
import { authMiddleware } from '../middleware/auth';
import { rbacMiddleware } from '../middleware/rbac';

const router = express.Router();

// Apply authentication and RBAC to all compliance routes
router.use(authMiddleware);
router.use(rbacMiddleware('compliance', 'read'));

/**
 * GET /api/compliance/controls
 * Get all compliance controls
 */
router.get('/controls', async (req, res) => {
  try {
    const { category, status } = req.query;
    
    let controls = Array.from((complianceEngine as any).controls.values());
    
    if (category) {
      controls = controls.filter((control: any) => control.category === category);
    }
    
    if (status) {
      controls = controls.filter((control: any) => control.status === status);
    }

    res.json({
      success: true,
      data: controls,
      total: controls.length
    });
  } catch (error) {
    console.error('Error fetching compliance controls:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch compliance controls',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/compliance/controls/check
 * Run compliance assessment
 */
router.post('/controls/check', async (req, res) => {
  try {
    const { controlId } = req.body;
    
    const results = await complianceEngine.runComplianceCheck(controlId);
    
    res.json({
      success: true,
      data: results,
      assessedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error running compliance check:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run compliance check',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/compliance/report
 * Generate comprehensive compliance report
 */
router.get('/report', async (req, res) => {
  try {
    const report = await complianceEngine.generateComplianceReport();
    
    res.json({
      success: true,
      data: report,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating compliance report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate compliance report',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/compliance/metrics
 * Get compliance metrics and scores
 */
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await complianceEngine.getComplianceMetrics();
    
    res.json({
      success: true,
      data: metrics,
      calculatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching compliance metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch compliance metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/compliance/audit/schedule
 * Schedule a compliance audit
 */
router.post('/audit/schedule', rbacMiddleware('compliance', 'write'), async (req, res) => {
  try {
    const { type, auditor } = req.body;
    
    if (!type || !auditor) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['type', 'auditor']
      });
    }

    const audit = await complianceEngine.scheduleComplianceAudit(type, auditor);
    
    res.json({
      success: true,
      data: audit,
      scheduledAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error scheduling compliance audit:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to schedule compliance audit',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/compliance/dashboard
 * Get compliance dashboard data
 */
router.get('/dashboard', async (req, res) => {
  try {
    const [report, metrics] = await Promise.all([
      complianceEngine.generateComplianceReport(),
      complianceEngine.getComplianceMetrics()
    ]);

    const dashboard = {
      overview: {
        overallStatus: report.overallStatus,
        complianceScore: metrics.score,
        totalControls: report.summary.total,
        compliantControls: report.summary.compliant,
        criticalIssues: report.controls.filter((c: any) => 
          c.status !== 'COMPLIANT' && c.riskLevel === 'CRITICAL'
        ).length
      },
      byCategory: Object.entries(metrics.byCategory).map(([category, score]) => ({
        category,
        score,
        status: score === 100 ? 'COMPLIANT' : score >= 80 ? 'PARTIAL' : 'NON_COMPLIANT'
      })),
      recentAssessments: report.controls
        .sort((a: any, b: any) => new Date(b.lastAssessed).getTime() - new Date(a.lastAssessed).getTime())
        .slice(0, 10),
      upcomingAudits: report.controls
        .filter((control: any) => new Date(control.nextAssessed) > new Date())
        .sort((a: any, b: any) => new Date(a.nextAssessed).getTime() - new Date(b.nextAssessed).getTime())
        .slice(0, 5),
      recommendations: report.recommendations.slice(0, 5)
    };

    res.json({
      success: true,
      data: dashboard,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching compliance dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch compliance dashboard',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/compliance/policies
 * Get compliance policies and procedures
 */
router.get('/policies', async (req, res) => {
  try {
    const policies = {
      accessControl: {
        title: 'Access Control Policy',
        description: 'Logical and physical access controls for systems and data',
        version: '2.1',
        lastUpdated: '2024-01-15',
        requirements: [
          'MFA required for all admin accounts',
          'RBAC implemented for all systems',
          'Regular access reviews quarterly',
          'Least privilege principle enforced'
        ]
      },
      dataProtection: {
        title: 'Data Protection Policy',
        description: 'Encryption and protection of sensitive data',
        version: '2.0',
        lastUpdated: '2024-01-10',
        requirements: [
          'AES-256 encryption at rest',
          'TLS 1.3 encryption in transit',
          'Data classification implemented',
          'Regular encryption key rotation'
        ]
      },
      auditLogging: {
        title: 'Audit Logging Policy',
        description: 'Comprehensive logging and monitoring',
        version: '1.8',
        lastUpdated: '2024-01-05',
        requirements: [
          'All system actions logged',
          'Log retention for 1 year minimum',
          'Log integrity verification',
          'Real-time monitoring and alerting'
        ]
      },
      incidentResponse: {
        title: 'Incident Response Policy',
        description: 'Security incident response procedures',
        version: '3.0',
        lastUpdated: '2024-01-20',
        requirements: [
          '24/7 incident response team',
          'Incident classification system',
          'Regular incident response drills',
          'Post-incident analysis required'
        ]
      }
    };

    res.json({
      success: true,
      data: policies,
      retrievedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching compliance policies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch compliance policies',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/compliance/evidence
 * Get compliance evidence documentation
 */
router.get('/evidence', async (req, res) => {
  try {
    const { controlId, category } = req.query;
    
    // This would typically fetch actual evidence from storage
    const evidence = {
      soc2: {
        'SOC2-A1': [
          {
            id: 'ev-001',
            type: 'configuration',
            title: 'MFA Configuration',
            description: 'Screenshot of MFA configuration for admin accounts',
            date: '2024-01-15',
            verified: true
          },
          {
            id: 'ev-002',
            type: 'documentation',
            title: 'RBAC Documentation',
            description: 'Role-based access control implementation documentation',
            date: '2024-01-10',
            verified: true
          }
        ],
        'SOC2-A2': [
          {
            id: 'ev-003',
            type: 'configuration',
            title: 'Encryption Configuration',
            description: 'Database and application encryption settings',
            date: '2024-01-12',
            verified: true
          }
        ]
      },
      hipaa: {
        'HIPAA-A1': [
          {
            id: 'ev-004',
            type: 'configuration',
            title: 'PHI Encryption',
            description: 'PHI encryption implementation evidence',
            date: '2024-01-08',
            verified: true
          }
        ]
      }
    };

    let filteredEvidence = evidence;
    
    if (category) {
      filteredEvidence = { [category as string]: evidence[category as string] || {} };
    }
    
    if (controlId) {
      filteredEvidence = {};
      Object.keys(evidence).forEach(cat => {
        if (evidence[cat as keyof typeof evidence][controlId as string]) {
          filteredEvidence[cat] = {
            [controlId]: evidence[cat as keyof typeof evidence][controlId as string]
          };
        }
      });
    }

    res.json({
      success: true,
      data: filteredEvidence,
      retrievedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching compliance evidence:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch compliance evidence',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
