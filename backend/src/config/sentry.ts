import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import { logger } from "../utils/logger";

export function initializeSentry(): void {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    logger.warn("Sentry DSN not configured. Error tracking disabled.");
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || "development",

    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Profiling
    profilesSampleRate: 0.1,

    integrations: [nodeProfilingIntegration()],

    // Filter sensitive data before sending to Sentry
    beforeSend(event, hint) {
      // Remove sensitive user data
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
      }

      // Filter sensitive request data
      if (event.request) {
        // Remove authorization headers
        if (event.request.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }

        // Remove sensitive query parameters
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

    // Ignore certain errors
    ignoreErrors: [
      // Browser extensions
      "top.GLOBALS",
      // Random plugins/extensions
      "originalCreateNotification",
      "canvas.contentDocument",
      "MyApp_RemoveAllHighlights",
      // Facebook borked
      "fb_xd_fragment",
      // ISP optimizing proxy - `Cache-Control: no-transform` seems to reduce this
      "bmi_SafeAddOnload",
      "EBCallBackMessageReceived",
      // See https://stackoverflow.com/questions/49384120/resizeobserver-loop-limit-exceeded
      "ResizeObserver loop limit exceeded",
    ],
  });

  logger.info("✅ Sentry initialized successfully");
}

// Helper function to capture exceptions with context
export function captureException(
  error: Error,
  context?: Record<string, any>,
): void {
  if (context) {
    Sentry.setContext("additional", context);
  }
  Sentry.captureException(error);
}

// Helper function to capture messages
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = "info",
): void {
  Sentry.captureMessage(message, level);
}

// Helper function to set user context (use sparingly, filter PII)
export function setUserContext(userId: string): void {
  Sentry.setUser({ id: userId });
}

// Helper function to clear user context
export function clearUserContext(): void {
  Sentry.setUser(null);
}
