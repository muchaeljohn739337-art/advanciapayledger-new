import { initializeSentry } from "./config/sentry";

// Initialize Sentry first, before any other imports
initializeSentry();

import http from "http";
import app from "./app";
import { logger } from "./utils/logger";
import { reconciliationAgent } from "./services/reconciliationAgent";
import { notificationService } from "./services/notificationService";
import { initializeRealTimeMonitoring } from "./services/realTimeMonitoringService";

const PORT = process.env.PORT || 3001;
const server = http.createServer(app);

// Initialize WebSocket notifications
notificationService.initialize(server);

// Initialize real-time monitoring
initializeRealTimeMonitoring(server);

server.listen(PORT, () => {
  logger.info(`🚀 Advancia PayLedger Backend started`);
  logger.info(`📡 Server running on http://localhost:${PORT}`);
  logger.info(`🏥 Environment: ${process.env.NODE_ENV || "development"}`);
  logger.info(`💼 Ready to process payments`);

  // Start automation agents
  reconciliationAgent.start().catch((err) => {
    logger.error("Failed to start Reconciliation Agent:", err);
  });
});
