export type ImportedEventRow = {
  externalId: string;
  name: string;
  venue: string;
  eventDate: string;
  startTime: string;
  area: string;
  category: string;
  age: string;
  officialSource: string;
  lastVerified: string;
  availableServices: string[];
  wingmanCoverage: string;
  bookingStatus: string;
  internalNotes: string;
};

export type EventImportError = { row: number; message: string };

const HEADER_ALIASES: Record<string, keyof Omit<ImportedEventRow, "availableServices"> | "availableServices"> =
  {
    "event id": "externalId",
    event_id: "externalId",
    external_id: "externalId",
    externalid: "externalId",
    id: "externalId",
    "event name": "name",
    event_name: "name",
    name: "name",
    event: "name",
    venue: "venue",
    "venue name": "venue",
    venue_name: "venue",
    "event date": "eventDate",
    event_date: "eventDate",
    date: "eventDate",
    local_date: "eventDate",
    "start time": "startTime",
    start_time: "startTime",
    time: "startTime",
    local_time: "startTime",
    local_time_text: "startTime",
    area: "area",
    neighborhood: "area",
    category: "category",
    age: "age",
    "age requirement": "age",
    age_requirement: "age",
    "official source": "officialSource",
    official_source: "officialSource",
    official_source_url: "officialSource",
    url: "officialSource",
    source: "officialSource",
    "last verified": "lastVerified",
    last_verified: "lastVerified",
    source_verified_at: "lastVerified",
    "available services": "availableServices",
    available_services: "availableServices",
    services: "availableServices",
    "wingman coverage": "wingmanCoverage",
    wingman_coverage: "wingmanCoverage",
    coverage: "wingmanCoverage",
    "booking status": "bookingStatus",
    booking_status: "bookingStatus",
    "internal notes": "internalNotes",
    internal_notes: "internalNotes",
    notes: "internalNotes",
  };

export function normalizeHeader(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      row.push(current.trim());
      current = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(current.trim());
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      current = "";
      continue;
    }
    current += char;
  }
  row.push(current.trim());
  if (row.some((cell) => cell.length > 0)) rows.push(row);
  return rows;
}

export function mapImportRows(table: string[][]): {
  rows: ImportedEventRow[];
  errors: EventImportError[];
} {
  if (table.length < 2) {
    return { rows: [], errors: [{ row: 1, message: "File needs a header row and at least one event." }] };
  }
  const headers = table[0].map(normalizeHeader);
  const indexes: Partial<Record<string, number>> = {};
  headers.forEach((header, index) => {
    const mapped = HEADER_ALIASES[header];
    if (mapped) indexes[mapped] = index;
  });

  const required: Array<keyof ImportedEventRow> = ["name", "venue", "eventDate", "officialSource"];
  const missing = required.filter((key) => indexes[key] == null);
  if (missing.length > 0) {
    return {
      rows: [],
      errors: [{ row: 1, message: `Missing required columns: ${missing.join(", ")}.` }],
    };
  }

  const rows: ImportedEventRow[] = [];
  const errors: EventImportError[] = [];

  table.slice(1).forEach((cells, offset) => {
    const line = offset + 2;
    const get = (key: string) => {
      const index = indexes[key];
      return index == null ? "" : String(cells[index] ?? "").trim();
    };
    const name = get("name");
    const venue = get("venue");
    const eventDate = normalizeDate(get("eventDate"));
    const officialSource = get("officialSource");
    if (!name || !venue || !eventDate || !officialSource) {
      errors.push({
        row: line,
        message: "Name, venue, date, and official source URL are required.",
      });
      return;
    }
    if (!/^https?:\/\//i.test(officialSource)) {
      errors.push({ row: line, message: "Official source must be an http(s) URL." });
      return;
    }
    const startTime = get("startTime") || "11:00 PM";
    const externalId = get("externalId") || `IMP-${slug(name)}-${eventDate}`;
    const services = get("availableServices")
      .split(/[;,|]/)
      .map((part) => part.trim())
      .filter(Boolean);
    rows.push({
      externalId,
      name,
      venue,
      eventDate,
      startTime,
      area: get("area") || "Miami",
      category: get("category") || "Nightlife",
      age: get("age") || "21+",
      officialSource,
      lastVerified: normalizeDate(get("lastVerified")) || todayDate(),
      availableServices: services,
      wingmanCoverage: get("wingmanCoverage") || "Unassigned",
      bookingStatus: "Awaiting Wingman inventory",
      internalNotes: get("internalNotes"),
    });
  });

  return { rows, errors };
}

export function parseEventImportTable(text: string): {
  rows: ImportedEventRow[];
  errors: EventImportError[];
} {
  return mapImportRows(parseCsv(text));
}

export function parseLocalTime(raw: string): { hour: number; minute: number; text: string } {
  const text = raw.trim();
  const match = text.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return { hour: 23, minute: 0, text: text || "11:00 PM" };
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const mer = match[3]?.toUpperCase();
  if (mer === "PM" && hour < 12) hour += 12;
  if (mer === "AM" && hour === 12) hour = 0;
  if (!mer && hour <= 12 && text.toLowerCase().includes("pm")) hour = hour === 12 ? 12 : hour + 12;
  return { hour, minute, text: text || `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}` };
}

function normalizeDate(raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const us = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (us) return `${us[3]}-${us[1].padStart(2, "0")}-${us[2].padStart(2, "0")}`;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return "";
  return new Date(parsed).toISOString().slice(0, 10);
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "event";
}

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}
