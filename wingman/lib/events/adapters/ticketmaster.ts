import { fetchWithBackoff } from "@/lib/events/fetch";
import { makeSyncLog } from "@/lib/events/log";
import { parseClock, wallTimeInZoneToUtc } from "@/lib/events/timezone";
import {
  classifyTicketmasterEvent,
  isAllowedTicketmasterCity,
  neighborhoodFromTicketmasterCity,
  pickAuthorizedTicketmasterImage,
  TICKETMASTER_CITIES,
  type TicketmasterClassification,
  type TicketmasterImage,
  type TicketmasterRejectReason,
} from "@/lib/events/ticketmaster-filter";
import {
  MIAMI_TIMEZONE,
  SYNC_LOOKAHEAD_DAYS,
  type AdapterContext,
  type AdapterFetchResult,
  type EventAdapter,
  type NormalizedIncomingEvent,
} from "@/lib/events/types";
import { addCalendarDays, miamiCalendarDate } from "@/lib/events/timezone";

const TM_URL = "https://app.ticketmaster.com/discovery/v2/events.json";

type TicketmasterEvent = {
  id?: string;
  name?: string;
  url?: string;
  images?: TicketmasterImage[];
  dates?: {
    start?: { localDate?: string; localTime?: string; dateTime?: string };
    end?: { localDate?: string; localTime?: string; dateTime?: string };
    status?: { code?: string };
  };
  classifications?: TicketmasterClassification[];
  priceRanges?: Array<{ min?: number; max?: number; currency?: string }>;
  _embedded?: {
    venues?: Array<{
      name?: string;
      city?: { name?: string };
      state?: { stateCode?: string };
      address?: { line1?: string };
    }>;
    attractions?: Array<{ name?: string }>;
  };
};

function dollarsToCents(value: number | undefined): number | null {
  if (value == null || Number.isNaN(value)) return null;
  return Math.round(value * 100);
}

function priceText(min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null && min !== max) {
    return `$${(min / 100).toFixed(0)}–$${(max / 100).toFixed(0)}`;
  }
  const value = min ?? max ?? 0;
  return value === 0 ? "Free" : `$${(value / 100).toFixed(0)}`;
}

export type MappedTicketmaster = {
  event: NormalizedIncomingEvent | null;
  rejected: TicketmasterRejectReason | null;
  imageFailed: boolean;
};

function mapTicketmasterEvent(raw: TicketmasterEvent): MappedTicketmaster {
  const id = raw.id?.trim();
  const name = raw.name?.trim();
  const venueName = raw._embedded?.venues?.[0]?.name?.trim();
  const localDate = raw.dates?.start?.localDate;
  const url = raw.url?.trim();
  const city = raw._embedded?.venues?.[0]?.city?.name;
  if (!id || !name || !venueName || !localDate || !url) {
    return { event: null, rejected: "missing_required_fields", imageFailed: false };
  }
  if (!/^https?:\/\//i.test(url)) {
    return { event: null, rejected: "missing_required_fields", imageFailed: false };
  }
  if (!isAllowedTicketmasterCity(city)) {
    return { event: null, rejected: "outside_miami", imageFailed: false };
  }

  const classified = classifyTicketmasterEvent({
    name,
    classifications: raw.classifications,
    city,
  });
  if (!classified.ok) {
    return { event: null, rejected: classified.reason, imageFailed: false };
  }

  const localTime = raw.dates?.start?.localTime || "23:00:00";
  const [hourRaw, minuteRaw] = localTime.split(":");
  const clock = parseClock(
    raw.dates?.start?.localTime ? `${hourRaw}:${minuteRaw ?? "00"}` : "11:00 PM",
  );
  const startsAt = wallTimeInZoneToUtc(localDate, clock.hour, clock.minute);
  const endDate = raw.dates?.end?.localDate;
  const endTime = raw.dates?.end?.localTime;
  let endsAt: Date | null = null;
  if (endDate && endTime) {
    const [endHour, endMinute] = endTime.split(":");
    const endClock = parseClock(`${endHour}:${endMinute ?? "00"}`);
    endsAt = wallTimeInZoneToUtc(endDate, endClock.hour, endClock.minute);
  }

  const genre = raw.classifications?.[0]?.genre?.name ?? null;
  const segment = raw.classifications?.[0]?.segment?.name ?? "Music";
  const attraction = raw._embedded?.attractions?.[0]?.name?.trim() ?? null;
  const min = dollarsToCents(raw.priceRanges?.[0]?.min);
  const max = dollarsToCents(raw.priceRanges?.[0]?.max);
  const cancelled = ["cancelled", "canceled"].includes(
    String(raw.dates?.status?.code ?? "").toLowerCase(),
  );
  const picked = pickAuthorizedTicketmasterImage(raw.images);
  const imageUrl = "url" in picked && picked.url ? picked.url : null;
  const imageFailed = "failed" in picked ? picked.failed : false;
  const imageAttribution = imageUrl ? "Ticketmaster" : null;
  const neighborhood = neighborhoodFromTicketmasterCity(city);

  return {
    event: {
      sourceSlug: "ticketmaster",
      externalId: id,
      name,
      performer: attraction,
      venueName,
      neighborhood,
      area: neighborhood,
      localDate,
      localTimeText: clock.text,
      startsAt,
      endsAt,
      timezone: MIAMI_TIMEZONE,
      category: segment || "Music",
      musicGenre: genre,
      eventType: segment,
      ageRequirement: "See source",
      officialSourceUrl: url,
      priceMinCents: min,
      priceMaxCents: max,
      priceText: priceText(min, max),
      imageUrl,
      imageUsageVerified: Boolean(imageUrl),
      imageAttribution,
      cancelled,
      raw: raw as Record<string, unknown>,
    },
    rejected: null,
    imageFailed,
  };
}

