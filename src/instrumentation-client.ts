import * as Sentry from "@sentry/nextjs";
import { getSentrySharedOptions } from "@/lib/monitoring/sentry-options";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  ...getSentrySharedOptions(),
  // Session Replay intentionally disabled for Launch Gate privacy.
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
