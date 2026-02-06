import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT ? Number(process.env.PORT) : 3003;

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "claims-intake-service" });
});

// POST /health/v1/claims/intake - Submit new claim intake payload
app.post("/health/v1/claims/intake", async (req, res) => {
  const {
    tenant_user_id,
    patient_ref_id,
    insurance_card,
    service_date,
    raw_payload,
  } = req.body;

  // TODO:
  // 1. Validate payload
  // 2. Resolve patient_ref_id to patient_id via patient-link-service
  // 3. Store structured fields in health_claims_intake
  // 4. If raw image uploaded, store in S3 PHI bucket
  // 5. Push job to health-claims-processing-queue (SQS)

  const intake_id = "new-intake-uuid";

  res.status(201).json({ intake_id, status: "pending" });
});

// GET /health/v1/claims/intake/:intake_id - Get intake status
app.get("/health/v1/claims/intake/:intake_id", async (req, res) => {
  const { intake_id } = req.params;

  // TODO: Query Aurora health.claims_intake WHERE id = $1
  res.json({
    intake_id,
    status: "pending",
    created_at: new Date().toISOString(),
  });
});

// POST /health/v1/insurance-cards - Upload or update insurance card data
app.post("/health/v1/insurance-cards", async (req, res) => {
  const { patient_ref_id, payer_code, plan_name, member_id, group_number } =
    req.body;

  // TODO:
  // 1. Resolve patient_ref_id to patient_id
  // 2. INSERT into health_insurance_cards
  // 3. Store raw image in S3 PHI bucket if provided

  const insurance_card_id = "new-card-uuid";

  res.status(201).json({ insurance_card_id });
});

app.listen(PORT, () => {
  console.log(`claims-intake-service listening on port ${PORT}`);
});
