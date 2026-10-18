/**
 * Shared Sentry init options for client / server / edge.
 * No Session Replay. sendDefaultPii disabled. Never attach payment/PII extras.
 */

export function getSentrySharedOptions() {
  const environment =
    process.env.SENTRY_ENVIRONMENT ||
    process.env.VERCEL_ENV ||
    process.env.NODE_ENV ||
    "development";

  const release =
    process.env.SENTRY_RELEASE ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    undefined;

  return {
    environment,
    ...(release ? { release } : {}),
    sendDefaultPii: false as const,
    // Keep tracing on at a low rate in production; full in non-prod for verification.
    tracesSampleRate: environment === "production" ? 0.1 : 1.0,
  };
}
