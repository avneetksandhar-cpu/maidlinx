import { loadStripe, type Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripeBrowser(): Promise<Stripe | null> {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return Promise.resolve(null);
  }

  stripePromise ??= loadStripe(publishableKey);
  return stripePromise;
}

export function hasStripeBrowserEnv(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
}
