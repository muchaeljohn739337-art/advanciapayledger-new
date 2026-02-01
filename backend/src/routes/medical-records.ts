import { Router } from 'express';
import { prisma } from '../app';
import { authenticate, requireRole } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// List user's medical records
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;

    // Get patient record
    const patient = await prisma.patient.findFirst({ where: { userId } });

    if (!patient) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    const records = await prisma.medicalRecord.findMany({
      where: { patientId: patient.id },
      include: {
        provider: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(records);
  } catch (error) {
    logger.error('List medical records error:', error);
    res.status(500).json({ error: 'Failed to list medical records' });
  }
});

// Get specific medical record
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const record = await prisma.medicalRecord.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        provider: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    if (!record) {
      return res.status(404).json({ error: 'Medical record not found' });
    }

    // Verify access (patient or assigned provider)
    const isPatient = record.patient.userId === userId;
    const isProvider = record.provider?.userId === userId;

    if (!isPatient && !isProvider) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(record);
  } catch (error) {
    logger.error('Get medical record error:', error);
    res.status(500).json({ error: 'Failed to get medical record' });
  }
});

// Create medical record (provider only)
router.post('/', authenticate, requireRole(['PROVIDER', 'ADMIN']), async (req, res) => {
  try {
    const userId = req.user?.id;
    const { patientId, diagnosis, treatment, notes, medications } = req.body;

    // Get provider record
    const provider = await prisma.provider.findFirst({ where: { userId } });

    if (!provider && req.user?.role !== 'ADMIN') {
      return res.status(400).json({ error: 'Provider profile not found' });
    }

    // Verify provider has appointment with patient
    if (provider) {
      const hasAppointment = await prisma.appointment.findFirst({
        where: {
          patientId,
          providerId: provider.id
        }
      });

      if (!hasAppointment) {
        return res.status(403).json({ error: 'No appointment with this patient' });
      }
    }

    const record = await prisma.medicalRecord.create({
      data: {
        patientId,
        providerId: provider?.id,
        diagnosis,
        treatment,
        notes,
        medications
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        provider: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    // Log PHI access
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id!,
        action: 'CREATE',
        resource: 'medical_record',
        resourceId: record.id,
        details: 'Created medical record'
      }
    });

    res.status(201).json(record);
  } catch (error) {
    logger.error('Create medical record error:', error);
    res.status(500).json({ error: 'Failed to create medical record' });
  }
});

// Download medical record PDF
router.get('/:id/download', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const record = await prisma.medicalRecord.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        provider: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    if (!record) {
      return res.status(404).json({ error: 'Medical record not found' });
    }

    // Verify access
    const isPatient = record.patient.userId === userId;
    const isProvider = record.provider?.userId === userId;

    if (!isPatient && !isProvider) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Log PHI access
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id!,
        action: 'DOWNLOAD',
        resource: 'medical_record',
        resourceId: record.id,
        details: 'Downloaded medical record PDF'
      }
    });

    // TODO: Generate PDF (implement PDF generation service)
    res.json({ message: 'PDF generation not yet implemented', record });
  } catch (error) {
    logger.error('Download medical record error:', error);
    res.status(500).json({ error: 'Failed to download medical record' });
  }
});

export default router;
