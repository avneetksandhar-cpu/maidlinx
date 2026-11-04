/**
 * Live backend smoke check. Prints pass/fail only — never prints secrets.
 *
 * Usage: npx tsx scripts/verify-backend.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
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
}

loadEnvLocal();

const BASE = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3005";

const REQUIRED = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
];

type Result = { name: string; ok: boolean; detail: string };

const results: Result[] = [];

function record(name: string, ok: boolean, detail: string) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

function sessionCookie(headers: Headers): string {
  const cookies =
    typeof headers.getSetCookie === "function"
      ? headers.getSetCookie()
      : [headers.get("set-cookie") ?? ""];
  const session = cookies.find((value) => value.includes("wm_session="));
  if (!session) return "";
  const match = session.match(/wm_session=([^;]+)/);
  return match?.[1] ? `wm_session=${match[1]}` : "";
}

async function jsonFetch(path: string, init?: RequestInit) {
  const response = await fetch(`${BASE}${path}`, init);
  let body: unknown = null;
  const text = await response.text();
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text.slice(0, 160) };
  }
  return { status: response.status, body, headers: response.headers };
}

async function main() {
  for (const key of REQUIRED) {
    const value = process.env[key]?.trim() ?? "";
    record(`env.${key}`, Boolean(value), value ? "set" : "missing");
  }

  const pub = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
  const secret = process.env.STRIPE_SECRET_KEY ?? "";
  record("stripe.publishable_is_test", pub.startsWith("pk_test_"), pub ? "prefix checked" : "empty");
  record("stripe.secret_is_test", secret.startsWith("sk_test_") || secret.startsWith("rk_test_"), secret ? "prefix checked" : "empty");

  const me = await jsonFetch("/api/auth/me");
  record("GET /api/auth/me unauthenticated", me.status === 401, `status ${me.status}`);

  const events = await jsonFetch("/api/events?when=all");
  const eventBody = events.body as { events?: unknown[]; error?: string };
  record(
    "GET /api/events",
    events.status === 200 && Array.isArray(eventBody.events),
    events.status === 200
      ? `${eventBody.events?.length ?? 0} listings`
      : `status ${events.status} ${eventBody.error ?? ""}`.trim(),
  );

  const wingmen = await jsonFetch("/api/wingmen");
  const wingBody = wingmen.body as { count?: number; error?: string };
  record(
    "GET /api/wingmen",
    wingmen.status === 200 && typeof wingBody.count === "number",
    wingmen.status === 200 ? `count ${wingBody.count}` : `status ${wingmen.status}`,
  );

  const stripe = await jsonFetch("/api/stripe/status");
  const stripeBody = stripe.body as { configured?: boolean; error?: string };
  record(
    "GET /api/stripe/status",
    stripe.status === 200 && stripeBody.configured === true,
    stripe.status === 200
      ? stripeBody.configured
        ? "configured test mode"
        : stripeBody.error ?? "not configured"
      : `status ${stripe.status}`,
  );

  const blockedNight = await jsonFetch("/api/bookings/night", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ scopeConductAck: true }),
  });
  record(
    "POST /api/bookings/night unauthenticated",
    blockedNight.status === 401,
    `status ${blockedNight.status}`,
  );

  const email = `backend.verify.${Date.now()}@wingman.test`;
  const password = "VerifyBackend10";
  const signup = await jsonFetch("/api/auth/signup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password, displayName: "Backend Verify" }),
  });
  const signupBody = signup.body as { ok?: boolean; error?: string };
  const cookie = sessionCookie(signup.headers);
  record(
    "POST /api/auth/signup",
    signup.status === 200 && signupBody.ok === true && cookie.includes("wm_session"),
    signup.status === 200 ? "session issued" : `${signup.status} ${signupBody.error ?? ""}`.trim(),
  );

  const firstEventId = Array.isArray(eventBody.events)
    ? String((eventBody.events[0] as { id?: string } | undefined)?.id ?? "")
    : "";
  if (firstEventId) {
    const detail = await jsonFetch(`/api/events/${firstEventId}`);
    const detailBody = detail.body as { event?: { id?: string }; error?: string };
    record(
      "GET /api/events/:id",
      detail.status === 200 && detailBody.event?.id === firstEventId,
      detail.status === 200 ? "listing loaded" : `${detail.status} ${detailBody.error ?? ""}`.trim(),
    );
  } else {
    record("GET /api/events/:id", false, "no public listings to inspect");
  }

  const backup = await jsonFetch("/api/events/backup");
  const backupBody = backup.body as { partnershipClaimed?: boolean; error?: string };
  record(
    "GET /api/events/backup",
    backup.status === 200 && backupBody.partnershipClaimed === false,
    backup.status === 200 ? "backup estimate" : `status ${backup.status}`,
  );

  const plan = await jsonFetch("/api/plan", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      date: new Date().toISOString().slice(0, 10),
      spendBand: "band_500_1500",
      music: "house",
      groupSize: 2,
      goal: "vip_nightlife",
    }),
  });
  const planBody = plan.body as { ok?: boolean; plan?: { options?: unknown[] }; error?: string };
  record(
    "POST /api/plan",
    plan.status === 200 && planBody.ok === true && (planBody.plan?.options?.length ?? 0) === 3,
    plan.status === 200 ? "3 options" : `${plan.status} ${planBody.error ?? ""}`.trim(),
  );

  const interest = await jsonFetch("/api/interest", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, name: "Backend Verify", source: "backend_verify" }),
  });
  const interestBody = interest.body as { ok?: boolean; charged?: boolean; error?: string };
  record(
    "POST /api/interest",
    interest.status === 200 && interestBody.ok === true && interestBody.charged === false,
    interest.status === 200 ? "recorded, not charged" : `${interest.status} ${interestBody.error ?? ""}`.trim(),
  );

  const webhook = await jsonFetch("/api/webhooks/stripe", { method: "POST", body: "{}" });
  record(
    "POST /api/webhooks/stripe unsigned",
    webhook.status === 400,
    `status ${webhook.status}`,
  );

  if (signup.status === 200 && cookie) {
    const sessionMe = await jsonFetch("/api/auth/me", {
      headers: { cookie },
    });
    const sessionBody = sessionMe.body as { user?: { email?: string } };
    record(
      "GET /api/auth/me authenticated",
      sessionMe.status === 200 && sessionBody.user?.email === email,
      `status ${sessionMe.status}`,
    );

    const missingAck = await jsonFetch("/api/bookings/night", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ scopeConductAck: false }),
    });
    record(
      "POST /api/bookings/night missing ack",
      missingAck.status === 400,
      `status ${missingAck.status}`,
    );

    const night = await jsonFetch("/api/bookings/night", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ scopeConductAck: true, occasion: "Backend verify" }),
    });
    const nightBody = night.body as {
      ok?: boolean;
      requestId?: string;
      quoteId?: string;
      error?: string;
    };
    record(
      "POST /api/bookings/night authenticated",
      night.status === 200 && Boolean(nightBody.requestId && nightBody.quoteId),
      night.status === 200 ? "draft + quote" : `${night.status} ${nightBody.error ?? ""}`.trim(),
    );

    const accountMe = await jsonFetch("/api/account/me", { headers: { cookie } });
    const accountMeBody = accountMe.body as { profile?: { email?: string } };
    record(
      "GET /api/account/me",
      accountMe.status === 200 && accountMeBody.profile?.email === email,
      `status ${accountMe.status}`,
    );

    const accountBookings = await jsonFetch("/api/account/bookings", { headers: { cookie } });
    const accountBookingsBody = accountBookings.body as { bookings?: unknown[] };
    record(
      "GET /api/account/bookings",
      accountBookings.status === 200 && Array.isArray(accountBookingsBody.bookings),
      accountBookings.status === 200
        ? `${accountBookingsBody.bookings?.length ?? 0} nights`
        : `status ${accountBookings.status}`,
    );

    const invoices = await jsonFetch("/api/account/invoices", { headers: { cookie } });
    const invoicesBody = invoices.body as { invoices?: unknown[] };
    record(
      "GET /api/account/invoices",
      invoices.status === 200 && Array.isArray(invoicesBody.invoices),
      invoices.status === 200 ? `${invoicesBody.invoices?.length ?? 0} receipts` : `status ${invoices.status}`,
    );

    const methods = await jsonFetch("/api/account/payment-methods", { headers: { cookie } });
    const methodsBody = methods.body as { methods?: unknown[] };
    record(
      "GET /api/account/payment-methods",
      methods.status === 200 && Array.isArray(methodsBody.methods),
      methods.status === 200 ? "methods listed" : `status ${methods.status}`,
    );

    const requests = await jsonFetch("/api/requests", { headers: { cookie } });
    const requestsBody = requests.body as { requests?: unknown[] };
    record(
      "GET /api/requests",
      requests.status === 200 && Array.isArray(requestsBody.requests),
      requests.status === 200 ? `${requestsBody.requests?.length ?? 0} requests` : `status ${requests.status}`,
    );

    if (nightBody.requestId && nightBody.quoteId) {
      const requestDetail = await jsonFetch(`/api/requests/${nightBody.requestId}`, {
        headers: { cookie },
      });
      const requestDetailBody = requestDetail.body as { request?: { id?: string }; nightService?: boolean };
      record(
        "GET /api/requests/:id",
        requestDetail.status === 200 &&
          requestDetailBody.request?.id === nightBody.requestId &&
          requestDetailBody.nightService === true,
        requestDetail.status === 200 ? "night service request" : `status ${requestDetail.status}`,
      );

      const earlyMessage = await jsonFetch("/api/messages", {
        method: "POST",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({ requestId: nightBody.requestId, body: "Too early" }),
      });
      record(
        "POST /api/messages before paid",
        earlyMessage.status === 403,
        `status ${earlyMessage.status}`,
      );

      const checkout = await jsonFetch("/api/payments/checkout", {
        method: "POST",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({ requestId: nightBody.requestId, quoteId: nightBody.quoteId }),
      });
      const pay = checkout.body as { url?: string; error?: string; blocker?: string };
      record(
        "POST /api/payments/checkout",
        checkout.status === 200 && typeof pay.url === "string" && pay.url.includes("stripe"),
        checkout.status === 200
          ? "checkout url"
          : `${checkout.status} ${pay.blocker ?? pay.error ?? ""}`.trim(),
      );
    }

    const logout = await jsonFetch("/api/auth/logout", {
      method: "POST",
      headers: { cookie },
    });
    const logoutBody = logout.body as { ok?: boolean };
    record("POST /api/auth/logout", logout.status === 200 && logoutBody.ok === true, `status ${logout.status}`);

    const afterLogout = await jsonFetch("/api/auth/me", { headers: { cookie } });
    record("GET /api/auth/me after logout", afterLogout.status === 401, `status ${afterLogout.status}`);

    const badLogin = await jsonFetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password: "WrongPassword99" }),
    });
    record("POST /api/auth/login wrong password", badLogin.status === 401, `status ${badLogin.status}`);

    const login = await jsonFetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const loginBody = login.body as { ok?: boolean; user?: { email?: string } };
    const loginCookie = sessionCookie(login.headers);
    record(
      "POST /api/auth/login",
      login.status === 200 && loginBody.ok === true && loginBody.user?.email === email && Boolean(loginCookie),
      login.status === 200 ? "session issued" : `status ${login.status}`,
    );
  }

  const failed = results.filter((item) => !item.ok);
  console.log("");
  console.log(`${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("FAIL  script", error instanceof Error ? error.message : "unknown error");
  process.exit(1);
});
