# MaidLinx — Final PASS / FAIL Report (Founder)

**Date:** 2026-08-11  
**Branch:** `cursor/live-location-and-booking-ux` (ahead of origin by Pricing Engine V1 commit)  
**Synthesized after:** Pricing Engine V1 landed (`company/PRICING_ENGINE_V1.md`, commit `7ea725e`) **and** operator E2E stabilized at human STOP (`company/OPERATOR_PROGRESS.md`, `company/CHECKLIST_RUN.md`)  
**Sources:** `FULL_LAUNCH_REPORT.md`, `PRODUCTION_READINESS.md`, `END_TO_END_TEST.md`, `REPEAT_REVENUE_TEST.md`, `CHECKLIST_RUN.md`, `OPERATOR_PROGRESS.md`, `PRICING_ENGINE_V1.md`, Lead pricing agent report, remote Supabase MCP, local env names-only, `git log -15`, pricing unit tests  
**Rule:** UI ≠ proven. No invented PASS. Secrets never printed (FOUND / EMPTY / MISSING only).

---

## Executive verdict

| Gate | Verdict |
|------|---------|
| **READY FOR FIRST TEST BOOKING** | **NO** |
| **READY FOR CONTROLLED REAL-MONEY LAUNCH** | **NO** |

**Why NO:** Stripe TEST keys are EMPTY (local + production). Remote `payments` = **0**, `stripe_webhook_events` = **0**. Production booking create last evidenced **503 `SUPABASE_NOT_CONFIGURED`** (Vercel service role still missing). Cleaner supply = **0**. Cancel/refund policy not in `DECISIONS.md`. Legal pages are placeholders. Pricing Engine V1 is **code-complete** but migration `00024` is **not applied** on remote Supabase.

**What flipped since earlier launch docs:** Production Google Places Autocomplete + Current Location are **PASS** (operator-verified after GCP referrer + API + radius fix + redeploy). Local `SUPABASE_SERVICE_ROLE_KEY` is now **FOUND** (checklist docs still say EMPTY — treat docs as lagged). Remote bookings count is **3** (was 1) — still **not** a paid loop.

**Do not** take a stranger’s card until P0 below clears and one **BOOK → PAY → WEBHOOK → ASSIGN → COMPLETE** loop is proven with ≥1 approved active cleaner.

---

## Production critical path

| Area | Result | Evidence |
|------|--------|----------|
| CUSTOMER BOOKING | **FAIL** (prod) / **PARTIAL** (local) | Prod `POST /api/bookings` → `503 SUPABASE_NOT_CONFIGURED` (`CHECKLIST_RUN`). Local service role now FOUND; no Stripe deposit proven. Booking UI funnel coded. |
| SUPABASE SAVE | **FAIL** (prod) / **PARTIAL** (local) | Vercel missing `SUPABASE_SERVICE_ROLE_KEY`. Local key FOUND. Remote bookings=**3**, markets=2, zones=6. Create not proven end-to-end this gate. |
| STRIPE TEST PAYMENT | **FAIL** | Local Stripe publishable/secret/webhook **EMPTY**. Remote `payments`=**0**. MCP was livemode-only per operator — need TEST (`livemode=false`). |
| WEBHOOK | **FAIL** | Handler + idempotency coded; remote `stripe_webhook_events`=**0**. Unproven live. |
| CONFIRMATION PAGE | **FAIL** | UI + confirm-payment/webhook path coded; blocked without paid deposit. |
| ADMIN DASHBOARD | **FAIL** (ops) / **PASS** (code) | Admin bookings/assign/revenue/pricing UIs coded; cannot prove receive/assign without paid booking + cleaner. |
| GOOGLE AUTOCOMPLETE | **PASS** | Operator live on `https://maidlinx.com/book/address`: `100 King` → 5 suggestions (e.g. King Street East, Toronto). Prior QA FAIL superseded by post-fix retest. |
| CURRENT LOCATION | **PASS** | Operator: mocked GPS → filled King St W / Toronto / ON / M5H 1H1. Classic Geocoder still `REQUEST_DENIED` (GCP billing unlinked); Places nearby fallback works. |
| BOOKING FLOW | **FAIL** (e2e) / **PASS** (UI code) | One-decision `/book/*` screens exist; create/pay/confirm/assign/complete not proven as a loop. |
| SECURITY | **PASS** (code) / **PARTIAL** (ops) | No client service-role/Stripe secrets observed; RLS on core tables; server `assertPriceMatch`. P1: leaked-password protection off; `is_admin` hygiene; empty-policy INFO. |
| PRODUCTION BUILD | **PASS** | Prior gate: lint 0 errors, typecheck, **242** tests, `npm run build` OK. This session: pricing suite **26**/26 PASS (`src/lib/pricing`). |

---

## Pricing Engine V1

**Shipped:** yes (commit `7ea725e`, doc `company/PRICING_ENGINE_V1.md`). Dynamic demand/supply **OFF by default**. Do not enable for real-money customers until Product + QA approve.

