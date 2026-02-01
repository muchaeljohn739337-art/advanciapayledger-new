// src/tests/setup.ts
import { PrismaClient } from "@prisma/client";
import Redis from "ioredis-mock";

// Mock Prisma
export const mockPrisma = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.TEST_DATABASE_URL ||
        "postgresql://test:test@localhost:5432/test",
    },
  },
});

// Mock Redis
export const mockRedis = new Redis();

// Global test setup
beforeAll(async () => {
  // Setup test database
  await mockPrisma.$connect();
});

afterAll(async () => {
  // Cleanup
  await mockPrisma.$disconnect();
  mockRedis.disconnect();
});

beforeEach(async () => {
  // Clear data between tests
  await clearDatabase();
});

async function clearDatabase() {
  const tablenames = await mockPrisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `;

  for (const { tablename } of tablenames) {
    if (tablename !== "_prisma_migrations") {
      try {
        await mockPrisma.$executeRawUnsafe(
          `TRUNCATE TABLE "public"."${tablename}" CASCADE;`,
        );
      } catch (error) {
        console.log(`Could not truncate ${tablename}`);
      }
    }
  }
}

// Test utilities
export const createTestUser = async (overrides = {}) => {
  return await mockPrisma.user.create({
    data: {
      email: "test@example.com",
      passwordHash: "hashedPassword123",
      firstName: "Test",
      lastName: "User",
      role: "STAFF",
      ...overrides,
    },
  });
};

export const createTestFacility = async (overrides = {}) => {
  return await mockPrisma.facility.create({
    data: {
      name: "Test Healthcare Facility",
      type: "CLINIC",
      address: "123 Test St",
      city: "Test City",
      state: "TS",
      zipCode: "12345",
      phone: "555-0100",
      email: "facility@test.com",
      ...overrides,
    },
  });
};

export const createTestTransaction = async (userId: string, overrides = {}) => {
  return await mockPrisma.transaction.create({
    data: {
      userId,
      amount: 100.0,
      currency: "USD",
      type: "PAYMENT_RECEIVED",
      status: "COMPLETED",
      paymentMethod: "CREDIT_CARD",
      ...overrides,
    },
  });
};
