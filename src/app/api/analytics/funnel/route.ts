import { z } from "zod";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { checkRateLimit, clientIpFromRequest } from "@/lib/api/rate-limit";
import { BOOKING_ANALYTICS_EVENTS } from "@/lib/analytics/booking-funnel";
import {
  classifyBrowserCategory,
  classifyDeviceCategory,
  isAllowedFunnelEvent,
  persistFunnelEvent,
} from "@/lib/pricing/funnel-events";

const eventSchema = z.object({
  eventName: z.string().trim().min(1).max(64),
  anonymousSessionId: z.string().trim().min(8).max(128).optional(),
  bookingId: z.string().uuid().optional(),
  marketId: z.string().trim().max(64).optional(),
  utm: z
    .object({
      source: z.string().trim().max(64).optional(),
      medium: z.string().trim().max(64).optional(),
      campaign: z.string().trim().max(128).optional(),
      content: z.string().trim().max(128).optional(),
      term: z.string().trim().max(128).optional(),
    })
    .optional(),
  deviceCategory: z.enum(["mobile", "tablet", "desktop", "unknown"]).optional(),
  browserCategory: z
    .enum(["chrome", "safari", "firefox", "edge", "other", "unknown"])
    .optional(),
  props: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
});

export async function POST(request: Request) {
  const ip = clientIpFromRequest(request);
  const limit = checkRateLimit(`funnel:event:${ip}`, 120, 60_000);
  if (!limit.allowed) {
    return jsonError("Too many analytics events.", 429, "RATE_LIMITED");
  }

  try {
    const body = await request.json();
    const parsed = eventSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid event.", 400);
    }

    if (!isAllowedFunnelEvent(parsed.data.eventName)) {
      return jsonError(
        `Unknown event. Allowed: ${BOOKING_ANALYTICS_EVENTS.slice(0, 5).join(", ")}…`,
        400,
      );
    }

    const ua = request.headers.get("user-agent");
    const ok = await persistFunnelEvent({
      ...parsed.data,
      deviceCategory:
        parsed.data.deviceCategory ?? classifyDeviceCategory(ua),
      browserCategory:
        parsed.data.browserCategory ?? classifyBrowserCategory(ua),
    });

    // Always 202 — analytics must not break UX; empty env = accepted but not stored.
    return jsonSuccess({ stored: ok }, 202);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Unable to record event.",
      500,
    );
  }
}
