/** Ticketmaster Discovery: Miami / Miami Beach nightlife + music only. */

export const TICKETMASTER_CITIES = ["Miami", "Miami Beach"] as const;

export const TICKETMASTER_IMAGE_HOSTS = [
  "s1.ticketm.net",
  "s1.ticketmaster.com",
  "media.ticketmaster.com",
  "ticketmaster.com",
  "www.ticketmaster.com",
];

const DENIED_SEGMENTS = new Set([
  "sports",
  "arts & theatre",
  "arts and theatre",
  "film",
]);

const DENIED_GENRE_TOKENS = [
  "sport",
  "sports",
  "theatre",
  "theater",
  "broadway",
  "opera",
  "family",
  "children",
  "kids",
  "comedy",
];

const ALLOWED_SEGMENTS = new Set(["music"]);

const ALLOWED_GENRE_TOKENS = [
  "dance",
  "electronic",
  "house",
  "techno",
  "edm",
  "festival",
  "concert",
  "club",
  "rave",
  "nightlife",
  "pop",
  "rock",
  "hip-hop",
  "hip hop",
  "rap",
  "latin",
  "reggaeton",
  "r&b",
];

const ALLOWED_NAME_TOKENS = [
  "afterparty",
  "after-party",
  "after party",
  "official after",
  "nightlife",
  "nightclub",
  "festival",
  "rave",
  "warehouse",
];

export type TicketmasterClassification = {
  segment?: { name?: string };
  genre?: { name?: string };
  subGenre?: { name?: string };
  family?: boolean | string;
};

export type TicketmasterImage = {
  url?: string;
  ratio?: string;
  width?: number;
  height?: number;
};

export type TicketmasterRejectReason =
  | "missing_required_fields"
  | "outside_miami"
  | "sports"
  | "theatre"
  | "family"
  | "out_of_scope";

export function normalizeCityName(raw: string | undefined | null): string {
  return (raw ?? "")
    .toLowerCase()
    .replace(/,/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isAllowedTicketmasterCity(city: string | undefined | null): boolean {
  const normalized = normalizeCityName(city);
  return normalized === "miami" || normalized === "miami beach";
}

function classificationText(classifications: TicketmasterClassification[] | undefined): string {
  return (classifications ?? [])
    .flatMap((item) => [item.segment?.name, item.genre?.name, item.subGenre?.name])
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function isFamilyClassification(classifications: TicketmasterClassification[] | undefined): boolean {
  return (classifications ?? []).some((item) => item.family === true || item.family === "true");
}

function hasDeniedGenre(text: string): TicketmasterRejectReason | null {
  if (/\b(sport|sports|nba|nfl|mlb|nhl|mls|ufc|boxing|wrestling)\b/.test(text)) return "sports";
  if (/\b(theatre|theater|broadway|opera|musical theatre|musical theater)\b/.test(text)) {
    return "theatre";
  }
  if (/\b(family|children|kids|kid)\b/.test(text)) return "family";
  return null;
}

export function classifyTicketmasterEvent(input: {
  name?: string;
  classifications?: TicketmasterClassification[];
  city?: string;
}): { ok: true } | { ok: false; reason: TicketmasterRejectReason } {
  if (!isAllowedTicketmasterCity(input.city)) {
    return { ok: false, reason: "outside_miami" };
  }

  const classifications = input.classifications ?? [];
  if (isFamilyClassification(classifications)) {
    return { ok: false, reason: "family" };
  }

  const segments = classifications
    .map((item) => item.segment?.name?.toLowerCase().trim())
    .filter((value): value is string => Boolean(value));
  if (segments.some((segment) => DENIED_SEGMENTS.has(segment))) {
    if (segments.some((segment) => segment.includes("sport"))) return { ok: false, reason: "sports" };
    if (segments.some((segment) => segment.includes("theatre") || segment.includes("theater"))) {
      return { ok: false, reason: "theatre" };
    }
    if (segments.some((segment) => segment === "film")) return { ok: false, reason: "out_of_scope" };
  }

  const classText = classificationText(classifications);
  const name = (input.name ?? "").toLowerCase();
  const haystack = `${name} ${classText}`;
  const denied = hasDeniedGenre(haystack);
  if (denied) return { ok: false, reason: denied };

  const music = segments.some((segment) => ALLOWED_SEGMENTS.has(segment));
  const allowedGenre = ALLOWED_GENRE_TOKENS.some((token) => classText.includes(token));
  const allowedName = ALLOWED_NAME_TOKENS.some((token) => name.includes(token));
  const concertLike = music || classText.includes("concert") || name.includes("concert");

  if (music || allowedGenre || allowedName || concertLike) {
    return { ok: true };
  }

  if (DENIED_GENRE_TOKENS.some((token) => haystack.includes(token))) {
    const reason = hasDeniedGenre(haystack);
    return { ok: false, reason: reason ?? "out_of_scope" };
  }

  return { ok: false, reason: "out_of_scope" };
}

export function isAuthorizedTicketmasterImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    return TICKETMASTER_IMAGE_HOSTS.some(
      (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`),
    );
  } catch {
    return false;
  }
}

export function pickAuthorizedTicketmasterImage(
  images: TicketmasterImage[] | undefined,
): { url: string; attribution: string } | { url: null; failed: boolean } {
  const candidates = (images ?? [])
    .map((image) => image.url?.trim())
    .filter((url): url is string => Boolean(url));
  if (candidates.length === 0) return { url: null, failed: false };

  const authorized = (images ?? [])
    .filter((image) => image.url && isAuthorizedTicketmasterImageUrl(image.url))
    .sort((a, b) => (b.width ?? 0) - (a.width ?? 0));
  const preferred =
    authorized.find((image) => image.ratio === "16_9" && (image.width ?? 0) >= 640) ??
    authorized[0];
  if (!preferred?.url) return { url: null, failed: true };
  return { url: preferred.url, attribution: "Ticketmaster" };
}

export function neighborhoodFromTicketmasterCity(city: string | undefined | null): string {
  const normalized = normalizeCityName(city);
  if (normalized === "miami beach") return "Miami Beach";
  return "Miami";
}
