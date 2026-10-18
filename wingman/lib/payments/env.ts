const TEST_SECRET_PREFIXES = ["sk_test_", "rk_test_"];
const TEST_PUBLISHABLE_PREFIX = "pk_test_";

export type StripeEnv = {
  secretKey: string;
  publishableKey: string;
  webhookSecret: string;
  mode: "test";
};

export function assertStripeTestMode(secretKey: string): void {
  if (secretKey.startsWith("sk_live_") || secretKey.startsWith("rk_live_")) {
    throw new Error("Live Stripe keys are blocked. Use test-mode keys only.");
  }
  if (!TEST_SECRET_PREFIXES.some((prefix) => secretKey.startsWith(prefix))) {
    throw new Error("STRIPE_SECRET_KEY must be a Stripe test key (sk_test_ or rk_test_).");
  }
}

export function readStripeEnv(
  env: Record<string, string | undefined> = process.env,
): { ok: true; value: StripeEnv } | { ok: false; error: string } {
  const secretKey = env.STRIPE_SECRET_KEY?.trim() ?? "";
  const publishableKey = env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "";
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";

  if (!secretKey || !publishableKey || !webhookSecret) {
    return {
      ok: false,
      error:
        "Stripe test keys are not configured (STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET).",
    };
  }

  try {
    assertStripeTestMode(secretKey);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Invalid Stripe key." };
  }

  if (!publishableKey.startsWith(TEST_PUBLISHABLE_PREFIX)) {
    return { ok: false, error: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must be a pk_test_ key." };
  }

  if (!webhookSecret.startsWith("whsec_")) {
    return { ok: false, error: "STRIPE_WEBHOOK_SECRET must start with whsec_." };
  }

  return {
    ok: true,
    value: { secretKey, publishableKey, webhookSecret, mode: "test" },
  };
}

export function stripeConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return readStripeEnv(env).ok;
}
