import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "health-billing-service" });
});

// GET /health/v1/claims/:claim_id - Retrieve full PHI claim details
app.get("/health/v1/claims/:claim_id", async (req, res) => {
  const { claim_id } = req.params;
  // TODO: Query Aurora health_claims table
  // SELECT * FROM health.claims WHERE id = $1
  res.json({
    claim_id,
    claim_ref_id: "opaque-ref-123",
    patient_id: "patient-uuid",
    payer_code: "BCBS",
    service_date: "2026-02-01",
    diagnosis_codes: ["A01.1"],
    procedure_codes: ["99213"],
    amount_billed: 15000,
    amount_allowed: 12000,
    amount_patient_responsibility: 3000,
    status: "submitted",
  });
});

// POST /health/v1/claims/:intake_id/finalize - Convert intake to canonical claim
app.post("/health/v1/claims/:intake_id/finalize", async (req, res) => {
  const { intake_id } = req.params;
  const { validated_payload, status } = req.body;

  // TODO:
  // 1. Insert into health.claims
  // 2. Emit event to health-events-bus via EventBridge
  // 3. Update health_claims_intake status

  const claim_id = "new-claim-uuid";
  const claim_ref_id = "opaque-ref-456";

  res.status(201).json({ claim_id, claim_ref_id });
});

app.listen(PORT, () => {
  console.log(`health-billing-service listening on port ${PORT}`);
});
