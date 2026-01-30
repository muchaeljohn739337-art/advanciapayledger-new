import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { logger } from "../utils/logger";

export const createFacility = async (req: Request, res: Response) => {
  try {
    const { name, type, address, phone, email } = req.body;

    const facility = await prisma.facility.create({
      data: {
        name,
        type,
        address,
        phone,
        email,
      },
    });

    logger.info(`Facility created: ${facility.id}`);
    res.status(201).json(facility);
  } catch (error) {
    logger.error("Error creating facility:", error);
    res.status(500).json({ error: "Failed to create facility" });
  }
};

export const getFacilities = async (req: Request, res: Response) => {
  try {
    const facilities = await prisma.facility.findMany({
      include: {
        providers: true,
        patients: true,
      },
    });

    res.json(facilities);
  } catch (error) {
    logger.error("Error fetching facilities:", error);
    res.status(500).json({ error: "Failed to fetch facilities" });
  }
};

export const updateFacility = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, type, address, phone, email } = req.body;

    const facility = await prisma.facility.update({
      where: { id },
      data: {
        name,
        type,
        address,
        phone,
        email,
      },
    });

    logger.info(`Facility updated: ${facility.id}`);
    res.json(facility);
  } catch (error) {
    logger.error("Error updating facility:", error);
    res.status(500).json({ error: "Failed to update facility" });
  }
};

export const deleteFacility = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.facility.delete({
      where: { id },
    });

    logger.info(`Facility deleted: ${id}`);
    res.status(204).send();
  } catch (error) {
    logger.error("Error deleting facility:", error);
    res.status(500).json({ error: "Failed to delete facility" });
  }
};

export const getFacilityPatients = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const patients = await prisma.patient.findMany({
      where: { facilityId: id },
      include: {
        payments: true,
      },
    });

    res.json(patients);
  } catch (error) {
    logger.error("Error fetching facility patients:", error);
    res.status(500).json({ error: "Failed to fetch facility patients" });
  }
};

export const getFacility = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const facility = await prisma.facility.findUnique({
      where: { id },
      include: {
        providers: true,
        patients: true,
      },
    });

    if (!facility) {
      return res.status(404).json({ error: "Facility not found" });
    }

    res.json(facility);
  } catch (error) {
    logger.error("Error fetching facility:", error);
    res.status(500).json({ error: "Failed to fetch facility" });
  }
};

// Export controller object for consistency
export const facilityController = {
  createFacility,
  getFacilities,
  getFacility,
  updateFacility,
  deleteFacility,
  getFacilityPatients,
};
