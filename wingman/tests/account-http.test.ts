import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { seedEmailForRole } from "../db/seed-accounts";

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  try {
    const text = readFileSync(envPath, "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq);
      const value = trimmed.slice(eq + 1);
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // ignore
  }
}

loadEnvLocal();

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3005";
const SEED_PASSWORD = process.env.SEED_PASSWORD ?? "";

const ACCOUNT_GETS = [
  "/api/account",
  "/api/account/me",
  "/api/account/bookings",
  "/api/account/bookings/00000000-0000-0000-0000-000000000000",
  "/api/account/invoices",
  "/api/account/receipts/00000000-0000-0000-0000-000000000000",
  "/api/account/payment-methods",
  "/api/account/support",
];

function cookieFrom(response: Response): string {
  const cookies =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [response.headers.get("set-cookie") ?? ""];
  const session = cookies.find((value) => value.includes("wm_session="));
  if (!session) return "";
  const match = session.match(/wm_session=([^;]+)/);
  return match?.[1] ? `wm_session=${match[1]}` : "";
}

async function login(email: string, password: string) {
  const response = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return { response, cookie: cookieFrom(response) };
}

describe("consumer account HTTP", () => {
  it("returns 401 without a session", async () => {
    for (const path of ACCOUNT_GETS) {
      const response = await fetch(`${BASE}${path}`);
      expect(response.status, path).toBe(401);
    }
    const support = await fetch(`${BASE}/api/account/support`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: "Unauthed" }),
    });
    expect(support.status).toBe(401);
  });

  it.skipIf(!SEED_PASSWORD)("member sees only their own empty-or-real bookings, never invented rows", async () => {
    const { cookie, response } = await login(seedEmailForRole("member"), SEED_PASSWORD);
    expect(response.status).toBe(200);
    expect(cookie).toContain("wm_session=");

    const bookings = await fetch(`${BASE}/api/account/bookings`, { headers: { cookie } });
    expect(bookings.status).toBe(200);
    const nights = (await bookings.json()) as {
      bookings: Array<{ id: string; testLabel: string | null }>;
      emptyCopy: string;
    };
    expect(nights.emptyCopy).toBe("No nights yet");
    expect(nights.bookings.every((item) => item.testLabel === null)).toBe(true);

    const invoices = await fetch(`${BASE}/api/account/invoices`, { headers: { cookie } });
    expect(invoices.status).toBe(200);
    const paid = (await invoices.json()) as { invoices: unknown[] };
    expect(Array.isArray(paid.invoices)).toBe(true);

    const missing = await fetch(`${BASE}/api/account/bookings/00000000-0000-0000-0000-000000000000`, {
      headers: { cookie },
    });
    expect(missing.status).toBe(404);
  });
});
