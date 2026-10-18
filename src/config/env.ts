import { z } from "zod";

/** Server-only environment variables. Never import in client components. */
const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  EMAIL_PROVIDER: z.enum(["log", "resend", "postmark"]).default("log"),
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(1).optional(),
  SMS_PROVIDER: z.enum(["log", "twilio"]).default("log"),
  TWILIO_ACCOUNT_SID: z.string().min(1).optional(),
  TWILIO_AUTH_TOKEN: z.string().min(1).optional(),
  TWILIO_FROM: z.string().min(1).optional(),
  DEPOSIT_PERCENT: z.coerce.number().min(1).max(100).optional(),
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.string().min(1).optional(),
  SENTRY_RELEASE: z.string().min(1).optional(),
  ADMIN_BOOTSTRAP_EMAIL: z.string().email().optional(),
});

/** Public environment variables safe for the browser. */
const clientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("MaidLinx"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_DEPOSIT_PERCENT: z.coerce.number().min(1).max(100).optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;

function formatZodError(label: string, error: z.ZodError): string {
  return `Invalid ${label} environment variables:\n${error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("\n")}`;
}

export function getServerEnv(): ServerEnv {
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(formatZodError("server", parsed.error));
  }
  return parsed.data;
}

export function getClientEnv(): ClientEnv {
  const parsed = clientSchema.safeParse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_DEPOSIT_PERCENT: process.env.NEXT_PUBLIC_DEPOSIT_PERCENT,
  });
  if (!parsed.success) {
    throw new Error(formatZodError("client", parsed.error));
  }
  return parsed.data;
}

/** Production public origin (OG/Twitter crawlers, canonical brand URL). */
export const PRODUCTION_SITE_URL = "https://maidlinx.com";

/**
 * Runtime site origin (auth redirects, Connect return URLs, local app links).
 * Prefer NEXT_PUBLIC_SITE_URL, then NEXT_PUBLIC_APP_URL.
 * Production fallback: https://maidlinx.com — local: http://localhost:3001
 */
export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.NODE_ENV === "production"
      ? PRODUCTION_SITE_URL
      : "http://localhost:3001")
  );
}

/**
 * Absolute origin for SEO / Open Graph / Twitter metadata.
 * Never emits localhost — social crawlers need the production public URL even
 * when local `.env` points NEXT_PUBLIC_* at http://localhost:3001.
 */
export function getMetadataSiteUrl(): string {
  const configured =
    nonEmpty(process.env.NEXT_PUBLIC_SITE_URL) ??
    nonEmpty(process.env.NEXT_PUBLIC_APP_URL);
  if (configured && !isLocalhostUrl(configured)) {
    return configured.replace(/\/$/, "");
  }
  return PRODUCTION_SITE_URL;
}

function nonEmpty(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function isLocalhostUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host === "localhost" || host === "127.0.0.1";
  } catch {
    return false;
  }
}

/** Public Supabase URL for browser + server clients. */
export function getSupabaseUrl(): string | undefined {
  return nonEmpty(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

/**
 * Publishable/anon key for browser + cookie SSR clients.
 * Prefers legacy ANON_KEY; falls back to PUBLISHABLE_KEY if present.
 * Never reads service_role.
 */
export function getSupabaseAnonKey(): string | undefined {
  return (
    nonEmpty(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ??
    nonEmpty(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
  );
}

export function hasSupabaseEnv(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

export function hasStripeEnv(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
}
