/**
 * Sentry-ready monitoring wrapper.
 * Install @sentry/nextjs and set SENTRY_DSN to enable in production.
 */
export function captureException(error: unknown, context?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === "development") {
    console.error("[monitoring]", error, context ?? "");
    return;
  }

  if (process.env.SENTRY_DSN) {
    // Sentry SDK integration added in Phase 9.
    console.error("[monitoring:pending-sentry]", error);
  }
}

export function captureMessage(message: string, context?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === "development") {
    console.info("[monitoring]", message, context ?? "");
  }
}
