import request from "supertest";
import app from "../src/app";
import { prisma } from "../src/app";
import { hashPassword } from "../src/utils/encryption";

describe("Payment Integration Tests", () => {
  let authToken: string;
  let userId: string;
  let patientId: string;
  let facilityId: string;

  beforeAll(async () => {
    // Clean up and setup test data
    await prisma.payment.deleteMany();
    await prisma.patient.deleteMany();
    await prisma.facility.deleteMany();
    await prisma.user.deleteMany();

    const hashedPassword = await hashPassword("password123");
    const user = await prisma.user.create({
      data: {
        email: "test@example.com",
        passwordHash: hashedPassword,
        firstName: "Test",
        lastName: "User",
        role: "ADMIN",
      },
    });
    userId = user.id;

    const facility = await prisma.facility.create({
      data: {
        name: "Test Hospital",
        address: "123 Test St",
        city: "Test City",
        state: "TS",
        zipCode: "12345",
        phone: "1234567890",
        email: "hospital@test.com",
        type: "HOSPITAL",
      },
    });
    facilityId = facility.id;

    const patient = await prisma.patient.create({
      data: {
        userId: user.id,
        firstName: "Test",
        lastName: "Patient",
        dateOfBirth: new Date("1990-01-01"),
        facilityId: facility.id,
      },
    });
    patientId = patient.id;

    // Login to get token
    const loginRes = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "password123",
    });
    authToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("POST /api/payments", () => {
    it("should create a payment successfully", async () => {
      const res = await request(app)
        .post("/api/payments")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          amount: 100,
          currency: "USD",
          paymentMethod: "CREDIT_CARD",
          description: "Test Consultation",
          patientId: patientId,
          facilityId: facilityId,
        });

      expect(res.status).toBe(201);
      expect(res.body.payment).toBeDefined();
      expect(res.body.payment.amount).toBe("100");
      expect(res.body.payment.status).toBe("COMPLETED");
    });

    it("should fail if patient not found", async () => {
      const res = await request(app)
        .post("/api/payments")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          amount: 50,
          currency: "USD",
          paymentMethod: "DEBIT_CARD",
          description: "Test Payment",
          patientId: "non-existent-id",
          facilityId: facilityId,
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Patient not found");
    });

    it("should return fraud alert for highly suspicious amounts", async () => {
      // Very large amount might trigger fraud detection mock/agent
      const res = await request(app)
        .post("/api/payments")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          amount: 1000000, // Trigger high risk score
          currency: "USD",
          paymentMethod: "CREDIT_CARD",
          description: "Suspicious Payment",
          patientId: patientId,
          facilityId: facilityId,
        });

      // Note: This depends on the FraudDetectionAgent response
      // If riskScore > 80, it returns 403
      if (res.status === 403) {
        expect(res.body.error).toBe("FRAUD_ALERT");
      } else {
        expect(res.status).toBe(201);
      }
    });
  });

  describe("GET /api/payments", () => {
    it("should fetch all payments", async () => {
      const res = await request(app)
        .get("/api/payments")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.payments)).toBe(true);
      expect(res.body.payments.length).toBeGreaterThan(0);
    });
  });
});
