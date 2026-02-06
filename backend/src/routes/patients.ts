import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, requireRole } from "../middleware/auth";
import { logger } from "../utils/logger";

const router = Router();

// Get patient profile
router.get("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Check if user is the patient or an assigned provider
    const patient = await prisma.patient.findFirst({
      where: {
        id,
        OR: [
          { userId }, // User is the patient
          {
            // User is an assigned provider
            user: {
              providers: {
                some: {
                  appointments: {
                    some: {
                      patientId: id,
                    },
                  },
                },
              },
            },
          },
        ],
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!patient) {
      return res
        .status(404)
        .json({ error: "Patient not found or access denied" });
    }

    res.json(patient);
  } catch (error) {
    logger.error("Get patient error:", error);
    res.status(500).json({ error: "Failed to get patient" });
  }
});

// Update patient profile
router.put("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const updateData = req.body;

    // Verify user owns this patient record
    const patient = await prisma.patient.findFirst({
      where: { id, userId },
    });

    if (!patient) {
      return res
        .status(404)
        .json({ error: "Patient not found or access denied" });
    }

    const updated = await prisma.patient.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.json(updated);
  } catch (error) {
    logger.error("Update patient error:", error);
    res.status(500).json({ error: "Failed to update patient" });
  }
});

// Get patient's medical records
router.get("/:id/medical-records", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Verify access (patient or assigned provider)
    const hasAccess = await prisma.patient.findFirst({
      where: {
        id,
        OR: [
          { userId },
          {
            user: {
              providers: {
                some: {
                  appointments: {
                    some: {
                      patientId: id,
                    },
                  },
                },
              },
            },
          },
        ],
      },
    });

    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    const records = await prisma.medicalRecord.findMany({
      where: { patientId: id },
      orderBy: { createdAt: "desc" },
    });

    res.json(records);
  } catch (error) {
    logger.error("Get medical records error:", error);
    res.status(500).json({ error: "Failed to get medical records" });
  }
});

// Get patient's appointments
router.get("/:id/appointments", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Verify access
    const patient = await prisma.patient.findFirst({
      where: { id, userId },
    });

    if (!patient) {
      return res.status(403).json({ error: "Access denied" });
    }

    const appointments = await prisma.appointment.findMany({
      where: { patientId: id },
      include: {
        provider: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        facility: true,
      },
      orderBy: { appointmentDate: "desc" },
    });

    res.json(appointments);
  } catch (error) {
    logger.error("Get appointments error:", error);
    res.status(500).json({ error: "Failed to get appointments" });
  }
});

// Get patient's prescriptions
router.get("/:id/prescriptions", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Verify access
    const hasAccess = await prisma.patient.findFirst({
      where: {
        id,
        OR: [
          { userId },
          {
            user: {
              providers: {
                some: {
                  appointments: {
                    some: {
                      patientId: id,
                    },
                  },
                },
              },
            },
          },
        ],
      },
    });

    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    const prescriptions = await prisma.prescription.findMany({
      where: { patientId: id },
      include: {
        provider: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(prescriptions);
  } catch (error) {
    logger.error("Get prescriptions error:", error);
    res.status(500).json({ error: "Failed to get prescriptions" });
  }
});

export default router;
