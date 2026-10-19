import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/http";
import { rankMatches } from "@/lib/booking-flow/rank-matches";
import type { BudgetId, ExperienceType, Vibe } from "@/lib/booking-flow/types";
import { BUDGETS, EXPERIENCE_TYPES, VIBES } from "@/lib/booking-flow/types";
import { loadMappedPublicEvents } from "@/lib/marketplace/public-feed";

export const runtime = "nodejs";

function asType<T extends string>(value: string | null, allowed: readonly T[]): T | null {
  if (!value) return null;
  return allowed.includes(value as T) ? (value as T) : null;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const date = url.searchParams.get("date") || "";
    const destination = url.searchParams.get("destination") || "";
    const partySize = Number(url.searchParams.get("partySize") || 4);
    const events = await loadMappedPublicEvents();
    const matches = rankMatches(events, {
      date,
      destination,
      experienceType: asType(url.searchParams.get("experienceType"), EXPERIENCE_TYPES) as ExperienceType | null,
      vibe: asType(url.searchParams.get("vibe"), VIBES) as Vibe | null,
      partySize: Number.isInteger(partySize) ? partySize : 4,
      budget: asType(url.searchParams.get("budget"), BUDGETS) as BudgetId | null,
    });
    return NextResponse.json({
      matches,
      bookableCount: matches.filter((item) => item.bookable).length,
      note: "Discovery listings can appear here. Request Booking still creates Wingman night service.",
    });
  } catch {
    return jsonError("Matches are unavailable right now.", 503);
  }
}
