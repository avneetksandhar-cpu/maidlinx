/**
 * Launch waitlist persistence (service-role). Never invents subscribers.
 */

import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import type { WaitlistSignupInput } from "@/lib/waitlist/schema";

export type WaitlistEntry = {
  id: string;
  email: string;
  name: string | null;
  marketId: string | null;
  source: string | null;
  page: string | null;
  createdAt: string;
};

export type WaitlistJoinResult =
  | { ok: true; id: string; alreadyJoined: boolean }
  | { ok: false; reason: string };

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function joinLaunchWaitlist(
  input: WaitlistSignupInput,
): Promise<WaitlistJoinResult> {
  if (!hasAdminEnv()) {
    return { ok: false, reason: "Waitlist storage is not configured." };
  }

  const email = normalizeEmail(input.email);
  const supabase = createAdminClient();

  const { data: existing, error: lookupError } = await supabase
    .from("launch_waitlist")
    .select("id")
    .ilike("email", email)
    .maybeSingle();

  if (lookupError && !/launch_waitlist|does not exist|schema cache/i.test(lookupError.message)) {
    return { ok: false, reason: "Unable to join waitlist right now." };
  }

  if (existing && (existing as { id?: string }).id) {
    return {
      ok: true,
      id: String((existing as { id: string }).id),
      alreadyJoined: true,
    };
  }

  const { data, error } = await supabase
    .from("launch_waitlist")
    .insert({
      email,
      name: input.name,
      market_id: input.marketId,
      source: input.source,
      page: input.page,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    if (/duplicate|unique/i.test(error.message)) {
      const { data: again } = await supabase
        .from("launch_waitlist")
        .select("id")
        .ilike("email", email)
        .maybeSingle();
      if (again && (again as { id?: string }).id) {
        return {
          ok: true,
          id: String((again as { id: string }).id),
          alreadyJoined: true,
        };
      }
    }
    if (/launch_waitlist|does not exist|schema cache/i.test(error.message)) {
      return {
        ok: false,
        reason: "Waitlist is not ready yet. Apply migration 00033_launch_waitlist.",
      };
    }
    return { ok: false, reason: "Unable to join waitlist right now." };
  }

  const id = data && (data as { id?: string }).id;
  if (!id) {
    return { ok: false, reason: "Unable to join waitlist right now." };
  }

  return { ok: true, id: String(id), alreadyJoined: false };
}

export async function listLaunchWaitlist(limit = 100): Promise<{
  items: WaitlistEntry[];
  count: number | null;
  available: boolean;
  gapReason?: string;
}> {
  if (!hasAdminEnv()) {
    return {
      items: [],
      count: null,
      available: false,
      gapReason: "Database not configured.",
    };
  }

  try {
    const supabase = createAdminClient();
    const [listRes, countRes] = await Promise.all([
      supabase
        .from("launch_waitlist")
        .select("id, email, name, market_id, source, page, created_at")
        .order("created_at", { ascending: false })
        .limit(limit),
      supabase.from("launch_waitlist").select("*", { count: "exact", head: true }),
    ]);

    if (listRes.error) {
      if (/launch_waitlist|does not exist|schema cache/i.test(listRes.error.message)) {
        return {
          items: [],
          count: null,
          available: false,
          gapReason: "Apply migration 00033_launch_waitlist.",
        };
      }
      return {
        items: [],
        count: null,
        available: false,
        gapReason: listRes.error.message,
      };
    }

    const items = (listRes.data ?? []).map((raw) => {
      const row = raw as Record<string, unknown>;
      return {
        id: String(row.id),
        email: String(row.email),
        name: row.name ? String(row.name) : null,
        marketId: row.market_id ? String(row.market_id) : null,
        source: row.source ? String(row.source) : null,
        page: row.page ? String(row.page) : null,
        createdAt: String(row.created_at),
      };
    });

    return {
      items,
      count: countRes.count ?? items.length,
      available: true,
    };
  } catch (err) {
    return {
      items: [],
      count: null,
      available: false,
      gapReason: err instanceof Error ? err.message : "List failed.",
    };
  }
}
