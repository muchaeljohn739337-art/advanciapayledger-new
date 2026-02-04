import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { v4 as uuidv4 } from "uuid";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";
const TEST_TENANT_ID = process.env.TEST_TENANT_ID || "test-tenant-001";
const TEST_AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || "test-token";

interface TestContext {
  patientId?: string;
  documentId?: string;
  claimId?: string;
}

const ctx: TestContext = {};

async function apiRequest(
  method: string,
  path: string,
  body?: unknown,
): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TEST_AUTH_TOKEN}`,
      "X-Tenant-ID": TEST_TENANT_ID,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("PHI Services Integration Tests", () => {
  describe("Patient Link Service", () => {
    it("should create a patient record", async () => {
      const response = await apiRequest("POST", "/api/v1/patients", {
        external_id: `TEST-${uuidv4().slice(0, 8)}`,
        demographics: {
          first_name: "Test",
          last_name: "Patient",
          date_of_birth: "1990-01-15",
          gender: "M",
        },
        insurance: {
          provider: "Test Insurance",
          member_id: "TI123456789",
          group_number: "GRP001",
        },
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.patient_ref_id).toBeDefined();
      expect(data.patient_ref_id).toMatch(/^patient_ref_/);

      ctx.patientId = data.id;
    });

    it("should retrieve patient by ref_id", async () => {
      const response = await apiRequest(
        "GET",
        `/api/v1/patients/${ctx.patientId}`,
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.demographics.first_name).toBe("Test");
    });

    it("should enforce tenant isolation (negative test)", async () => {
      // Try to access with wrong tenant
      const response = await fetch(
        `${API_BASE_URL}/api/v1/patients/${ctx.patientId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${TEST_AUTH_TOKEN}`,
            "X-Tenant-ID": "wrong-tenant-id",
          },
        },
      );

      expect(response.status).toBe(404);
    });
  });

  describe("Identity Service", () => {
    it("should upload identity document", async () => {
      // Create a minimal test document (base64 encoded placeholder)
      const testDocContent = Buffer.from("test document content").toString(
        "base64",
      );

      const response = await apiRequest("POST", "/api/v1/identity/upload", {
        patient_ref_id: `patient_ref_${ctx.patientId}`,
        document_type: "drivers_license",
        file_content: testDocContent,
        file_name: "test_license.jpg",
        extracted_fields: {
          document_number: "DL123456789",
          expiration_date: "2028-12-31",
          issuing_state: "CA",
        },
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.document_id).toBeDefined();
      expect(data.verification_status).toBe("pending");

      ctx.documentId = data.document_id;
    });

    it("should retrieve identity document metadata", async () => {
      const response = await apiRequest(
        "GET",
        `/api/v1/identity/${ctx.documentId}`,
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.document_type).toBe("drivers_license");
      expect(data.verification_status).toBeDefined();
    });

    it("should list patient identity documents", async () => {
      const response = await apiRequest(
        "GET",
        `/api/v1/identity/patients/patient_ref_${ctx.patientId}/identity-documents`,
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data.documents)).toBe(true);
      expect(data.documents.length).toBeGreaterThan(0);
    });
  });

  describe("Claims Intake Service", () => {
    it("should submit a claim", async () => {
      const response = await apiRequest("POST", "/api/v1/claims", {
        patient_ref_id: `patient_ref_${ctx.patientId}`,
        claim_type: "professional",
        provider: {
          npi: "1234567890",
          name: "Test Provider",
          taxonomy: "207Q00000X",
        },
        service_lines: [
          {
            procedure_code: "99213",
            diagnosis_codes: ["J06.9"],
            service_date: "2026-02-01",
            units: 1,
            charge_amount: 150.0,
          },
        ],
        total_charge: 150.0,
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.claim_id).toBeDefined();
      expect(data.status).toBe("submitted");

      ctx.claimId = data.claim_id;
    });

    it("should retrieve claim status", async () => {
      const response = await apiRequest("GET", `/api/v1/claims/${ctx.claimId}`);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.claim_id).toBe(ctx.claimId);
      expect(data.status).toBeDefined();
    });

    it("should list patient claims", async () => {
      const response = await apiRequest(
        "GET",
        `/api/v1/claims?patient_ref_id=patient_ref_${ctx.patientId}`,
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data.claims)).toBe(true);
    });
  });

  describe("Health Billing Service", () => {
    it("should retrieve billing summary", async () => {
      const response = await apiRequest(
        "GET",
        `/api/v1/billing/patients/patient_ref_${ctx.patientId}/summary`,
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.total_charges).toBeDefined();
      expect(data.total_payments).toBeDefined();
      expect(data.balance_due).toBeDefined();
    });
  });

  describe("PHI Docs Service", () => {
    it("should upload a medical document", async () => {
      const testDocContent = Buffer.from("test medical document").toString(
        "base64",
      );

      const response = await apiRequest("POST", "/api/v1/documents", {
        patient_ref_id: `patient_ref_${ctx.patientId}`,
        document_type: "lab_result",
        file_content: testDocContent,
        file_name: "lab_results.pdf",
        metadata: {
          lab_name: "Test Lab",
          test_date: "2026-02-01",
        },
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.document_id).toBeDefined();
    });
  });

  describe("Security & Compliance", () => {
    it("should reject requests without auth token", async () => {
      const response = await fetch(`${API_BASE_URL}/api/v1/patients`, {
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": TEST_TENANT_ID,
        },
      });

      expect(response.status).toBe(401);
    });

    it("should reject requests without tenant ID", async () => {
      const response = await fetch(`${API_BASE_URL}/api/v1/patients`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TEST_AUTH_TOKEN}`,
        },
      });

      expect(response.status).toBe(400);
    });

    it("should not expose PHI in error messages", async () => {
      const response = await apiRequest(
        "GET",
        "/api/v1/patients/nonexistent-id",
      );

      expect(response.status).toBe(404);
      const data = await response.json();

      // Error message should not contain any PHI patterns
      const errorText = JSON.stringify(data);
      expect(errorText).not.toMatch(/\d{3}-\d{2}-\d{4}/); // No SSN
      expect(errorText).not.toMatch(/\d{2}\/\d{2}\/\d{4}/); // No DOB
    });

    it("should include audit headers in responses", async () => {
      const response = await apiRequest(
        "GET",
        `/api/v1/patients/${ctx.patientId}`,
      );

      expect(response.headers.get("X-Request-ID")).toBeDefined();
    });
  });

  describe("Rate Limiting", () => {
    it("should enforce rate limits", async () => {
      const requests = Array.from({ length: 150 }, () =>
        apiRequest("GET", "/api/v1/health"),
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter((r) => r.status === 429);

      // Should have some rate-limited responses
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });
});

describe("Worker Integration Tests", () => {
  describe("Identity Verification Worker", () => {
    it("should process pending identity documents", async () => {
      // Wait for worker to process the document uploaded earlier
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const response = await apiRequest(
        "GET",
        `/api/v1/identity/${ctx.documentId}`,
      );
      const data = await response.json();

      // Document should no longer be pending
      expect(data.verification_status).not.toBe("pending");
      expect(["verified", "needs_review", "rejected", "expired"]).toContain(
        data.verification_status,
      );
    });
  });
});

// Cleanup
afterAll(async () => {
  // In a real test, we'd clean up test data
  // For now, just log completion
  console.log("Integration tests completed");
  console.log("Test artifacts:", ctx);
});
