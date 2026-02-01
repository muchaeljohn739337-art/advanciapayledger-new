import { Router } from 'express';
import { prisma } from '../app';
import { authenticate, requireRole } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// List all providers (public - for booking)
router.get('/', async (req, res) => {
  try {
    const { specialization, facilityId } = req.query;

    const providers = await prisma.provider.findMany({
      where: {
        ...(specialization && { specialization: specialization as string }),
        ...(facilityId && { facilityId: facilityId as string })
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        facility: true
      }
    });

    res.json(providers);
  } catch (error) {
    logger.error('List providers error:', error);
    res.status(500).json({ error: 'Failed to list providers' });
  }
});

// Get provider profile
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const provider = await prisma.provider.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        facility: true
      }
    });

    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    res.json(provider);
  } catch (error) {
    logger.error('Get provider error:', error);
    res.status(500).json({ error: 'Failed to get provider' });
  }
});

// Update provider profile (provider only)
router.put('/:id', authenticate, requireRole(['PROVIDER', 'ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const updateData = req.body;

    // Verify user owns this provider record (unless admin)
    if (req.user?.role !== 'ADMIN') {
      const provider = await prisma.provider.findFirst({
        where: { id, userId }
      });

      if (!provider) {
        return res.status(404).json({ error: 'Provider not found or access denied' });
      }
    }

    const updated = await prisma.provider.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        facility: true
      }
    });

    res.json(updated);
  } catch (error) {
    logger.error('Update provider error:', error);
    res.status(500).json({ error: 'Failed to update provider' });
  }
});

// Get provider's appointments
router.get('/:id/appointments', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Verify user is the provider
    const provider = await prisma.provider.findFirst({
      where: { id, userId }
    });

    if (!provider && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const appointments = await prisma.appointment.findMany({
      where: { providerId: id },
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        facility: true
      },
      orderBy: { appointmentDate: 'desc' }
    });

    res.json(appointments);
  } catch (error) {
    logger.error('Get provider appointments error:', error);
    res.status(500).json({ error: 'Failed to get appointments' });
  }
});

// Get provider's patients
router.get('/:id/patients', authenticate, requireRole(['PROVIDER', 'ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Verify user is the provider
    if (req.user?.role !== 'ADMIN') {
      const provider = await prisma.provider.findFirst({
        where: { id, userId }
      });

      if (!provider) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Get unique patients from appointments
    const appointments = await prisma.appointment.findMany({
      where: { providerId: id },
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      },
      distinct: ['patientId']
    });

    const patients = appointments.map(apt => apt.patient);

    res.json(patients);
  } catch (error) {
    logger.error('Get provider patients error:', error);
    res.status(500).json({ error: 'Failed to get patients' });
  }
});

export default router;
