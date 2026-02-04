import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "patient-link-service" });
});

// POST /health/v1/patients/link - Create or resolve a patient
app.post("/health/v1/patients/link", async (req, res) => {
  const { tenant_id, first_name, last_name, dob, gender } = req.body;

  // TODO:
  // 1. Query Aurora health_patients for existing match
  // 2. If not found, INSERT new patient
  // 3. Generate patient_ref_id (opaque ID for non-PHI systems)
  // 4. Return both patient_id (internal) and patient_ref_id (external)

  const patient_id = "internal-patient-uuid";
  const patient_ref_id = "opaque-patient-ref-abc123";

  res.status(201).json({ patient_ref_id, patient_id });
});

// GET /health/v1/patients/:patient_id - Retrieve patient details (PHI)
app.get("/health/v1/patients/:patient_id", async (req, res) => {
  const { patient_id } = req.params;

  // TODO: Query Aurora health.patients WHERE id = $1
  res.json({
    patient_id,
    patient_ref_id: "opaque-ref",
    first_name: "John",
    last_name: "Doe",
    dob: "1980-01-01",
    gender: "M",
    created_at: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`patient-link-service listening on port ${PORT}`);
});
