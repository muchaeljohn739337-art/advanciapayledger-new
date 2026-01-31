import { Router } from 'express';
import { z } from 'zod';
import { bookingService } from '../services/bookingService';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const createBookingSchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  facilityId: z.string().uuid(),
  bookingDate: z.string().datetime(),
  startTime: z.string().datetime(),
  duration: z.number().min(15).max(480),
  serviceType: z.string(),
  notes: z.string().optional(),
  chamberId: z.string().uuid().optional(),
  equipmentNeeded: z.array(z.string()).optional(),
  patientMobility: z.enum(['high', 'medium', 'low']).optional(),
});

const updateBookingSchema = z.object({
  startTime: z.string().datetime().optional(),
  duration: z.number().min(15).max(480).optional(),
  chamberId: z.string().uuid().optional(),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).optional(),
  notes: z.string().optional(),
  paymentStatus: z.enum(['pending', 'paid', 'partial', 'refunded']).optional(),
});

// GET /api/bookings - List all bookings
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { facilityId, patientId, doctorId, chamberId, status, startDate, endDate } = req.query;

    const filters: any = {};
    if (facilityId) filters.facilityId = facilityId as string;
    if (patientId) filters.patientId = patientId as string;
    if (doctorId) filters.doctorId = doctorId as string;
    if (chamberId) filters.chamberId = chamberId as string;
    if (status) filters.status = status as string;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const bookings = await bookingService.getBookings(filters);

    res.json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    logger.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bookings',
    });
  }
});

// POST /api/bookings - Create new booking
router.post('/', authenticateToken, async (req, res) => {
  try {
    const validation = createBookingSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid booking data',
        details: validation.error.errors,
      });
    }

    const data = validation.data;
    const booking = await bookingService.createBooking({
      ...data,
      bookingDate: new Date(data.bookingDate),
      startTime: new Date(data.startTime),
      createdBy: req.user!.id,
    });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking,
    });
  } catch (error: any) {
    logger.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create booking',
    });
  }
});

// GET /api/bookings/:id - Get booking details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await bookingService.getBookingById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    res.json({
      success: true,
      booking,
    });
  } catch (error) {
    logger.error('Error fetching booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking',
    });
  }
});

// PUT /api/bookings/:id - Update booking
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const validation = updateBookingSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid update data',
        details: validation.error.errors,
      });
    }

    const data = validation.data;
    const updateData: any = { ...data };

    if (data.startTime) {
      updateData.startTime = new Date(data.startTime);
    }

    const booking = await bookingService.updateBooking(id, updateData);

    res.json({
      success: true,
      message: 'Booking updated successfully',
      booking,
    });
  } catch (error: any) {
    logger.error('Error updating booking:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update booking',
    });
  }
});

// DELETE /api/bookings/:id - Cancel booking
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await bookingService.cancelBooking(id, reason);

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking,
    });
  } catch (error) {
    logger.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel booking',
    });
  }
});

// POST /api/bookings/:id/confirm - Confirm booking
router.post('/:id/confirm', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await bookingService.confirmBooking(id);

    res.json({
      success: true,
      message: 'Booking confirmed successfully',
      booking,
    });
  } catch (error) {
    logger.error('Error confirming booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to confirm booking',
    });
  }
});

// POST /api/bookings/:id/complete - Complete booking
router.post('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await bookingService.completeBooking(id);

    res.json({
      success: true,
      message: 'Booking completed successfully',
      booking,
    });
  } catch (error) {
    logger.error('Error completing booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete booking',
    });
  }
});

// GET /api/bookings/check/conflicts - Check for conflicts
router.get('/check/conflicts', authenticateToken, async (req, res) => {
  try {
    const { doctorId, startTime, endTime, excludeBookingId } = req.query;

    if (!doctorId || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        error: 'doctorId, startTime, and endTime are required',
      });
    }

    const conflicts = await bookingService.checkConflicts(
      doctorId as string,
      new Date(startTime as string),
      new Date(endTime as string),
      excludeBookingId as string | undefined
    );

    res.json({
      success: true,
      hasConflicts: conflicts.length > 0,
      count: conflicts.length,
      conflicts,
    });
  } catch (error) {
    logger.error('Error checking conflicts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check conflicts',
    });
  }
});

export default router;
