import { z } from "zod";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { checkRateLimit, clientIpFromRequest } from "@/lib/api/rate-limit";
import { requireOwnerSession } from "@/lib/ai/session";
import { waitlistSignupSchema } from "@/lib/waitlist/schema";
import { joinLaunchWaitlist, listLaunchWaitlist } from "@/lib/waitlist/repository";
import { sendWaitlistConfirmationEmail } from "@/lib/waitlist/notify";

export async function POST(request: Request) {
  const ip = clientIpFromRequest(request);
  const limit = checkRateLimit(`waitlist:join:${ip}`, 8, 60_000);
  if (!limit.allowed) {
    return jsonError("Too many waitlist attempts. Try again shortly.", 429, "RATE_LIMITED");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const parsed = waitlistSignupSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.errors[0]?.message ?? "Invalid waitlist signup.", 400);
  }

  const result = await joinLaunchWaitlist(parsed.data);
  if (!result.ok) {
    return jsonError(result.reason, 503, "WAITLIST_UNAVAILABLE");
  }

  // Best-effort confirmation — never fail the signup if email provider is log/down.
  void sendWaitlistConfirmationEmail({
    email: parsed.data.email.trim().toLowerCase(),
    name: parsed.data.name,
    marketId: parsed.data.marketId,
    alreadyJoined: result.alreadyJoined,
  });

  return jsonSuccess(
    {
      joined: true,
      alreadyJoined: result.alreadyJoined,
      message: result.alreadyJoined
        ? "You're already on the list. We'll email you when booking opens."
        : "You're on the list. We'll email you when booking opens.",
    },
    result.alreadyJoined ? 200 : 201,
  );
}

export async function GET(request: Request) {
  try {
    await requireOwnerSession();
  } catch {
    return jsonError("Admin access required.", 401, "UNAUTHORIZED");
  }

  const url = new URL(request.url);
  const limitParsed = z.coerce.number().int().min(1).max(500).safeParse(url.searchParams.get("limit") ?? 100);
  const limit = limitParsed.success ? limitParsed.data : 100;

  const list = await listLaunchWaitlist(limit);
  return jsonSuccess({
    count: list.count,
    items: list.items,
    available: list.available,
    gapReason: list.gapReason ?? null,
  });
}
