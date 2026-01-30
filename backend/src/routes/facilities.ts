import { Router } from "express";
import { z } from "zod";
import { facilityController } from "../controllers/facilities.controller";
import { authenticateToken, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validate";

const router = Router();

// All facility routes require authentication
router.use(authenticateToken);

// Validation schemas
const createFacilitySchema = z.object({
  body: z.object({
    name: z.string().min(1),
    address: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(2).max(2),
    zipCode: z.string().min(5).max(10),
    phone: z.string().min(10),
    email: z.string().email(),
    type: z.enum(["HOSPITAL", "CLINIC", "LABORATORY", "IMAGING_CENTER"]),
  }),
});

const updateFacilitySchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    address: z.string().min(1).optional(),
    city: z.string().min(1).optional(),
    state: z.string().min(2).max(2).optional(),
    zipCode: z.string().min(5).max(10).optional(),
    phone: z.string().min(10).optional(),
    email: z.string().email().optional(),
    isActive: z.boolean().optional(),
  }),
});

// Routes
router.post(
  "/",
  requireRole(["ADMIN"]),
  validate(createFacilitySchema),
  facilityController.createFacility,
);
router.get("/", facilityController.getFacilities);
router.get("/:id", facilityController.getFacility);
router.patch(
  "/:id",
  requireRole(["ADMIN"]),
  validate(updateFacilitySchema),
  facilityController.updateFacility,
);
router.delete(
  "/:id",
  requireRole(["ADMIN"]),
  facilityController.deleteFacility,
);
router.get(
  "/:id/patients",
  requireRole(["PROVIDER", "ADMIN"]),
  facilityController.getFacilityPatients,
);

export { router as facilityRoutes };
