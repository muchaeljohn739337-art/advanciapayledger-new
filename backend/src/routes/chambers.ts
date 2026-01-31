import { Router } from 'express';
import { z } from 'zod';
import { chamberService } from '../services/chamberService';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const updateStatusSchema = z.object({
  status: z.enum(['available', 'occupied', 'maintenance', 'cleaning', 'reserved', 'disabled']),
});

const availabilityQuerySchema = z.object({
  facilityId: z.string().uuid(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  type: z.string().optional(),
  floor: z.string().optional(),
  equipment: z.string().optional(),
});

const maintenanceSchema = z.object({
  chamberId: z.string().uuid(),
  type: z.enum(['cleaning', 'repair', 'inspection']),
  scheduledAt: z.string().datetime(),
  notes: z.string().optional(),
  assignedTo: z.string().uuid().optional(),
});

// GET /api/chambers - List all chambers
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { facilityId, status, floor, type } = req.query;

    const filters: any = {};
    if (facilityId) filters.facilityId = facilityId as string;
    if (status) filters.status = status as string;
    if (floor) filters.floor = parseInt(floor as string);
    if (type) filters.type = type as string;

    const chambers = await chamberService.getAllChambers(filters);

    res.json({
      success: true,
      count: chambers.length,
      chambers,
    });
  } catch (error) {
    logger.error('Error fetching chambers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chambers',
    });
  }
});

// GET /api/chambers/:id - Get chamber details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const chamber = await chamberService.getChamberById(id);

    if (!chamber) {
      return res.status(404).json({
        success: false,
        error: 'Chamber not found',
      });
    }

    res.json({
      success: true,
      chamber,
    });
  } catch (error) {
    logger.error('Error fetching chamber:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chamber',
    });
  }
});

// PUT /api/chambers/:id/status - Update chamber status
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const validation = updateStatusSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        details: validation.error.errors,
      });
    }

    const { status } = validation.data;
    const chamber = await chamberService.updateChamberStatus(id, status);

    res.json({
      success: true,
      message: 'Chamber status updated',
      chamber,
    });
  } catch (error) {
    logger.error('Error updating chamber status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update chamber status',
    });
  }
});

// GET /api/chambers/availability - Check availability
router.get('/check/availability', authenticateToken, async (req, res) => {
  try {
    const validation = availabilityQuerySchema.safeParse(req.query);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: validation.error.errors,
      });
    }

    const { facilityId, startTime, endTime, type, floor, equipment } = validation.data;

    const filters: any = {};
    if (type) filters.type = type;
    if (floor) filters.floor = parseInt(floor);
    if (equipment) filters.equipment = equipment.split(',');

    const availableChambers = await chamberService.getAvailableChambers(
      facilityId,
      new Date(startTime),
      new Date(endTime),
      filters
    );

    res.json({
      success: true,
      count: availableChambers.length,
      chambers: availableChambers,
    });
  } catch (error) {
    logger.error('Error checking availability:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check availability',
    });
  }
});

// GET /api/chambers/:id/utilization - Get chamber utilization
router.get('/:id/utilization', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    const utilizationDate = date ? new Date(date as string) : new Date();
    const utilization = await chamberService.getChamberUtilization(id, utilizationDate);

    res.json({
      success: true,
      utilization,
    });
  } catch (error) {
    logger.error('Error fetching utilization:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch utilization',
    });
  }
});

// POST /api/chambers/maintenance - Schedule maintenance
router.post('/maintenance', authenticateToken, async (req, res) => {
  try {
    const validation = maintenanceSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid maintenance data',
        details: validation.error.errors,
      });
    }

    const { chamberId, type, scheduledAt, notes, assignedTo } = validation.data;

    const maintenance = await chamberService.scheduleMaintenance({
      chamberId,
      type,
      scheduledAt: new Date(scheduledAt),
      notes,
      assignedTo,
    });

    res.status(201).json({
      success: true,
      message: 'Maintenance scheduled',
      maintenance,
    });
  } catch (error) {
    logger.error('Error scheduling maintenance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to schedule maintenance',
    });
  }
});

// PUT /api/chambers/maintenance/:id/complete - Complete maintenance
router.put('/maintenance/:id/complete', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const maintenance = await chamberService.completeMaintenance(id);

    res.json({
      success: true,
      message: 'Maintenance completed',
      maintenance,
    });
  } catch (error) {
    logger.error('Error completing maintenance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete maintenance',
    });
  }
});

export default router;
