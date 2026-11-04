/**
 * App monitoring wrapper backed by @sentry/nextjs when DSN is configured.
 * Never attach addresses, payment details, auth tokens, or customer secrets.
 */
import * as Sentry from "@sentry/nextjs";

const SENSITIVE_KEY =
  /(address|payment|card|token|secret|password|authorization|cookie|ssn|phone|email)/i;

function scrubContext(
  context?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (!context) return undefined;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(context)) {
    if (SENSITIVE_KEY.test(key)) continue;
    out[key] = value;
  }
  return Object.keys(out).length ? out : undefined;
}

export function captureException(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  if (process.env.NODE_ENV === "development") {
    console.error("[monitoring]", error, scrubContext(context) ?? "");
  }

  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  const scrubbed = scrubContext(context);
  Sentry.withScope((scope) => {
    if (scrubbed) {
      scope.setExtras(scrubbed);
    }
    Sentry.captureException(error);
  });
}

export function captureMessage(
  message: string,
  context?: Record<string, unknown>,
): void {
  if (process.env.NODE_ENV === "development") {
    console.info("[monitoring]", message, scrubContext(context) ?? "");
  }

  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  const scrubbed = scrubContext(context);
  Sentry.withScope((scope) => {
    if (scrubbed) {
      scope.setExtras(scrubbed);
    }
    Sentry.captureMessage(message);
  });
}
