import Stripe from "stripe";
import { readStripeEnv } from "@/lib/payments/env";

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  const env = readStripeEnv();
  if (!env.ok) {
    throw new Error(env.error);
  }

  if (!stripeClient) {
    stripeClient = new Stripe(env.value.secretKey, {
      typescript: true,
    });
  }

  return stripeClient;
}

/** @deprecated Use getStripeClient */
export const getStripe = getStripeClient;

export function getStripePublishableKey(): string {
  const env = readStripeEnv();
  if (!env.ok) {
    throw new Error(env.error);
  }
  return env.value.publishableKey;
}
