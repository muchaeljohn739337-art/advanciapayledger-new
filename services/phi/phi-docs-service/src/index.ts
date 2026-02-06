import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT ? Number(process.env.PORT) : 3002;

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "phi-docs-service" });
});

// POST /health/v1/documents/generate - Generate EOBs, statements, etc.
app.post("/health/v1/documents/generate", async (req, res) => {
  const { claim_ref_id, doc_type } = req.body;

  // TODO:
  // 1. Validate claim_ref_id exists
  // 2. Push job to health-doc-generation-queue (SQS)
  // 3. Worker will generate PDF and store in S3 PHI bucket
  // 4. Worker writes metadata to health_documents table

  const document_id = "new-doc-uuid";

  res.status(202).json({ document_id, status: "queued" });
});

// GET /health/v1/documents/:document_id - Retrieve PHI document metadata
app.get("/health/v1/documents/:document_id", async (req, res) => {
  const { document_id } = req.params;

  // TODO: Query Aurora health.documents WHERE id = $1
  res.json({
    document_id,
    doc_type: "eob",
    s3_key: "phi-docs/eob-12345.pdf",
    created_at: new Date().toISOString(),
  });
});

// GET /health/v1/documents/:document_id/download - Generate presigned S3 URL
app.get("/health/v1/documents/:document_id/download", async (req, res) => {
  const { document_id } = req.params;

  // TODO:
  // 1. Verify document exists in health_documents
  // 2. Generate presigned S3 URL (expires in 5 minutes)
  // 3. Return URL

  res.json({
    download_url: "https://s3.amazonaws.com/advancia-phi-docs/...",
    expires_in: 300,
  });
});

app.listen(PORT, () => {
  console.log(`phi-docs-service listening on port ${PORT}`);
});
