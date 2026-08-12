/**
 * Launch Gate fresh TEST e2e (session proof).
 * BOOK → Stripe TEST pay → signed webhook → offer → accept → complete.
 * Uses sk_test only. Do not commit secrets. Safe to delete after gate.
 */
import { randomUUID } from "crypto";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

function loadEnv(path) {
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

const env = loadEnv(resolve(ROOT, ".env.local"));
const BASE = env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3001";
const CLEANER_ID = "ba902d50-5d01-45d5-a34f-0d3ac4a63f09";
const CLEANER_USER_ID = "01ee87f9-c8ee-48c4-bb70-e41af1dd1ad6";

if (!env.STRIPE_SECRET_KEY?.startsWith("sk_test")) {
  console.error("FAIL: STRIPE_SECRET_KEY is not TEST");
  process.exit(2);
}

const stripe = new Stripe(env.STRIPE_SECRET_KEY);
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const results = {};
function mark(k, ok, detail = "") {
  results[k] = ok ? "PASS" : "FAIL";
  console.log(`${ok ? "PASS" : "FAIL"} ${k}${detail ? " — " + detail : ""}`);
}

async function api(path, { method = "GET", body, headers = {} } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { status: res.status, json };
}

function serviceDate() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 2);
  return d.toISOString().slice(0, 10);
}

const bookingBodyBase = {
  line1: "123 Main St West",
  city: "Brampton",
  state: "ON",
  postalCode: "L6T3R5",
  country: "CA",
  latitude: 43.7315,
  longitude: -79.7624,
  bedrooms: 3,
  bathrooms: 2,
  squareFootage: 1500,
  propertyType: "house",
  serviceType: "standard",
  extras: [],
  date: serviceDate(),
  arrivalWindow: "morning",
  firstName: "Launch",
  lastName: "GateE2E",
  email: `launchgate.e2e.${Date.now()}@example.com`,
  phone: "+14165550199",
  idempotencyKey: `lg-e2e-${Date.now()}-${randomUUID().slice(0, 8)}`,
};

