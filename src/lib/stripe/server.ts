import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripeServer(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable.");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, {
      typescript: true,
    });
  }

  return stripeClient;
}

export const stripeConfig = {
  currency: "usd",
  applicationFeePercent: 15,
} as const;
