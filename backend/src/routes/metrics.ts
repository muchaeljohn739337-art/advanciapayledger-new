import { Router } from 'express';
import { register } from '../services/metrics';

const router = Router();

router.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
});

router.get('/health/metrics', async (req, res) => {
  try {
    const metrics = await register.getMetricsAsJSON();
    res.json({
      success: true,
      data: {
        metricsCount: metrics.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch metrics' });
  }
});

export default router;
