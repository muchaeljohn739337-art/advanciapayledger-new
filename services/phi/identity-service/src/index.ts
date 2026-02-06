import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { getPool, withTenant } from "../shared/utils/auroraClient";
import {
  uploadToPHIBucket,
  getPresignedDownloadURL,
} from "../shared/utils/s3Client";
import { publishToQueue } from "../shared/utils/sqsPublisher";
import { publishPHISafeEvent } from "../shared/utils/eventBridgePublisher";

dotenv.config();

const app = express();
app.use(express.json({ limit: "10mb" }));

const PORT = process.env.PORT || 3006;
const IDENTITY_VERIFICATION_QUEUE_URL =
  process.env.IDENTITY_VERIFICATION_QUEUE_URL || "";
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME || "health-events-bus";

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", service: "identity-service" });
});

// POST /health/v1/identity/upload
// Upload an identity or benefits document
app.post("/health/v1/identity/upload", async (req: Request, res: Response) => {
  const tenantId = req.headers["x-tenant-id"] as string;
  if (!tenantId) {
    return res.status(400).json({ error: "Missing x-tenant-id header" });
  }

  const { patient_ref_id, document_type, image_base64, extracted_fields } =
    req.body;

  if (!patient_ref_id || !document_type || !image_base64) {
    return res
      .status(400)
      .json({
        error:
          "Missing required fields: patient_ref_id, document_type, image_base64",
      });
  }

  try {
    // 1. Resolve patient_ref_id to patient_id
    const patientQuery = await withTenant(tenantId, async (pool) => {
      return pool.query(
        "SELECT id FROM health.patients WHERE patient_ref_id = $1",
        [patient_ref_id],
      );
    });

    if (patientQuery.rows.length === 0) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const patientId = patientQuery.rows[0].id;
    const documentId = uuidv4();

    // 2. Upload image to S3 PHI/PII bucket
    const imageBuffer = Buffer.from(image_base64, "base64");
    const s3Key = `identity/${tenantId}/${documentId}.jpg`;
    await uploadToPHIBucket(s3Key, imageBuffer, "image/jpeg");

    // 3. Write metadata to health_identity_documents
    await withTenant(tenantId, async (pool) => {
      return pool.query(
        `INSERT INTO health.identity_documents 
         (id, patient_id, document_type, s3_key, extracted_fields, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          documentId,
          patientId,
          document_type,
          s3Key,
          JSON.stringify(extracted_fields || {}),
        ],
      );
    });

    // 4. (Optional) Publish to SQS for async verification
    if (IDENTITY_VERIFICATION_QUEUE_URL) {
      await publishToQueue(IDENTITY_VERIFICATION_QUEUE_URL, {
        document_id: documentId,
        patient_id: patientId,
        document_type,
        tenant_id: tenantId,
      });
    }

    // 5. Emit PHI-safe event
    await publishPHISafeEvent(EVENT_BUS_NAME, "IdentityDocumentUploaded", {
      document_id: documentId,
      patient_ref_id,
      document_type,
      status: "stored",
    });

    res.status(201).json({
      document_id: documentId,
      status: "stored",
    });
  } catch (error: any) {
    console.error("Error uploading identity document:", error);
    res.status(500).json({ error: "Failed to upload identity document" });
  }
});

// GET /health/v1/identity/:document_id
// Retrieve identity document metadata (never the raw image)
app.get(
  "/health/v1/identity/:document_id",
  async (req: Request, res: Response) => {
    const tenantId = req.headers["x-tenant-id"] as string;
    if (!tenantId) {
      return res.status(400).json({ error: "Missing x-tenant-id header" });
    }

    const { document_id } = req.params;

    try {
      const result = await withTenant(tenantId, async (pool) => {
        return pool.query(
          `SELECT 
           id.id AS document_id,
           id.document_type,
           id.s3_key,
           id.extracted_fields,
           id.created_at,
           p.id AS patient_id,
           p.patient_ref_id
         FROM health.identity_documents id
         JOIN health.patients p ON id.patient_id = p.id
         WHERE id.id = $1`,
          [document_id],
        );
      });

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Identity document not found" });
      }

      const doc = result.rows[0];

      res.json({
        document_id: doc.document_id,
        document_type: doc.document_type,
        patient_ref_id: doc.patient_ref_id,
        s3_key: doc.s3_key,
        extracted_fields: doc.extracted_fields,
        created_at: doc.created_at,
      });
    } catch (error: any) {
      console.error("Error retrieving identity document:", error);
      res.status(500).json({ error: "Failed to retrieve identity document" });
    }
  },
);

// GET /health/v1/identity/:document_id/download
// Generate presigned URL for document download (internal use only)
app.get(
  "/health/v1/identity/:document_id/download",
  async (req: Request, res: Response) => {
    const tenantId = req.headers["x-tenant-id"] as string;
    if (!tenantId) {
      return res.status(400).json({ error: "Missing x-tenant-id header" });
    }

    const { document_id } = req.params;

    try {
      const result = await withTenant(tenantId, async (pool) => {
        return pool.query(
          "SELECT s3_key FROM health.identity_documents WHERE id = $1",
          [document_id],
        );
      });

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Identity document not found" });
      }

      const s3Key = result.rows[0].s3_key;
      const downloadUrl = await getPresignedDownloadURL(s3Key, 300); // 5 minutes

      res.json({ download_url: downloadUrl });
    } catch (error: any) {
      console.error("Error generating download URL:", error);
      res.status(500).json({ error: "Failed to generate download URL" });
    }
  },
);

// GET /health/v1/patients/:patient_ref_id/identity-documents
// List all identity documents for a patient
app.get(
  "/health/v1/patients/:patient_ref_id/identity-documents",
  async (req: Request, res: Response) => {
    const tenantId = req.headers["x-tenant-id"] as string;
    if (!tenantId) {
      return res.status(400).json({ error: "Missing x-tenant-id header" });
    }

    const { patient_ref_id } = req.params;

    try {
      const result = await withTenant(tenantId, async (pool) => {
        return pool.query(
          `SELECT 
           id.id AS document_id,
           id.document_type,
           id.extracted_fields,
           id.created_at
         FROM health.identity_documents id
         JOIN health.patients p ON id.patient_id = p.id
         WHERE p.patient_ref_id = $1
         ORDER BY id.created_at DESC`,
          [patient_ref_id],
        );
      });

      res.json({ documents: result.rows });
    } catch (error: any) {
      console.error("Error listing identity documents:", error);
      res.status(500).json({ error: "Failed to list identity documents" });
    }
  },
);

app.listen(PORT, () => {
  console.log(`Identity Service listening on port ${PORT}`);
});
