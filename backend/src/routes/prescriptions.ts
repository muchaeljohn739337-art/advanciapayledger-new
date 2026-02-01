import { Router } from 'express';
import { prisma } from '../app';
import { authenticate, requireRole } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// List user's prescriptions
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;

    // Get patient record
    const patient = await prisma.patient.findFirst({ where: { userId } });

    if (!patient) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    const prescriptions = await prisma.prescription.findMany({
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

    res.json(prescriptions);
  } catch (error) {
    logger.error('List prescriptions error:', error);
    res.status(500).json({ error: 'Failed to list prescriptions' });
  }
});

// Get specific prescription
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const prescription = await prisma.prescription.findUnique({
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

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    // Verify access (patient or prescribing provider)
    const isPatient = prescription.patient.userId === userId;
    const isProvider = prescription.provider.userId === userId;

    if (!isPatient && !isProvider) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(prescription);
  } catch (error) {
    logger.error('Get prescription error:', error);
    res.status(500).json({ error: 'Failed to get prescription' });
  }
});

// Create prescription (provider only)
router.post('/', authenticate, requireRole(['PROVIDER', 'ADMIN']), async (req, res) => {
  try {
    const userId = req.user?.id;
    const { 
      patientId, 
      medication, 
      dosage, 
      frequency, 
      duration, 
      instructions,
      refills 
    } = req.body;

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

    const prescription = await prisma.prescription.create({
      data: {
        patientId,
        providerId: provider?.id!,
        medication,
        dosage,
        frequency,
        duration,
        instructions,
        refills: refills || 0,
        status: 'active'
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
        resource: 'prescription',
        resourceId: prescription.id,
        details: `Prescribed ${medication} to patient`
      }
    });

    res.status(201).json(prescription);
  } catch (error) {
    logger.error('Create prescription error:', error);
    res.status(500).json({ error: 'Failed to create prescription' });
  }
});

// Download prescription PDF
router.get('/:id/download', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const prescription = await prisma.prescription.findUnique({
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

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    // Verify access
    const isPatient = prescription.patient.userId === userId;
    const isProvider = prescription.provider.userId === userId;

    if (!isPatient && !isProvider) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Log PHI access
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id!,
        action: 'DOWNLOAD',
        resource: 'prescription',
        resourceId: prescription.id,
        details: 'Downloaded prescription PDF'
      }
    });

    // TODO: Generate PDF (implement PDF generation service)
    res.json({ message: 'PDF generation not yet implemented', prescription });
  } catch (error) {
    logger.error('Download prescription error:', error);
    res.status(500).json({ error: 'Failed to download prescription' });
  }
});

export default router;
