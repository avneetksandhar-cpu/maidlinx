import { createHash, timingSafeEqual } from "node:crypto";
import { isResponse, requireOperator } from "@/lib/api/http";
import type { AuthUser } from "@/lib/auth/types";

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

export function eventSyncSecretConfigured(): boolean {
  return Boolean(process.env.EVENT_SYNC_SECRET?.trim());
}

export function eventSyncSecretMatches(provided: string | null): boolean {
  const expected = process.env.EVENT_SYNC_SECRET?.trim();
  if (!expected || !provided) return false;
  const a = digest(provided.trim());
  const b = digest(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function readSyncSecretFromRequest(request: Request): string | null {
  const header = request.headers.get("authorization") ?? request.headers.get("x-event-sync-secret");
  if (!header) {
    const url = new URL(request.url);
    return url.searchParams.get("secret");
  }
  return header.startsWith("Bearer ") ? header.slice(7) : header;
}

export async function authorizeEventSync(
  request: Request,
): Promise<{ ok: true; actor: "secret" | "admin"; user?: AuthUser } | { ok: false; status: number; error: string }> {
  const provided = readSyncSecretFromRequest(request);
  if (eventSyncSecretMatches(provided)) {
    return { ok: true, actor: "secret" };
  }
  const user = await requireOperator();
  if (!isResponse(user)) {
    return { ok: true, actor: "admin", user };
  }
  if (!eventSyncSecretConfigured()) {
    return { ok: false, status: 503, error: "EVENT_SYNC_SECRET is not configured and no admin session is present." };
  }
  return { ok: false, status: 401, error: "Event sync requires EVENT_SYNC_SECRET or an admin session." };
}

export function ticketmasterApiKey(): string | null {
  return process.env.TICKETMASTER_API_KEY?.trim() || null;
}

export function predictHqToken(): string | null {
  return process.env.PREDICTHQ_TOKEN?.trim() || null;
}
