/**
 * Persist funnel events (privacy-safe). Device category is UX analytics only.
 */

import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import {
  BOOKING_ANALYTICS_EVENTS,
  type BookingFunnelEvent,
} from "@/lib/analytics/booking-funnel";

const ALLOWED = new Set<string>(BOOKING_ANALYTICS_EVENTS as readonly string[]);

const PII_KEYS = /email|phone|address|name|card|ssn|password|token/i;

export type DeviceCategory = "mobile" | "tablet" | "desktop" | "unknown";
export type BrowserCategory =
  | "chrome"
  | "safari"
  | "firefox"
  | "edge"
  | "other"
  | "unknown";

export interface FunnelEventInput {
  eventName: string;
  anonymousSessionId?: string | null;
  profileId?: string | null;
  bookingId?: string | null;
  marketId?: string | null;
  utm?: {
    source?: string | null;
    medium?: string | null;
    campaign?: string | null;
    content?: string | null;
    term?: string | null;
  };
  deviceCategory?: DeviceCategory | null;
  browserCategory?: BrowserCategory | null;
  props?: Record<string, string | number | boolean | null | undefined>;
}

export function sanitizeFunnelProps(
  props: Record<string, string | number | boolean | null | undefined> | undefined,
): Record<string, string | number | boolean | null> {
  if (!props) return {};
  const out: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(props)) {
    if (PII_KEYS.test(key)) continue;
    if (value === undefined) continue;
    if (typeof value === "string" && value.length > 200) {
      out[key] = value.slice(0, 200);
    } else {
      out[key] = value;
    }
  }
  return out;
}

export function isAllowedFunnelEvent(name: string): name is BookingFunnelEvent {
  return ALLOWED.has(name);
}

export async function persistFunnelEvent(input: FunnelEventInput): Promise<boolean> {
  if (!isAllowedFunnelEvent(input.eventName)) return false;
  if (!hasAdminEnv()) return false;

  const supabase = createAdminClient();
  const { error } = await supabase.from("funnel_events").insert({
    event_name: input.eventName,
    anonymous_session_id: input.anonymousSessionId ?? null,
    profile_id: input.profileId ?? null,
    booking_id: input.bookingId ?? null,
    market_id: input.marketId ?? null,
    utm_source: input.utm?.source ?? null,
    utm_medium: input.utm?.medium ?? null,
    utm_campaign: input.utm?.campaign ?? null,
    utm_content: input.utm?.content ?? null,
    utm_term: input.utm?.term ?? null,
    device_category: input.deviceCategory ?? null,
    browser_category: input.browserCategory ?? null,
    props: sanitizeFunnelProps(input.props),
  });

  if (error) {
    if (/funnel_events|does not exist/i.test(error.message)) return false;
    console.error("[funnel_events] insert failed:", error.message);
    return false;
  }
  return true;
}

export function classifyDeviceCategory(userAgent: string | null): DeviceCategory {
  if (!userAgent) return "unknown";
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet/.test(ua)) return "tablet";
  if (/mobi|iphone|android/.test(ua)) return "mobile";
  if (/windows|macintosh|linux/.test(ua)) return "desktop";
  return "unknown";
}

export function classifyBrowserCategory(userAgent: string | null): BrowserCategory {
  if (!userAgent) return "unknown";
  const ua = userAgent.toLowerCase();
  if (ua.includes("edg/")) return "edge";
  if (ua.includes("chrome/") && !ua.includes("edg/")) return "chrome";
  if (ua.includes("safari/") && !ua.includes("chrome/")) return "safari";
  if (ua.includes("firefox/")) return "firefox";
  return "other";
}
