import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  Message,
} from "@aws-sdk/client-sqs";
import {
  EventBridgeClient,
  PutEventsCommand,
} from "@aws-sdk/client-eventbridge";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

// Configuration
const QUEUE_URL = process.env.IDENTITY_VERIFICATION_QUEUE_URL || "";
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME || "health-events-bus";
const DATABASE_URL = process.env.DATABASE_URL || "";
const AWS_REGION = process.env.AWS_REGION || "us-east-1";
const POLL_INTERVAL_MS = 1000;
const VISIBILITY_TIMEOUT = 300; // 5 minutes

// Clients
const sqsClient = new SQSClient({ region: AWS_REGION });
const eventBridgeClient = new EventBridgeClient({ region: AWS_REGION });

let pool: Pool;

function initPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: true },
      max: 5,
    });
  }
  return pool;
}

// Verification status types
type VerificationStatus = "verified" | "rejected" | "needs_review" | "expired";

interface VerificationResult {
  status: VerificationStatus;
  confidence: number;
  issues: string[];
  verified_at: string;
}

// Document verification logic
async function verifyDocument(
  documentId: string,
  documentType: string,
  tenantId: string,
): Promise<VerificationResult> {
  const db = initPool();

  // Set tenant context for RLS
  await db.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);

  // Fetch document metadata
  const docResult = await db.query(
    `SELECT id, document_type, extracted_fields, created_at
     FROM health.identity_documents
     WHERE id = $1`,
    [documentId],
  );

  if (docResult.rows.length === 0) {
    return {
      status: "rejected",
      confidence: 0,
      issues: ["Document not found"],
      verified_at: new Date().toISOString(),
    };
  }

  const doc = docResult.rows[0];
  const extractedFields = doc.extracted_fields || {};
  const issues: string[] = [];
  let confidence = 100;

  // Validation rules based on document type
  switch (documentType) {
    case "drivers_license":
    case "state_id":
      // Check for required fields
      if (!extractedFields.expiration_date) {
        issues.push("Missing expiration date");
        confidence -= 20;
      } else {
        // Check if expired
        const expDate = new Date(extractedFields.expiration_date);
        if (expDate < new Date()) {
          issues.push("Document expired");
          return {
            status: "expired",
            confidence: 100,
            issues,
            verified_at: new Date().toISOString(),
          };
        }
      }
      if (!extractedFields.document_number) {
        issues.push("Missing document number");
        confidence -= 15;
      }
      if (!extractedFields.issuing_state) {
        issues.push("Missing issuing state");
        confidence -= 10;
      }
      break;

    case "passport":
      if (!extractedFields.expiration_date) {
        issues.push("Missing expiration date");
        confidence -= 20;
      } else {
        const expDate = new Date(extractedFields.expiration_date);
        if (expDate < new Date()) {
          return {
            status: "expired",
            confidence: 100,
            issues: ["Passport expired"],
            verified_at: new Date().toISOString(),
          };
        }
      }
      if (!extractedFields.passport_number) {
        issues.push("Missing passport number");
        confidence -= 20;
      }
      if (!extractedFields.issuing_country) {
        issues.push("Missing issuing country");
        confidence -= 10;
      }
      break;

    case "ebt_card_front":
    case "ebt_card_back":
      // EBT cards typically don't have expiration
      if (!extractedFields.card_number && !extractedFields.account_number) {
        issues.push("Missing card/account number");
        confidence -= 30;
      }
      if (!extractedFields.issuer) {
        issues.push("Missing issuer information");
        confidence -= 10;
      }
      break;

    case "medicaid_card":
      if (!extractedFields.member_id) {
        issues.push("Missing member ID");
        confidence -= 25;
      }
      if (!extractedFields.effective_date) {
        issues.push("Missing effective date");
        confidence -= 10;
      }
      break;

    default:
      // Generic document - basic validation
      if (Object.keys(extractedFields).length === 0) {
        issues.push("No extracted fields available");
        confidence -= 50;
      }
  }

  // Determine final status
  let status: VerificationStatus;
  if (confidence >= 80) {
    status = "verified";
  } else if (confidence >= 50) {
    status = "needs_review";
  } else {
    status = "rejected";
  }

  return {
    status,
    confidence,
    issues,
    verified_at: new Date().toISOString(),
  };
}