async function fetchCityPage(
  key: string,
  city: string,
  start: string,
  end: string,
  page: number,
  fetchImpl: typeof fetch,
): Promise<
  | { ok: true; events: TicketmasterEvent[]; totalPages: number }
  | { ok: false; status: number }
> {
  const url = new URL(TM_URL);
  url.searchParams.set("apikey", key);
  url.searchParams.set("city", city);
  url.searchParams.set("stateCode", "FL");
  url.searchParams.set("countryCode", "US");
  url.searchParams.set("size", "200");
  url.searchParams.set("page", String(page));
  url.searchParams.set("sort", "date,asc");
  url.searchParams.set("startDateTime", `${start}T00:00:00Z`);
  url.searchParams.set("endDateTime", `${end}T23:59:59Z`);
  url.searchParams.set("includeFamily", "no");

  const response = await fetchWithBackoff(
    url.toString(),
    { headers: { Accept: "application/json" } },
    { fetchImpl, maxRetries: 4 },
  );
  if (!response.ok) return { ok: false, status: response.status };

  const payload = (await response.json()) as {
    _embedded?: { events?: TicketmasterEvent[] };
    page?: { totalPages?: number; number?: number };
  };
  return {
    ok: true,
    events: payload._embedded?.events ?? [],
    totalPages: payload.page?.totalPages ?? 1,
  };
}

export const ticketmasterAdapter: EventAdapter = {
  slug: "ticketmaster",
  name: "Ticketmaster Discovery",
  enabled: true,
  async fetch(ctx: AdapterContext): Promise<AdapterFetchResult> {
    const key = ctx.ticketmasterApiKey?.trim() || null;
    if (!key) {
      return {
        status: "skipped",
        reason: "TICKETMASTER_API_KEY missing; Ticketmaster adapter skipped.",
      };
    }

    const fetchImpl = ctx.fetchImpl ?? fetch;
    const start = miamiCalendarDate(ctx.now);
    const end = addCalendarDays(start, SYNC_LOOKAHEAD_DAYS);
    const events: NormalizedIncomingEvent[] = [];
    const seen = new Set<string>();
    let rejectedCount = 0;
    let failedImageCount = 0;

    for (const city of TICKETMASTER_CITIES) {
      let page = 0;
      let totalPages = 1;
      while (page < totalPages && page < 8) {
        const result = await fetchCityPage(key, city, start, end, page, fetchImpl);
        if (!result.ok) {
          if (result.status === 429) {
            return {
              status: "failed",
              error: "Ticketmaster rate-limited the request after retries.",
              retryable: true,
            };
          }
          return {
            status: "failed",
            error: `Ticketmaster HTTP ${result.status}`,
            retryable: result.status >= 500,
          };
        }
        for (const item of result.events) {
          const mapped = mapTicketmasterEvent(item);
          if (mapped.rejected) {
            rejectedCount += 1;
            continue;
          }
          if (!mapped.event) {
            rejectedCount += 1;
            continue;
          }
          if (seen.has(mapped.event.externalId)) continue;
          seen.add(mapped.event.externalId);
          if (mapped.imageFailed) failedImageCount += 1;
          events.push(mapped.event);
        }
        totalPages = result.totalPages;
        page += 1;
      }
    }

    makeSyncLog("info", "Ticketmaster fetch complete", {
      source: "ticketmaster",
      fetched: events.length,
      rejected: rejectedCount,
      failedImages: failedImageCount,
      cities: TICKETMASTER_CITIES,
    });
    return { status: "ok", events, rejectedCount, failedImageCount };
  },
};

export { mapTicketmasterEvent };
