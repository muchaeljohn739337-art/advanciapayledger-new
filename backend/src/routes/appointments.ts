import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth";
import { logger } from "../utils/logger";

const router = Router();

// List user's appointments
router.get("/", authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { status } = req.query;

    // Get user's patient or provider record
    const patient = await prisma.patient.findFirst({ where: { userId } });
    const provider = await prisma.provider.findFirst({ where: { userId } });

    const appointments = await prisma.appointment.findMany({
      where: {
        OR: [
          ...(patient ? [{ patientId: patient.id }] : []),
          ...(provider ? [{ providerId: provider.id }] : []),
        ],
        ...(status && { status: status as string }),
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
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
        chamber: true,
      },
      orderBy: { appointmentDate: "desc" },
    });

    res.json(appointments);
  } catch (error) {
    logger.error("List appointments error:", error);
    res.status(500).json({ error: "Failed to list appointments" });
  }
});

// Create appointment
router.post("/", authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { providerId, facilityId, chamberId, appointmentDate, reason } =
      req.body;

    // Get patient record
    const patient = await prisma.patient.findFirst({ where: { userId } });

    if (!patient) {
      return res.status(400).json({ error: "Patient profile not found" });
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        providerId,
        facilityId,
        chamberId,
        appointmentDate: new Date(appointmentDate),
        reason,
        status: "pending",
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
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
    });

    res.status(201).json(appointment);
  } catch (error) {
    logger.error("Create appointment error:", error);
    res.status(500).json({ error: "Failed to create appointment" });
  }
});

// Get appointment details
router.get("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
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
        chamber: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // Verify access
    if (
      appointment.patient.userId !== userId &&
      appointment.provider.userId !== userId
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(appointment);
  } catch (error) {
    logger.error("Get appointment error:", error);
    res.status(500).json({ error: "Failed to get appointment" });
  }
});

// Update appointment
router.put("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const updateData = req.body;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
        provider: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // Verify access
    if (
      appointment.patient.userId !== userId &&
      appointment.provider.userId !== userId
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
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
    });

    res.json(updated);
  } catch (error) {
    logger.error("Update appointment error:", error);
    res.status(500).json({ error: "Failed to update appointment" });
  }
});

// Cancel appointment
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // Only patient can cancel
    if (appointment.patient.userId !== userId) {
      return res
        .status(403)
        .json({ error: "Only patient can cancel appointment" });
    }

    await prisma.appointment.update({
      where: { id },
      data: { status: "cancelled" },
    });

    res.json({ message: "Appointment cancelled successfully" });
  } catch (error) {
    logger.error("Cancel appointment error:", error);
    res.status(500).json({ error: "Failed to cancel appointment" });
  }
});

// Confirm appointment (provider only)
router.put("/:id/confirm", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        provider: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // Only provider can confirm
    if (appointment.provider.userId !== userId) {
      return res
        .status(403)
        .json({ error: "Only provider can confirm appointment" });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status: "confirmed" },
    });

    res.json(updated);
  } catch (error) {
    logger.error("Confirm appointment error:", error);
    res.status(500).json({ error: "Failed to confirm appointment" });
  }
});

// Complete appointment (provider only)
router.put("/:id/complete", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        provider: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // Only provider can complete
    if (appointment.provider.userId !== userId) {
      return res
        .status(403)
        .json({ error: "Only provider can complete appointment" });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status: "completed" },
    });

    res.json(updated);
  } catch (error) {
    logger.error("Complete appointment error:", error);
    res.status(500).json({ error: "Failed to complete appointment" });
  }
});

export default router;