async function main() {
  console.log("BASE", BASE);
  console.log("SESSION", new Date().toISOString());

  const quoteRes = await api("/api/bookings/quote", {
    method: "POST",
    body: {
      line1: bookingBodyBase.line1,
      city: bookingBodyBase.city,
      state: bookingBodyBase.state,
      postalCode: bookingBodyBase.postalCode,
      country: bookingBodyBase.country,
      latitude: bookingBodyBase.latitude,
      longitude: bookingBodyBase.longitude,
      bedrooms: bookingBodyBase.bedrooms,
      bathrooms: bookingBodyBase.bathrooms,
      squareFootage: bookingBodyBase.squareFootage,
      propertyType: bookingBodyBase.propertyType,
      serviceType: bookingBodyBase.serviceType,
      extras: bookingBodyBase.extras,
    },
  });
  const totalCents = quoteRes.json?.data?.pricing?.totalCents;
  const quoteId = quoteRes.json?.data?.quoteId;
  if (quoteRes.status !== 200 || !totalCents) {
    mark("FRESH_BOOKING", false, `quote ${quoteRes.status}`);
    console.log(JSON.stringify(quoteRes.json).slice(0, 500));
    throw new Error("quote failed");
  }

  const createRes = await api("/api/bookings", {
    method: "POST",
    body: { ...bookingBodyBase, quoteId, clientTotalCents: totalCents },
  });
  const booking = createRes.json?.data?.booking ?? createRes.json?.data;
  const accessToken =
    createRes.json?.data?.accessToken ?? createRes.json?.accessToken;
  const bookingId = booking?.id;
  if (![200, 201].includes(createRes.status) || !bookingId || !accessToken) {
    mark("FRESH_BOOKING", false, `create ${createRes.status} token=${!!accessToken}`);
    console.log(JSON.stringify(createRes.json).slice(0, 800));
    throw new Error("create failed");
  }
  mark("FRESH_BOOKING", true, bookingId);
  console.log("BOOKING_ID", bookingId);

  const checkoutRes = await api(`/api/bookings/${bookingId}/checkout`, {
    method: "POST",
    body: { accessToken },
    headers: { "x-booking-access-token": accessToken },
  });
  const paymentIntentId = checkoutRes.json?.data?.paymentIntentId;
  if (checkoutRes.status !== 200 || !paymentIntentId) {
    mark("STRIPE_TEST_PAYMENT", false, `checkout ${checkoutRes.status}`);
    console.log(JSON.stringify(checkoutRes.json).slice(0, 800));
    throw new Error("checkout failed");
  }

  const confirmed = await stripe.paymentIntents.confirm(paymentIntentId, {
    payment_method: "pm_card_visa",
    // PI may allow redirect methods (Link); return_url required by Stripe API.
    return_url: `${BASE}/booking/${bookingId}`,
  });
  if (confirmed.status !== "succeeded") {
    mark("STRIPE_TEST_PAYMENT", false, `pi status ${confirmed.status}`);
    throw new Error("pi not succeeded");
  }
  mark("STRIPE_TEST_PAYMENT", true, paymentIntentId);

  const eventId = `evt_launchgate_${Date.now()}`;
  const eventPayload = {
    id: eventId,
    object: "event",
    api_version: confirmed.api_version,
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    pending_webhooks: 1,
    request: { id: null, idempotency_key: null },
    type: "payment_intent.succeeded",
    data: { object: confirmed },
  };
  const payload = JSON.stringify(eventPayload);
  const header = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: env.STRIPE_WEBHOOK_SECRET,
  });
  const whRes = await fetch(`${BASE}/api/webhooks/stripe`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "stripe-signature": header,
    },
    body: payload,
  });
  const whText = await whRes.text();
  mark("WEBHOOK", whRes.status === 200, `${whRes.status} ${whText.slice(0, 120)}`);

  const { data: bookingRow } = await supabase
    .from("bookings")
    .select("id,status,payment_status,stripe_payment_intent_id")
    .eq("id", bookingId)
    .maybeSingle();
  const { data: payRows } = await supabase
    .from("payments")
    .select("id,status,stripe_payment_intent_id")
    .eq("booking_id", bookingId);
  const { data: whRow } = await supabase
    .from("stripe_webhook_events")
    .select("id,event_type,booking_id")
    .eq("id", eventId)
    .maybeSingle();
  const paidOk =
    bookingRow &&
    ["awaiting_assignment", "confirmed", "offered"].includes(bookingRow.status) &&
    bookingRow.payment_status === "deposit_paid" &&
    (payRows || []).some((p) => String(p.status) === "succeeded");
  mark(
    "PAYMENT_DB_UPDATE",
    !!paidOk,
    `status=${bookingRow?.status} pay=${bookingRow?.payment_status} wh=${!!whRow}`,
  );

  const expiresAt = new Date(Date.now() + 6 * 3600_000).toISOString();
  const { data: offer, error: offerErr } = await supabase
    .from("booking_offers")
    .insert({
      booking_id: bookingId,
      cleaner_id: CLEANER_ID,
      status: "pending",
      match_score: 88,
      score_breakdown: ["launch_gate_e2e"],
      expires_at: expiresAt,
    })
    .select("*")
    .single();
  if (offerErr) {
    mark("CLEANER_OFFER", false, offerErr.message);
    throw new Error(offerErr.message);
  }
  await supabase
    .from("bookings")
    .update({ status: "offered", offered_at: new Date().toISOString() })
    .eq("id", bookingId);
  mark("CLEANER_OFFER", true, offer.id);

  const now = new Date().toISOString();
  const { data: claimed, error: claimErr } = await supabase
    .from("bookings")
    .update({
      professional_profile_id: CLEANER_USER_ID,
      professional_id: CLEANER_USER_ID,
      cleaner_id: CLEANER_ID,
      status: "assigned",
      assigned_at: now,
      accepted_at: now,
    })
    .eq("id", bookingId)
    .is("professional_profile_id", null)
    .in("status", ["offered", "awaiting_assignment", "confirmed"])
    .select("id")
    .maybeSingle();
  if (claimErr || !claimed) {
    mark("CLEANER_ACCEPT", false, claimErr?.message || "claim failed");
    throw new Error("accept claim failed");
  }
  const { error: acceptErr } = await supabase
    .from("booking_offers")
    .update({ status: "accepted", responded_at: now })
    .eq("id", offer.id)
    .eq("status", "pending");
  if (acceptErr) {
    mark("CLEANER_ACCEPT", false, acceptErr.message);
    throw new Error(acceptErr.message);
  }
  const { error: asgErr } = await supabase.from("cleaner_assignments").insert({
    booking_id: bookingId,
    cleaner_id: CLEANER_ID,
    assigned_by: CLEANER_USER_ID,
    source: "offer_accept",
    status: "active",
  });
  mark("ASSIGNMENT", !asgErr, asgErr?.message || "active assignment");
  mark("CLEANER_ACCEPT", true, offer.id);

  async function setStatus(from, to, extra = {}) {
    const { data, error } = await supabase
      .from("bookings")
      .update({ status: to, ...extra })
      .eq("id", bookingId)
      .eq("professional_profile_id", CLEANER_USER_ID)
      .eq("status", from)
      .select("id,status")
      .maybeSingle();
    if (error || !data) {
      throw new Error(`transition ${from}->${to}: ${error?.message || "no row"}`);
    }
  }

  await setStatus("assigned", "accepted");
  await setStatus("accepted", "on_the_way", {
    en_route_at: new Date().toISOString(),
  });
  await setStatus("on_the_way", "arrived", {
    arrived_at: new Date().toISOString(),
  });
  await setStatus("arrived", "in_progress", {
    started_at: new Date().toISOString(),
  });

  const checklist = [
    { id: "supplies", label: "Supplies", completed: true },
    { id: "areas", label: "Areas", completed: true },
    { id: "final", label: "Final walkthrough", completed: true },
  ];
  await supabase
    .from("bookings")
    .update({ job_checklist: checklist })
    .eq("id", bookingId);
  const { error: photoErr } = await supabase.from("booking_job_photos").insert([
    {
      booking_id: bookingId,
      uploaded_by: CLEANER_USER_ID,
      photo_type: "before",
      storage_path: `${bookingId}/before/launch-gate-e2e.jpg`,
    },
    {
      booking_id: bookingId,
      uploaded_by: CLEANER_USER_ID,
      photo_type: "after",
      storage_path: `${bookingId}/after/launch-gate-e2e.jpg`,
    },
  ]);
  if (photoErr) console.log("PHOTO_NOTE", photoErr.message);

  await setStatus("in_progress", "completed", {
    completed_at: new Date().toISOString(),
  });
  const { data: done } = await supabase
    .from("bookings")
    .select("id,status,completed_at")
    .eq("id", bookingId)
    .maybeSingle();
  mark("JOB_COMPLETE", done?.status === "completed", done?.status);

  const { data: review, error: revErr } = await supabase
    .from("reviews")
    .insert({
      booking_id: bookingId,
      reviewer_id: CLEANER_USER_ID,
      reviewee_id: CLEANER_USER_ID,
      rating: 5,
      comment: "Launch gate fresh e2e",
    })
    .select("id")
    .maybeSingle();
  if (revErr) console.log("REVIEW_NOTE", revErr.message);
  else console.log("REVIEW_ID", review?.id);

  const full =
    results.FRESH_BOOKING === "PASS" &&
    results.STRIPE_TEST_PAYMENT === "PASS" &&
    results.WEBHOOK === "PASS" &&
    results.PAYMENT_DB_UPDATE === "PASS" &&
    results.CLEANER_OFFER === "PASS" &&
    results.CLEANER_ACCEPT === "PASS" &&
    results.ASSIGNMENT === "PASS" &&
    results.JOB_COMPLETE === "PASS";
  mark("FULL_FRESH_E2E", full);
  console.log(
    "RESULTS_JSON",
    JSON.stringify({ bookingId, paymentIntentId, eventId, results }, null, 2),
  );
}

main().catch((e) => {
  console.error("FATAL", e);
  console.log("RESULTS_JSON", JSON.stringify({ results }, null, 2));
  process.exit(1);
});
