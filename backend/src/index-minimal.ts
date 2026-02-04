import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.json());

// Basic health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Advancia PayLedger API is running",
    timestamp: new Date().toISOString(),
  });
});

// Basic API info
app.get("/", (req, res) => {
  res.json({
    name: "Advancia PayLedger API",
    version: "1.0.0",
    status: "running",
    environment: process.env.NODE_ENV || "development",
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Advancia PayLedger API started on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
});
