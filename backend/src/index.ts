import app from "./app";
import { logger } from "./utils/logger";

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  logger.info(`🚀 Advancia PayLedger Backend started`);
  logger.info(`📡 Server running on http://localhost:${PORT}`);
  logger.info(`🏥 Environment: ${process.env.NODE_ENV || "development"}`);
  logger.info(`💼 Ready to process payments`);
});
