import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from "@aws-sdk/client-sqs";
import {
  EventBridgeClient,
  PutEventsCommand,
} from "@aws-sdk/client-eventbridge";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const sqsClient = new SQSClient({
  region: process.env.AWS_REGION || "us-east-1",
});
const eventBridgeClient = new EventBridgeClient({
  region: process.env.AWS_REGION || "us-east-1",
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: true },
  max: 5,
});

const QUEUE_URL = process.env.SQS_QUEUE_URL || "";
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME || "health-events-bus";

interface IntakeMessage {
  intake_id: string;
  tenant_id: string;
  timestamp: string;
}

async function processIntake(intakeId: string, tenantId: string) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`SET app.tenant_id = $1`, [tenantId]);

    // 1. Fetch intake record
    const intakeResult = await client.query(
      "SELECT * FROM health.claims_intake WHERE id = $1",
      [intakeId],
    );
    if (intakeResult.rows.length === 0) {
      throw new Error(`Intake ${intakeId} not found`);
    }
    const intake = intakeResult.rows[0];

    // 2. Resolve or create patient (simplified - should call patient-link-service)
    const patientId = intake.patient_id; // Assume already resolved

    // 3. Create canonical claim
    const claimRefId = `claim-ref-${Date.now()}`;
    const claimResult = await client.query(
      `INSERT INTO health.claims (
        id, claim_ref_id, patient_id, tenant_id, payer_code,
        service_date, amount_billed, amount_allowed, amount_patient_responsibility,
        status
      ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, claim_ref_id`,
      [
        claimRefId,
        patientId,
        tenantId,
        intake.raw_payload?.payer_code || "UNKNOWN",
        intake.raw_payload?.service_date || new Date(),
        intake.raw_payload?.amount_billed || 0,
        0,
        0,
        "submitted",
      ],
    );

    const claim = claimResult.rows[0];

    // 4. Update intake status
    await client.query(
      "UPDATE health.claims_intake SET status = $1, updated_at = NOW() WHERE id = $2",
      ["validated", intakeId],
    );

    // 5. Emit PHI-safe event to EventBridge
    await eventBridgeClient.send(
      new PutEventsCommand({
        Entries: [
          {
            Source: "advancia.phi.claims",
            DetailType: "ClaimCreated",
            Detail: JSON.stringify({
              claim_ref_id: claim.claim_ref_id,
              tenant_id: tenantId,
              status: "submitted",
              timestamp: new Date().toISOString(),
            }),
            EventBusName: EVENT_BUS_NAME,
          },
        ],
      }),
    );

    await client.query("COMMIT");
    console.log(`Processed intake ${intakeId} -> claim ${claim.id}`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(`Error processing intake ${intakeId}:`, error);
    throw error;
  } finally {
    client.release();
  }
}

async function pollQueue() {
  while (true) {
    try {
      const response = await sqsClient.send(
        new ReceiveMessageCommand({
          QueueUrl: QUEUE_URL,
          MaxNumberOfMessages: 1,
          WaitTimeSeconds: 20,
          VisibilityTimeout: 60,
        }),
      );

      if (response.Messages && response.Messages.length > 0) {
        for (const message of response.Messages) {
          try {
            const body: IntakeMessage = JSON.parse(message.Body || "{}");
            await processIntake(body.intake_id, body.tenant_id);

            // Delete message from queue
            await sqsClient.send(
              new DeleteMessageCommand({
                QueueUrl: QUEUE_URL,
                ReceiptHandle: message.ReceiptHandle,
              }),
            );
          } catch (error) {
            console.error("Failed to process message:", error);
            // Message will return to queue after visibility timeout
          }
        }
      }
    } catch (error) {
      console.error("Error polling queue:", error);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

console.log("Claims intake worker starting...");
pollQueue().catch(console.error);
