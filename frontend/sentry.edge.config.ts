// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
// ⚠️ HIPAA COMPLIANT - DO NOT enable sendDefaultPii

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://0a37d7fc25f561b3efeae2909bf2ea5c@o4510804348698624.ingest.us.sentry.io/4510804351057920",
  environment: process.env.NODE_ENV || "development",

  // Performance monitoring (lighter for edge)
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Enable structured logging
  enableLogs: true,

  // ⚠️ HIPAA COMPLIANCE: DO NOT enable sendDefaultPii
  // sendDefaultPii: false, // Explicitly disabled for HIPAA

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
    }

    return event;
  },
});

console.log("✅ Edge runtime Sentry initialized (HIPAA-compliant)");