| Area | Result | Evidence |
|------|--------|----------|
| PRICING ENGINE | **PASS** (code) / **FAIL** (remote schema) | Engine under `src/lib/pricing/engine/**` + `resolveServerPricing` on quote/create. Migration `00024_pricing_engine_v1.sql` in repo. Remote: `pricing_rules` **does not exist** (MCP SQL); migration list ends at `payouts_ledger` — **00024 not applied**. |
| PROFIT GUARDRAIL | **PASS** (code) | `guardrails.ts` enforces min contribution margin; covered by `engine.test.ts`. |
| ANALYTICS | **PASS** (code) | `POST /api/analytics/funnel` + `funnel_events` (migration pending remote). PII stripped server-side. Empty zeros — no fake demos. |
| EXPERIMENTS | **PASS** (code) | Sticky assign + admin results; `auto_deploy_winner` forced false. Observational only. |
| ADMIN DASHBOARD | **PASS** (code) | `/admin/pricing` + engine panel (rules, metrics empty-state, experiments). Unproven against live quote rows until migration + traffic. |
| BOOKING FLOW | **PARTIAL** | Quote + create re-resolve server pricing; `assertPriceMatch` intact. Live quote→pay path still blocked by Stripe/env. With dynamic off + one-time + no promo, totals match legacy calculator (by design). |
| SECURITY | **PASS** (code) | Never trust browser prices; `calculation_audit` must not return to clients (asserted in tests); device/browser category not a price factor; referral credits remain gated. |

---

## Overall gates

| Gate | Answer |
|------|--------|
| READY FOR FIRST TEST BOOKING | **NO** |
| READY FOR CONTROLLED REAL-MONEY LAUNCH | **NO** |

First test booking needs at least: working create (prod or local) **and** one Stripe **TEST** deposit **and** webhook claim → booking `awaiting_assignment` / `deposit_paid`. Maps is no longer the stop. Stripe + prod service role + cleaner supply still are.

Controlled real-money additionally needs: cancel/refund decision, legal counsel pages, monitoring/backups awareness, explicit human approval before live Stripe keys, and a proven BOOK→PAY→ASSIGN→COMPLETE loop with supply.

---

## Remote DB snapshot (Supabase `pgoyhujsfbmfshtnlbnx`, this session)

| Relation | Count |
|----------|------:|
| cleaners (all) | 0 |
| cleaners approved + active | 0 |
| bookings | 3 |
| payments | 0 |
| stripe_webhook_events | 0 |
| markets / service_zones | 2 / 6 |
| pricing_rules / pricing_quotes / funnel_events | **N/A — tables not on remote** |

---

## Env snapshot (names only)

| Variable | Local `.env.local` | Vercel Production (per operator/checklist) |
|----------|-------------------|--------------------------------------------|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | FOUND | FOUND |
| `NEXT_PUBLIC_SUPABASE_URL` / anon | FOUND | Set by operator (URL+anon); confirm after any redeploy |
| `SUPABASE_SERVICE_ROLE_KEY` | **FOUND** (checklist still said EMPTY — lag) | **MISSING** ← prod create stop |
| Stripe publishable / secret / webhook | **EMPTY** | **MISSING** |
| Email/SMS / Sentry | log / MISSING (prior audits) | not proven |

---

## ACTION REQUIRED FROM ME (one at a time, in order)

1. **Set Production `SUPABASE_SERVICE_ROLE_KEY` on Vercel** for maidlinx.com (Supabase Dashboard → Project Settings → API → `service_role` — never paste into chat/git). Redeploy. Prove `POST https://maidlinx.com/api/bookings` is no longer `503 SUPABASE_NOT_CONFIGURED`.

2. **Add Stripe TEST keys** (`pk_test_` / `sk_test_` + `STRIPE_WEBHOOK_SECRET`) to local `.env.local` and Vercel; configure webhook for `/api/webhooks/stripe` (local: `stripe listen`). Complete **one** sandbox deposit → confirm `payments` row + `stripe_webhook_events` claim + booking `awaiting_assignment` / `deposit_paid`. Do **not** use live keys.

3. **Create and approve ≥1 active cleaner** (`approved=true`, `is_active=true`). Admin-assign the paid test booking; run cleaner status ladder through complete.

4. **Apply migration `00024_pricing_engine_v1.sql`** to the target Supabase project when you want Pricing Engine tables live. Keep **Dynamic pricing OFF** until Product + QA explicitly approve. Re-run quote → checkout in TEST after apply.

5. **Record cancel/refund policy** in `company/DECISIONS.md` (code assumes ≥24h full deposit refund) and schedule counsel to replace `/legal/*` placeholders before any real-money stranger. Optional non-blocker: link GCP billing for `maidlinx-505202` so classic Geocoder stops denying.

---

## Recent commits (context)

| Commit | Summary |
|--------|---------|
| `7ea725e` | Add Pricing Engine V1 with guardrails, audit, and admin controls |
| `acc3704` | Customer-friendly config errors + operator/QA checklist progress |
| `5f49abb` | Fix Details step Continue bounce / sticky address gates |
| `d38feec` | Full launch report consolidating readiness gates |
| `467db6d` | Production readiness gate + launch blocker hardenings |
| `3845d6c` | Repeat-revenue foundations (credits/auto-charge off) |
| `13d5dc2` … `9b90f6b` | Launch audit, rebook UX, assign/payouts, E2E gate, trust copy, post-booking UX |

---

## Sign-off

**READY FOR FIRST TEST BOOKING: NO**  
**READY FOR CONTROLLED REAL-MONEY LAUNCH: NO**

Maps production UX is fixed. Pricing Engine V1 is implemented safely (dynamic off) but not migrated remotely. The remaining bottleneck is human configuration and one proven paid loop — not a product redesign.
