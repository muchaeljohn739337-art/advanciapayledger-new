// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
// ⚠️ HIPAA COMPLIANT - DO NOT enable sendDefaultPii

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://0a37d7fc25f561b3efeae2909bf2ea5c@o4510804348698624.ingest.us.sentry.io/4510804351057920",
  environment: process.env.NODE_ENV || "development",

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Enable structured logging
  enableLogs: true,

  // ⚠️ HIPAA COMPLIANCE: DO NOT enable sendDefaultPii
  // sendDefaultPii: false, // Explicitly disabled for HIPAA

  integrations: [
    // Console logging integration
    Sentry.consoleLoggingIntegration({
      levels: ["log", "warn", "error"],
    }),
  ],

  // HIPAA-compliant data filtering
  beforeSend(event, _hint) {
    // Remove PII
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }

    // Filter sensitive request data
    if (event.request) {
      if (event.request.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }

      if (
        event.request.query_string &&
        typeof event.request.query_string === "string"
      ) {
        event.request.query_string = event.request.query_string
          .replace(/token=[^&]*/gi, "token=[FILTERED]")
          .replace(/password=[^&]*/gi, "password=[FILTERED]")
          .replace(/api_key=[^&]*/gi, "api_key=[FILTERED]");
      }
    }

    // Filter sensitive data from extra context
    if (event.extra) {
      const sensitiveKeys = [
        "password",
        "token",
        "apiKey",
        "secret",
        "ssn",
        "dob",
      ];
      sensitiveKeys.forEach((key) => {
        if (event.extra && event.extra[key]) {
          event.extra[key] = "[FILTERED]";
        }
      });
    }

    return event;
  },
});

console.log("✅ Server-side Sentry initialized (HIPAA-compliant)");

// Export logger for use in server components
export const { logger } = Sentry;
