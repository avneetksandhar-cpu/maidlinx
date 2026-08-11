import { getStripeServer } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface StripePayout {
  id: string;
  amountCents: number;
  currency: string;
  status: string;
  arrivalDate: string | null;
  method: string;
  description: string | null;
  createdAt: string;
}

export async function listStripePayouts(limit = 25): Promise<StripePayout[]> {
  try {
    const stripe = getStripeServer();
    const payouts = await stripe.payouts.list({ limit });

    return payouts.data.map((payout) => ({
      id: payout.id,
      amountCents: payout.amount,
      currency: payout.currency.toUpperCase(),
      status: payout.status,
      arrivalDate: payout.arrival_date
        ? new Date(payout.arrival_date * 1000).toISOString()
        : null,
      method: payout.method,
      description: payout.description,
      createdAt: new Date(payout.created * 1000).toISOString(),
    }));
  } catch {
    return [];
  }
}

export async function listConnectAccounts(): Promise<
  Array<{ profileId: string; name: string; connectId: string | null }>
> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, stripe_connect_id")
    .eq("role", "professional")
    .not("stripe_connect_id", "is", null);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      profileId: String(r.id),
      name: [r.first_name, r.last_name].filter(Boolean).join(" ") || "Pro",
      connectId: r.stripe_connect_id ? String(r.stripe_connect_id) : null,
    };
  });
}
