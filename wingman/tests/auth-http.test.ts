import { randomUUID } from "node:crypto";
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

function cookieFrom(response: Response): string {
  const cookies = typeof response.headers.getSetCookie === "function"
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
  return { response, cookie: cookieFrom(response), payload: await response.json() };
}

describe("auth HTTP flows", () => {
  it("signs up, reads session, logs out", async () => {
    const email = `signup.${randomUUID()}@wingman.test`;
    const password = "SignupPass12";
    const signup = await fetch(`${BASE}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, displayName: "New Member" }),
    });
    expect(signup.status).toBe(200);
    const cookie = cookieFrom(signup);
    expect(cookie).toContain("wm_session=");

    const me = await fetch(`${BASE}/api/auth/me`, { headers: { cookie } });
    expect(me.status).toBe(200);
    const mePayload = (await me.json()) as { user: { email: string; role: string } };
    expect(mePayload.user.email).toBe(email);
    expect(mePayload.user.role).toBe("member");

    const logout = await fetch(`${BASE}/api/auth/logout`, {
      method: "POST",
      headers: { cookie },
    });
    expect(logout.status).toBe(200);

    const after = await fetch(`${BASE}/api/auth/me`, { headers: { cookie } });
    expect(after.status).toBe(401);
  });

  it("rejects login with the wrong password", async () => {
    const email = `login.${randomUUID()}@wingman.test`;
    await fetch(`${BASE}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "SignupPass12", displayName: "Login User" }),
    });
    const { response } = await login(email, "definitely-wrong");
    expect(response.status).toBe(401);
  });

  it("resets a password and logs in with the new one", async () => {
    const email = `reset.${randomUUID()}@wingman.test`;
    const password = "ResetPass12";
    await fetch(`${BASE}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, displayName: "Reset User" }),
    });

    const requestReset = await fetch(`${BASE}/api/auth/reset/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    expect(requestReset.status).toBe(200);
    const resetPayload = (await requestReset.json()) as { token?: string };
    expect(resetPayload.token).toBeTruthy();

    const confirm = await fetch(`${BASE}/api/auth/reset/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: resetPayload.token, password: "ResetPass99" }),
    });
    expect(confirm.status).toBe(200);

    const oldLogin = await login(email, password);
    expect(oldLogin.response.status).toBe(401);

    const newLogin = await login(email, "ResetPass99");
    expect(newLogin.response.status).toBe(200);
  });
});

describe("protected routes", () => {
  it("keeps the booking engine public and payment behind a session", async () => {
    const home = await fetch(`${BASE}/home`, { redirect: "manual" });
    expect(home.status).toBeLessThan(400);

    const payment = await fetch(`${BASE}/booking/payment`, { redirect: "manual" });
    expect(payment.status).toBeGreaterThanOrEqual(300);
    expect(payment.status).toBeLessThan(400);
    expect(payment.headers.get("location") ?? "").toContain("/auth");
  });

  it.skipIf(!SEED_PASSWORD)("allows member home and blocks member admin/owner/partner", async () => {
    const { cookie, response } = await login(seedEmailForRole("member"), SEED_PASSWORD);
    expect(response.status).toBe(200);
    expect(cookie).toContain("wm_session=");

    const home = await fetch(`${BASE}/home`, { headers: { cookie }, redirect: "manual" });
    expect(home.status).toBe(200);

    const admin = await fetch(`${BASE}/admin`, { headers: { cookie }, redirect: "manual" });
    expect(admin.status).toBeGreaterThanOrEqual(300);
    expect(admin.headers.get("location") ?? "").toContain("/forbidden");

    const owner = await fetch(`${BASE}/owner`, { headers: { cookie }, redirect: "manual" });
    expect(owner.headers.get("location") ?? "").toContain("/forbidden");

    const partner = await fetch(`${BASE}/partner`, { headers: { cookie }, redirect: "manual" });
    expect(partner.headers.get("location") ?? "").toContain("/forbidden");
  });

  it.skipIf(!SEED_PASSWORD)("allows partner desk and blocks owner", async () => {
    const { cookie, response } = await login(seedEmailForRole("partner"), SEED_PASSWORD);
    expect(response.status).toBe(200);
    const partner = await fetch(`${BASE}/partner`, { headers: { cookie }, redirect: "manual" });
    expect(partner.status).toBe(200);
    const owner = await fetch(`${BASE}/owner`, { headers: { cookie }, redirect: "manual" });
    expect(owner.headers.get("location") ?? "").toContain("/forbidden");
  });

  it.skipIf(!SEED_PASSWORD)("allows admin and blocks owner", async () => {
    const { cookie, response } = await login(seedEmailForRole("admin"), SEED_PASSWORD);
    expect(response.status).toBe(200);
    const admin = await fetch(`${BASE}/admin`, { headers: { cookie }, redirect: "manual" });
    expect(admin.status).toBe(200);
    const owner = await fetch(`${BASE}/owner`, { headers: { cookie }, redirect: "manual" });
    expect(owner.headers.get("location") ?? "").toContain("/forbidden");
  });

  it.skipIf(!SEED_PASSWORD)("allows owner on admin, partner, and owner", async () => {
    const { cookie, response } = await login(seedEmailForRole("owner"), SEED_PASSWORD);
    expect(response.status).toBe(200);
    for (const path of ["/owner", "/admin", "/partner", "/home"]) {
      const page = await fetch(`${BASE}${path}`, { headers: { cookie }, redirect: "manual" });
      expect(page.status, path).toBe(200);
    }
  });
});
