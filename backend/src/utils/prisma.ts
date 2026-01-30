import { PrismaClient, Prisma } from "@prisma/client";
import { logger } from "./logger";

declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__prisma ||
  new PrismaClient({
    log: [
      { level: "query", emit: "event" },
      { level: "error", emit: "event" },
      { level: "warn", emit: "event" },
    ],
  });

if (process.env.NODE_ENV === "development") {
  globalThis.__prisma = prisma;
}

(prisma as any).$on("query", (e: any) => {
  logger.debug("Query: " + e.query);
  logger.debug("Params: " + e.params);
  logger.debug("Duration: " + e.duration + "ms");
});

(prisma as any).$on("error", (e: any) => {
  logger.error("Prisma Error: " + e.message);
});

(prisma as any).$on("warn", (e: any) => {
  logger.warn("Prisma Warning: " + e.message);
});
