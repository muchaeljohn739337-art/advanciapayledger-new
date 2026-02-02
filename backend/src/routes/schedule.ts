import { Router } from 'express';
import { bookingService } from '../services/bookingService';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/schedule/daily - Get daily schedule
router.get('/daily', authenticateToken, async (req, res) => {
  try {
    const { facilityId, date } = req.query;

    if (!facilityId) {
      return res.status(400).json({
        success: false,
        error: 'facilityId is required',
      });
    }

    const scheduleDate = date ? new Date(date as string) : new Date();
    const bookings = await bookingService.getDailySchedule(
      req.user!,
      facilityId as string,
      scheduleDate,
    );

    res.json({
      success: true,
      date: scheduleDate,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    logger.error('Error fetching daily schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch daily schedule',
    });
  }
});

// GET /api/schedule/weekly - Get weekly schedule
router.get('/weekly', authenticateToken, async (req, res) => {
  try {
    const { facilityId, startDate } = req.query;

    if (!facilityId) {
      return res.status(400).json({
        success: false,
        error: 'facilityId is required',
      });
    }

    const weekStart = startDate ? new Date(startDate as string) : new Date();
    const bookings = await bookingService.getWeeklySchedule(
      req.user!,
      facilityId as string,
      weekStart,
    );

    res.json({
      success: true,
      startDate: weekStart,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    logger.error('Error fetching weekly schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch weekly schedule',
    });
  }
});

// GET /api/schedule/doctor/:id - Get doctor's schedule
router.get('/doctor/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required',
      });
    }

    const bookings = await bookingService.getDoctorSchedule(
      req.user!,
      id,
      new Date(startDate as string),
      new Date(endDate as string),
    );

    res.json({
      success: true,
      doctorId: id,
      startDate,
      endDate,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    logger.error('Error fetching doctor schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch doctor schedule',
    });
  }
});

// GET /api/schedule/chamber/:id - Get chamber schedule
router.get('/chamber/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required',
      });
    }

    const bookings = await bookingService.getChamberSchedule(
      req.user!,
      id,
      new Date(startDate as string),
      new Date(endDate as string),
    );

    res.json({
      success: true,
      chamberId: id,
      startDate,
      endDate,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    logger.error('Error fetching chamber schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chamber schedule',
    });
  }
});

export default router;
