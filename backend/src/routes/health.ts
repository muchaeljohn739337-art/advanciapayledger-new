import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";
import { Connection } from "@solana/web3.js";
import { ethers } from "ethers";

const router = Router();
const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    database: ComponentHealth;
    redis: ComponentHealth;
    blockchain: {
      solana: ComponentHealth;
      ethereum: ComponentHealth;
    };
    memory: MemoryHealth;
    disk: DiskHealth;
  };
}

interface ComponentHealth {
  status: "up" | "down" | "degraded";
  responseTime?: number;
  error?: string;
  details?: any;
}

interface MemoryHealth extends ComponentHealth {
  usedMB: number;
  totalMB: number;
  percentUsed: number;
}

interface DiskHealth extends ComponentHealth {
  usedGB: number;
  totalGB: number;
  percentUsed: number;
}

// Basic health check - fast, for load balancers
router.get("/health", async (req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// Liveness probe - checks if app is running
router.get("/health/live", async (req: Request, res: Response) => {
  res.status(200).json({
    status: "alive",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Readiness probe - checks if app is ready to accept traffic
router.get("/health/ready", async (req: Request, res: Response) => {
  try {
    // Quick database check
    await prisma.$queryRaw`SELECT 1`;

    // Quick Redis check
    await redis.ping();

    res.status(200).json({
      status: "ready",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: "not_ready",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Comprehensive health check - detailed system status
router.get("/health/detailed", async (req: Request, res: Response) => {
  const startTime = Date.now();
  const result: HealthCheckResult = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.APP_VERSION || "1.0.0",
    environment: process.env.NODE_ENV || "development",
    checks: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      blockchain: {
        solana: await checkSolana(),
        ethereum: await checkEthereum(),
      },
      memory: checkMemory(),
      disk: await checkDisk(),
    },
  };

  // Determine overall status
  const allChecks = [
    result.checks.database,
    result.checks.redis,
    result.checks.blockchain.solana,
    result.checks.blockchain.ethereum,
    result.checks.memory,
    result.checks.disk,
  ];

  const hasDown = allChecks.some((c) => c.status === "down");
  const hasDegraded = allChecks.some((c) => c.status === "degraded");

  if (hasDown) {
    result.status = "unhealthy";
  } else if (hasDegraded) {
    result.status = "degraded";
  }

  const statusCode =
    result.status === "healthy"
      ? 200
      : result.status === "degraded"
        ? 200
        : 503;

  res.status(statusCode).json(result);
});

// Database health check
async function checkDatabase(): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;

    return {
      status: "up",
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      status: "down",
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Redis health check
async function checkRedis(): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    const pong = await redis.ping();

    return {
      status: pong === "PONG" ? "up" : "down",
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      status: "down",
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Solana blockchain health check
async function checkSolana(): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    const connection = new Connection(
      process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
    );

    const slot = await connection.getSlot();

    return {
      status: "up",
      responseTime: Date.now() - start,
      details: {
        currentSlot: slot,
      },
    };
  } catch (error) {
    return {
      status: "down",
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Ethereum blockchain health check
async function checkEthereum(): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    const provider = new ethers.JsonRpcProvider(
      process.env.ETHEREUM_RPC_URL || "https://eth.llamarpc.com",
    );

    const blockNumber = await provider.getBlockNumber();

    return {
      status: "up",
      responseTime: Date.now() - start,
      details: {
        blockNumber,
      },
    };
  } catch (error) {
    return {
      status: "down",
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Memory health check
function checkMemory(): MemoryHealth {
  const memUsage = process.memoryUsage();
  const totalMB = memUsage.heapTotal / 1024 / 1024;
  const usedMB = memUsage.heapUsed / 1024 / 1024;
  const percentUsed = (usedMB / totalMB) * 100;

  let status: "up" | "degraded" | "down" = "up";
  if (percentUsed > 90) status = "down";
  else if (percentUsed > 80) status = "degraded";

  return {
    status,
    usedMB: Math.round(usedMB),
    totalMB: Math.round(totalMB),
    percentUsed: Math.round(percentUsed),
  };
}

// Disk health check
async function checkDisk(): Promise<DiskHealth> {
  try {
    const { execSync } = require("child_process");
    const dfOutput = execSync("df -k /").toString();
    const lines = dfOutput.trim().split("\n");
    const data = lines[1].split(/\s+/);

    const totalKB = parseInt(data[1]);
    const usedKB = parseInt(data[2]);
    const totalGB = totalKB / 1024 / 1024;
    const usedGB = usedKB / 1024 / 1024;
    const percentUsed = (usedGB / totalGB) * 100;

    let status: "up" | "degraded" | "down" = "up";
    if (percentUsed > 95) status = "down";
    else if (percentUsed > 85) status = "degraded";

    return {
      status,
      usedGB: Math.round(usedGB),
      totalGB: Math.round(totalGB),
      percentUsed: Math.round(percentUsed),
    };
  } catch (error) {
    return {
      status: "degraded",
      usedGB: 0,
      totalGB: 0,
      percentUsed: 0,
      error: "Unable to check disk usage",
    };
  }
}

// Metrics endpoint for Prometheus/monitoring tools
router.get("/metrics", async (req: Request, res: Response) => {
  const metrics = {
    process_uptime_seconds: process.uptime(),
    process_cpu_usage_percent: process.cpuUsage().user / 1000000,
    process_memory_usage_bytes: process.memoryUsage().heapUsed,
    nodejs_version: process.version,
    timestamp: Date.now(),
  };

  res.set("Content-Type", "text/plain");
  res.send(formatPrometheusMetrics(metrics));
});

function formatPrometheusMetrics(metrics: Record<string, any>): string {
  return Object.entries(metrics)
    .filter(([_, value]) => typeof value === "number")
    .map(([key, value]) => `${key} ${value}`)
    .join("\n");
}

export default router;
