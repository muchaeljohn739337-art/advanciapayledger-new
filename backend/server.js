const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

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
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
  });
});

// Basic API info
app.get("/", (req, res) => {
  res.json({
    name: "Advancia PayLedger API",
    version: "1.0.0",
    status: "running",
    environment: process.env.NODE_ENV || "development",
    endpoints: {
      health: "/health",
      api: "/api/v1/*",
    },
  });
});

// API v1 routes
app.get("/api/v1/health", (req, res) => {
  res.json({
    status: "ok",
    message: "API v1 is running",
    timestamp: new Date().toISOString(),
  });
});

// Mock auth endpoints for testing
app.post("/api/v1/auth/login", (req, res) => {
  const { email, password } = req.body;

  // Mock authentication
  if (email && password) {
    res.json({
      success: true,
      token: "mock-jwt-token-" + Date.now(),
      user: {
        id: "mock-user-id",
        email: email,
        name: "Test User",
        role: "USER",
      },
    });
  } else {
    res.status(400).json({
      success: false,
      message: "Email and password required",
    });
  }
});

app.post("/api/v1/auth/register", (req, res) => {
  const { email, password, name } = req.body;

  if (email && password && name) {
    res.json({
      success: true,
      token: "mock-jwt-token-" + Date.now(),
      user: {
        id: "mock-user-id-" + Date.now(),
        email: email,
        name: name,
        role: "USER",
      },
    });
  } else {
    res.status(400).json({
      success: false,
      message: "Email, password, and name required",
    });
  }
});

// Mock user endpoint
app.get("/api/v1/users/me", (req, res) => {
  res.json({
    id: "mock-user-id",
    email: "test@example.com",
    name: "Test User",
    role: "USER",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
  });
});

// Mock wallet endpoints
app.get("/api/v1/wallets", (req, res) => {
  res.json([
    {
      id: "mock-wallet-id",
      blockchain: "ethereum",
      address: "0xmockaddress",
      balance: "1000.00",
      currency: "USD",
    },
  ]);
});

app.post("/api/v1/wallets", (req, res) => {
  const { blockchain } = req.body;

  if (blockchain) {
    res.json({
      success: true,
      wallet: {
        id: "mock-wallet-id-" + Date.now(),
        blockchain: blockchain,
        address: "0xmockaddress" + Date.now(),
        balance: "0.00",
        currency: "USD",
      },
    });
  } else {
    res.status(400).json({
      success: false,
      message: "Blockchain required",
    });
  }
});

// Mock payment endpoints
app.get("/api/v1/payments", (req, res) => {
  res.json([
    {
      id: "mock-payment-id",
      amount: "100.00",
      currency: "USD",
      status: "COMPLETED",
      type: "PAYMENT",
      createdAt: new Date().toISOString(),
    },
  ]);
});

app.post("/api/v1/payments", (req, res) => {
  const { amount, currency, type } = req.body;

  if (amount && currency) {
    res.json({
      success: true,
      payment: {
        id: "mock-payment-id-" + Date.now(),
        amount: amount,
        currency: currency,
        status: "PENDING",
        type: type || "PAYMENT",
        createdAt: new Date().toISOString(),
      },
    });
  } else {
    res.status(400).json({
      success: false,
      message: "Amount and currency required",
    });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    ...(process.env.NODE_ENV === "development" && { error: err.message }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
    path: req.path,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Advancia PayLedger API started on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API: http://localhost:${PORT}/api/v1`);
  console.log(`🏥 Environment: ${process.env.NODE_ENV || "development"}`);
});
