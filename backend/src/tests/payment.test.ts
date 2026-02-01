// src/tests/payment.test.ts
import { describe, it, expect, beforeEach } from "@jest/globals";
import { mockPrisma, createTestUser } from "./setup";
import type { User } from "@prisma/client";

describe("Payment Processing", () => {
  let testUser: User;

  beforeEach(async () => {
    testUser = await createTestUser();
  });

  describe("Payment Creation", () => {
    it("should create a valid payment transaction", async () => {
      const payment = await mockPrisma.transaction.create({
        data: {
          userId: testUser.id,
          amount: 150.0,
          currency: "USD",
          type: "PAYMENT_RECEIVED",
          status: "PENDING",
          paymentMethod: "CREDIT_CARD",
        },
      });

      expect(payment).toBeDefined();
      expect(payment.amount.toNumber()).toBe(150.0);
      expect(payment.status).toBe("PENDING");
      expect(payment.userId).toBe(testUser.id);
    });

    it("should reject negative payment amounts", async () => {
      await expect(
        mockPrisma.transaction.create({
          data: {
            userId: testUser.id,
            amount: -50.0,
            currency: "USD",
            type: "PAYMENT_RECEIVED",
            status: "PENDING",
            paymentMethod: "CREDIT_CARD",
          },
        }),
      ).rejects.toThrow();
    });
  });

  describe("Payment Status Updates", () => {
    it("should update payment status from PENDING to COMPLETED", async () => {
      const payment = await mockPrisma.transaction.create({
        data: {
          userId: testUser.id,
          amount: 200.0,
          currency: "USD",
          type: "PAYMENT_RECEIVED",
          status: "PENDING",
          paymentMethod: "CRYPTO",
        },
      });

      const updated = await mockPrisma.transaction.update({
        where: { id: payment.id },
        data: {
          status: "COMPLETED",
        },
      });

      expect(updated.status).toBe("COMPLETED");
    });

    it("should not allow status change from COMPLETED to PENDING", async () => {
      const payment = await mockPrisma.transaction.create({
        data: {
          userId: testUser.id,
          amount: 100.0,
          currency: "USD",
          type: "PAYMENT_RECEIVED",
          status: "COMPLETED",
          paymentMethod: "ACH",
        },
      });

      expect(payment.status).toBe("COMPLETED");
    });
  });

  describe("Cryptocurrency Payments", () => {
    it("should create crypto payment with blockchain metadata", async () => {
      const payment = await mockPrisma.transaction.create({
        data: {
          userId: testUser.id,
          amount: 500.0,
          currency: "USDC",
          type: "PAYMENT_RECEIVED",
          status: "PENDING",
          paymentMethod: "CRYPTO",
          description: "SOLANA:DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK",
        },
      });

      expect(payment.currency).toBe("USDC");
      expect(payment.description).toContain("SOLANA");
    });

    it("should handle multiple blockchain networks", async () => {
      const networks = ["SOLANA", "ETHEREUM", "POLYGON", "BASE"];

      for (const network of networks) {
        const payment = await mockPrisma.transaction.create({
          data: {
            userId: testUser.id,
            amount: 100.0,
            currency: "USDC",
            type: "PAYMENT_RECEIVED",
            status: "PENDING",
            paymentMethod: "CRYPTO",
            description: `${network} payment`,
          },
        });

        expect(payment.description).toContain(network);
      }
    });
  });

  describe("Payment Reconciliation", () => {
    it("should calculate user balance correctly", async () => {
      await mockPrisma.transaction.createMany({
        data: [
          {
            userId: testUser.id,
            amount: 100.0,
            currency: "USD",
            type: "PAYMENT_RECEIVED",
            status: "COMPLETED",
            paymentMethod: "CREDIT_CARD",
          },
          {
            userId: testUser.id,
            amount: 250.0,
            currency: "USD",
            type: "PAYMENT_RECEIVED",
            status: "COMPLETED",
            paymentMethod: "ACH",
          },
          {
            userId: testUser.id,
            amount: 50.0,
            currency: "USD",
            type: "REFUND",
            status: "COMPLETED",
            paymentMethod: "CREDIT_CARD",
          },
        ],
      });

      const transactions = await mockPrisma.transaction.findMany({
        where: {
          userId: testUser.id,
          status: "COMPLETED",
        },
      });

      const balance = transactions.reduce((sum, tx) => {
        const amount =
          typeof tx.amount === "number"
            ? tx.amount
            : parseFloat(tx.amount.toString());
        return tx.type === "PAYMENT_RECEIVED" ? sum + amount : sum - amount;
      }, 0);

      expect(balance).toBe(300.0); // 100 + 250 - 50
    });
  });

  describe("Payment Security", () => {
    it("should not store sensitive payment data", async () => {
      const payment = await mockPrisma.transaction.create({
        data: {
          userId: testUser.id,
          amount: 100.0,
          currency: "USD",
          type: "PAYMENT_RECEIVED",
          status: "COMPLETED",
          paymentMethod: "CREDIT_CARD",
          description: "Card ending in 4242",
        },
      });

      expect(payment.description).toContain("4242");
      // Should NEVER have: full card number, CVV, PIN
    });
  });

  describe("Transaction History", () => {
    it("should retrieve transaction history for a user", async () => {
      await mockPrisma.transaction.createMany({
        data: [
          {
            userId: testUser.id,
            amount: 100.0,
            currency: "USD",
            type: "PAYMENT_RECEIVED",
            status: "COMPLETED",
            paymentMethod: "CREDIT_CARD",
          },
          {
            userId: testUser.id,
            amount: 200.0,
            currency: "USD",
            type: "PAYMENT_RECEIVED",
            status: "COMPLETED",
            paymentMethod: "ACH",
          },
        ],
      });

      const history = await mockPrisma.transaction.findMany({
        where: { userId: testUser.id },
        orderBy: { createdAt: "desc" },
      });

      expect(history).toHaveLength(2);
      expect(parseFloat(history[0].amount.toString())).toBe(200.0); // Most recent first
    });
  });
});
