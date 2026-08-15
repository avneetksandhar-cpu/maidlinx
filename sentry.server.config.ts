import * as Sentry from "@sentry/nextjs";
import { getSentrySharedOptions } from "./src/lib/monitoring/sentry-options";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  ...getSentrySharedOptions(),
});
