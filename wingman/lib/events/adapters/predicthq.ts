import { fetchWithBackoff } from "@/lib/events/fetch";
import { parseClock, wallTimeInZoneToUtc } from "@/lib/events/timezone";
import { addCalendarDays, miamiCalendarDate } from "@/lib/events/timezone";
import {
  MIAMI_TIMEZONE,
  SYNC_LOOKAHEAD_DAYS,
  type AdapterContext,
  type AdapterFetchResult,
  type EventAdapter,
  type NormalizedIncomingEvent,
} from "@/lib/events/types";

const PHQ_URL = "https://api.predicthq.com/v1/events/";

type PredictHqEvent = {
  id?: string;
  title?: string;
  category?: string;
  start?: string;
  end?: string;
  start_local?: string;
  timezone?: string;
  cancelled?: boolean;
  entities?: Array<{ name?: string; type?: string }>;
  predicted_event_spend?: number;
};

function mapPredictHqEvent(raw: PredictHqEvent): NormalizedIncomingEvent | null {
  const id = raw.id?.trim();
  const name = raw.title?.trim();
  if (!id || !name) return null;
  const venue =
    raw.entities?.find((entity) => entity.type === "venue")?.name?.trim() || "Miami";
  const local = raw.start_local || raw.start;
  if (!local) return null;
  const date = local.slice(0, 10);
  const timePart = local.includes("T") ? local.slice(11, 16) : "23:00";
  const clock = parseClock(timePart);
  const startsAt = wallTimeInZoneToUtc(date, clock.hour, clock.minute);
  const officialSourceUrl = `https://predicthq.com/events/${id}`;
  return {
    sourceSlug: "predicthq",
    externalId: id,
    name,
    performer: null,
    venueName: venue,
    neighborhood: "Miami",
    area: "Miami",
    localDate: date,
    localTimeText: clock.text,
    startsAt,
    endsAt: raw.end ? new Date(raw.end) : null,
    timezone: MIAMI_TIMEZONE,
    category: raw.category || "Event",
    musicGenre: raw.category === "concerts" ? "Live music" : null,
    eventType: raw.category ?? null,
    ageRequirement: "See source",
    officialSourceUrl,
    priceMinCents: null,
    priceMaxCents: null,
    priceText: null,
    imageUrl: null,
    imageUsageVerified: false,
    imageAttribution: null,
    cancelled: Boolean(raw.cancelled),
    raw: raw as Record<string, unknown>,
  };
}

export const predictHqAdapter: EventAdapter = {
  slug: "predicthq",
  name: "PredictHQ",
  enabled: true,
  async fetch(ctx: AdapterContext): Promise<AdapterFetchResult> {
    const token = ctx.predictHqToken?.trim() || null;
    if (!token) {
      return {
        status: "skipped",
        reason: "PREDICTHQ_TOKEN missing; PredictHQ adapter skipped.",
      };
    }

    const fetchImpl = ctx.fetchImpl ?? fetch;
    const start = miamiCalendarDate(ctx.now);
    const end = addCalendarDays(start, SYNC_LOOKAHEAD_DAYS);
    const url = new URL(PHQ_URL);
    url.searchParams.set("within", "40km@25.7617,-80.1918");
    url.searchParams.set("start.gte", start);
    url.searchParams.set("start.lte", end);
    url.searchParams.set("category", "concerts,festivals,performing-arts,community");
    url.searchParams.set("limit", "50");

    const response = await fetchWithBackoff(
      url.toString(),
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
      { fetchImpl, maxRetries: 4 },
    );

    if (response.status === 429) {
      return {
        status: "failed",
        error: "PredictHQ rate-limited the request after retries.",
        retryable: true,
      };
    }
    if (!response.ok) {
      return {
        status: "failed",
        error: `PredictHQ HTTP ${response.status}`,
        retryable: response.status >= 500,
      };
    }

    const payload = (await response.json()) as { results?: PredictHqEvent[] };
    const events = (payload.results ?? [])
      .map(mapPredictHqEvent)
      .filter((item): item is NormalizedIncomingEvent => item != null);
    return { status: "ok", events };
  },
};

export { mapPredictHqEvent };
