// k6 Load Testing Script for Advancia Pay Ledger
// Usage: k6 run --vus 100 --duration 30s load-test.js

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";

// Custom metrics
const errorRate = new Rate("errors");
const loginDuration = new Trend("login_duration");
const paymentDuration = new Trend("payment_duration");
const patientDuration = new Trend("patient_duration");
const dashboardDuration = new Trend("dashboard_duration");
const requestCounter = new Counter("total_requests");

// Configuration
const BASE_URL = __ENV.API_URL || "http://147.182.193.11:3001";

// Test scenarios
export const options = {
  scenarios: {
    // Steady State Load Test
    steady_state: {
      executor: "constant-vus",
      vus: 100,
      duration: "30m",
      tags: { scenario: "steady_state" },
      exec: "steadyState",
    },

    // Peak Load Test
    peak_load: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "5m", target: 500 }, // Ramp up
        { duration: "15m", target: 500 }, // Stay at peak
        { duration: "5m", target: 0 }, // Ramp down
      ],
      tags: { scenario: "peak_load" },
      exec: "peakLoad",
      startTime: "35m", // Start after steady_state
    },

    // Spike Test
    spike_test: {
      executor: "ramping-vus",
      startVUs: 100,
      stages: [
        { duration: "1m", target: 100 }, // Baseline
        { duration: "30s", target: 1000 }, // Spike up
        { duration: "2m", target: 1000 }, // Hold spike
        { duration: "30s", target: 100 }, // Spike down
        { duration: "1m", target: 100 }, // Back to baseline
        { duration: "30s", target: 1000 }, // Second spike
        { duration: "2m", target: 1000 },
        { duration: "30s", target: 100 },
      ],
      tags: { scenario: "spike_test" },
      exec: "spikeTest",
      startTime: "60m", // Start after peak_load
    },
  },

  thresholds: {
    // Global thresholds
    http_req_duration: ["p(95)<500", "p(99)<1000"],
    http_req_failed: ["rate<0.01"], // Error rate < 1%
    errors: ["rate<0.01"],

    // Endpoint-specific thresholds
    "http_req_duration{endpoint:login}": ["p(95)<150", "p(99)<300"],
    "http_req_duration{endpoint:payment}": ["p(95)<300", "p(99)<600"],
    "http_req_duration{endpoint:patient}": ["p(95)<100", "p(99)<200"],
    "http_req_duration{endpoint:dashboard}": ["p(95)<500", "p(99)<1000"],

    // Custom metrics thresholds
    login_duration: ["p(95)<150"],
    payment_duration: ["p(95)<300"],
    patient_duration: ["p(95)<100"],
    dashboard_duration: ["p(95)<500"],
  },
};

// Helper function to get auth token
function getAuthToken() {
  const loginPayload = JSON.stringify({
    email: "test@healthcare.com",
    password: "TestPassword123!",
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
    },
    tags: { endpoint: "login" },
  };

  const loginRes = http.post(`${BASE_URL}/auth/login`, loginPayload, params);

  loginDuration.add(loginRes.timings.duration);
  requestCounter.add(1);

  check(loginRes, {
    "login successful": (r) => r.status === 200,
    "has access token": (r) => r.json("accessToken") !== undefined,
  }) || errorRate.add(1);

  return loginRes.json("accessToken");
}

// Steady State Test Scenario
export function steadyState() {
  const token = getAuthToken();

  const params = {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };

  // 40% - Patient lookups
  if (Math.random() < 0.4) {
    const patientId = Math.floor(Math.random() * 10000) + 1;
    const res = http.get(`${BASE_URL}/patients/${patientId}`, {
      ...params,
      tags: { endpoint: "patient" },
    });

    patientDuration.add(res.timings.duration);
    requestCounter.add(1);

    check(res, {
      "patient lookup successful": (r) => r.status === 200 || r.status === 404,
    }) || errorRate.add(1);
  }

  // 20% - Dashboard analytics
  else if (Math.random() < 0.6) {
    const res = http.get(`${BASE_URL}/analytics/dashboard`, {
      ...params,
      tags: { endpoint: "dashboard" },
    });

    dashboardDuration.add(res.timings.duration);
    requestCounter.add(1);

    check(res, {
      "dashboard load successful": (r) => r.status === 200,
      "has revenue data": (r) => r.json("revenue") !== undefined,
    }) || errorRate.add(1);
  }

  // 15% - Payment creation
  else if (Math.random() < 0.75) {
    const paymentPayload = JSON.stringify({
      facilityId: Math.floor(Math.random() * 24) + 1,
      patientId: Math.floor(Math.random() * 10000) + 1,
      amount: (Math.random() * 500 + 50).toFixed(2),
      method: "stripe",
    });

    const res = http.post(`${BASE_URL}/payments/create`, paymentPayload, {
      ...params,
      tags: { endpoint: "payment" },
    });

    paymentDuration.add(res.timings.duration);
    requestCounter.add(1);

    check(res, {
      "payment created": (r) => r.status === 200 || r.status === 201,
      "has transaction id": (r) => r.json("id") !== undefined,
    }) || errorRate.add(1);
  }

  // 15% - Transaction history
  else if (Math.random() < 0.9) {
    const res = http.get(`${BASE_URL}/transactions?limit=50`, {
      ...params,
      tags: { endpoint: "transactions" },
    });

    requestCounter.add(1);

    check(res, {
      "transactions retrieved": (r) => r.status === 200,
    }) || errorRate.add(1);
  }

  // 10% - Health check
  else {
    const res = http.get(`${BASE_URL}/health`, {
      tags: { endpoint: "health" },
    });

    requestCounter.add(1);

    check(res, {
      "health check passed": (r) => r.status === 200,
      "database healthy": (r) => r.json("database") === "healthy",
    }) || errorRate.add(1);
  }

  sleep(1); // 1 second think time
}

// Peak Load Test Scenario
export function peakLoad() {
  steadyState(); // Reuse steady state logic with more users
}

// Spike Test Scenario
export function spikeTest() {
  // Aggressive testing with minimal think time
  const token = getAuthToken();

  const params = {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };

  // Rapid fire requests
  const requests = [
    ["GET", `${BASE_URL}/patients/1`, "patient"],
    ["GET", `${BASE_URL}/analytics/dashboard`, "dashboard"],
    ["GET", `${BASE_URL}/transactions?limit=10`, "transactions"],
  ];

  requests.forEach(([method, url, endpoint]) => {
    const res = http[method.toLowerCase()](url, {
      ...params,
      tags: { endpoint },
    });

    requestCounter.add(1);

    check(res, {
      [`${endpoint} request successful`]: (r) => r.status === 200,
    }) || errorRate.add(1);
  });

  sleep(0.1); // Minimal think time for spike test
}

// Setup function (runs once per VU)
export function setup() {
  console.log("Starting performance tests...");
  console.log(`Base URL: ${BASE_URL}`);

  // Health check before starting
  const healthRes = http.get(`${BASE_URL}/health`);
  if (healthRes.status !== 200) {
    console.error("Health check failed! Aborting tests.");
    return null;
  }

  console.log("Health check passed. Beginning tests...");
  return { startTime: new Date() };
}

// Teardown function (runs once after all VUs finish)
export function teardown(data) {
  const endTime = new Date();
  const duration = (endTime - data.startTime) / 1000;

  console.log("=".repeat(60));
  console.log("Performance Test Summary");
  console.log("=".repeat(60));
  console.log(`Total Duration: ${duration}s`);
  console.log("Check k6 output above for detailed metrics");
  console.log("=".repeat(60));
}

// Export default for single scenario execution
export default steadyState;