// Update document with verification result
async function updateDocumentVerification(
  documentId: string,
  tenantId: string,
  result: VerificationResult,
): Promise<void> {
  const db = initPool();

  await db.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);

  await db.query(
    `UPDATE health.identity_documents
     SET 
       extracted_fields = extracted_fields || $2::jsonb,
       updated_at = NOW()
     WHERE id = $1`,
    [
      documentId,
      JSON.stringify({
        verification_status: result.status,
        verification_confidence: result.confidence,
        verification_issues: result.issues,
        verified_at: result.verified_at,
      }),
    ],
  );
}

// Emit PHI-safe verification event
async function emitVerificationEvent(
  documentId: string,
  patientRefId: string,
  documentType: string,
  status: VerificationStatus,
): Promise<void> {
  await eventBridgeClient.send(
    new PutEventsCommand({
      Entries: [
        {
          Source: "advancia.identity",
          DetailType: "IdentityDocumentVerified",
          EventBusName: EVENT_BUS_NAME,
          Detail: JSON.stringify({
            document_id: documentId,
            patient_ref_id: patientRefId,
            document_type: documentType,
            verification_status: status,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    }),
  );
}

// Get patient_ref_id for event emission
async function getPatientRefId(
  documentId: string,
  tenantId: string,
): Promise<string | null> {
  const db = initPool();

  await db.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);

  const result = await db.query(
    `SELECT p.patient_ref_id
     FROM health.identity_documents id
     JOIN health.patients p ON id.patient_id = p.id
     WHERE id.id = $1`,
    [documentId],
  );

  return result.rows.length > 0 ? result.rows[0].patient_ref_id : null;
}

// Process a single message
async function processMessage(message: Message): Promise<void> {
  if (!message.Body) {
    console.log("Empty message body, skipping");
    return;
  }

  const payload = JSON.parse(message.Body);
  const { document_id, document_type, tenant_id } = payload;

  console.log(`Processing document: ${document_id}, type: ${document_type}`);

  try {
    // Verify the document
    const result = await verifyDocument(document_id, document_type, tenant_id);
    console.log(
      `Verification result: ${result.status}, confidence: ${result.confidence}`,
    );

    // Update document with verification result
    await updateDocumentVerification(document_id, tenant_id, result);

    // Get patient_ref_id for event
    const patientRefId = await getPatientRefId(document_id, tenant_id);

    // Emit PHI-safe event
    if (patientRefId) {
      await emitVerificationEvent(
        document_id,
        patientRefId,
        document_type,
        result.status,
      );
    }

    // Delete message from queue
    await sqsClient.send(
      new DeleteMessageCommand({
        QueueUrl: QUEUE_URL,
        ReceiptHandle: message.ReceiptHandle,
      }),
    );

    console.log(`Document ${document_id} processed successfully`);
  } catch (error) {
    console.error(`Error processing document ${document_id}:`, error);
    // Message will return to queue after visibility timeout
    throw error;
  }
}

// Main polling loop
async function pollQueue(): Promise<void> {
  console.log("Identity Worker started, polling queue...");

  while (true) {
    try {
      const response = await sqsClient.send(
        new ReceiveMessageCommand({
          QueueUrl: QUEUE_URL,
          MaxNumberOfMessages: 10,
          WaitTimeSeconds: 20, // Long polling
          VisibilityTimeout: VISIBILITY_TIMEOUT,
        }),
      );

      if (response.Messages && response.Messages.length > 0) {
        console.log(`Received ${response.Messages.length} messages`);

        for (const message of response.Messages) {
          try {
            await processMessage(message);
          } catch (error) {
            console.error("Failed to process message:", error);
            // Continue processing other messages
          }
        }
      }
    } catch (error) {
      console.error("Error polling queue:", error);
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS * 5));
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down...");
  if (pool) {
    await pool.end();
  }
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down...");
  if (pool) {
    await pool.end();
  }
  process.exit(0);
});

// Start the worker
pollQueue().catch((error) => {
  console.error("Worker failed:", error);
  process.exit(1);
});
