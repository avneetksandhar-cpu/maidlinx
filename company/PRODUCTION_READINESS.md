# MaidLinx production readiness

**Date:** 2026-08-11  
**Branch:** `cursor/live-location-and-booking-ux`  
**Role:** QA + Security / launch gate  
**Rule:** UI ≠ proven. Claims below cite code, remote DB, production browser, or build evidence. Secrets reported as FOUND / EMPTY / MISSING only — never values.

---

## ONE HUMAN ACTION REQUIRED (do this next)

**In Google Cloud Console → project `maidlinx-505202` → APIs & Services → Credentials → the Maps browser API key → Application restrictions → HTTP referrers: add `https://maidlinx.com/*` and `https://www.maidlinx.com/*` (keep `http://localhost:3001/*` / `http://127.0.0.1:3001/*`), ensure Places API (New) + Maps JavaScript API + Geocoding API are allowed, Save, then hard-refresh `https://maidlinx.com/book/address` and confirm typing `100 King` returns real Places suggestions (place id + coords on select).**

Until that lands, production autocomplete and current-location reverse-geocode stay blocked (`Requests from referer https://maidlinx.com/ are blocked.` — verified 2026-08-11 browser CDP). Manual address entry remains available.

**Immediate follow-up (also human-only, after Maps):** Set Production `SUPABASE_SERVICE_ROLE_KEY` on Vercel for maidlinx.com and redeploy — prior audit evidenced `POST /api/bookings` → `503 SUPABASE_NOT_CONFIGURED`. Do not paste the key into chat or git.

---

## READY FOR CONTROLLED REAL-MONEY LAUNCH: **NO**

| Metric | Count |
|--------|------:|
| P0 open | 6 |
| P1 open | 9 |
| P2 open | 6 |

---

## Final PASS / FAIL table (mission §1–27)

| # | Area | Result | Evidence / note |
|---|------|--------|-----------------|
| 1 | Full inspection + this doc | **PASS** | Deliverable: `company/PRODUCTION_READINESS.md` |
| 2 | Env audit + `.env.example` + secret scan | **PASS** | Names-only example updated; `.env.local` not tracked; no real `sk_live_` / `sk_test_` / `whsec_` / long `AIza` in tracked tree or history REVIEW |
| 3 | Google location on production | **FAIL** | Places Autocomplete referrer-blocked on `https://maidlinx.com/`; suggestions empty for `100 King`; `gm_authFailure` true; manual fallback OK |
| 4 | Auth / roles | **PASS** (code) | Supabase Auth + role gates; leaked-password protection **off** (P1) |
| 5 | RLS assumptions | **PARTIAL** | Core tables RLS on; many empty-policy tables = default deny (INFO); `is_admin` SECURITY DEFINER executable by authenticated (WARN) |
| 6 | Price security | **PASS** (code) | `calculateBookingPrice` + `assertPriceMatch` on create; tests green |
| 7 | Stripe TEST checkout | **FAIL** | Local Stripe keys EMPTY; remote `payments` = 0; not e2e-proven |
| 8 | Webhooks idempotency | **PARTIAL** | `claimStripeWebhookEvent` + `stripe_webhook_events` table; **0** events processed |
| 9 | Stripe Connect | **PASS** (controlled) | Connect stubbed unless `STRIPE_CONNECT_ENABLED=true`; admin payouts path OK; no auto real payouts |
| 10 | Cancellation / refund | **FAIL** | Code implements ≥24h deposit refund path — **BUSINESS DECISION REQUIRED** (not in `DECISIONS.md`) |
| 11 | Booking state machine | **PASS** (code) | `BOOKING_STATUS_TRANSITIONS` + cleaner transition helpers + unit tests |
| 12 | Concurrency / double-pay | **PARTIAL** | Idempotency key + PI reuse + webhook claims coded; unproven e2e |
| 13 | Notifications | **FAIL** | Local `EMAIL_PROVIDER`/`SMS_PROVIDER` = log; Resend/Twilio MISSING |
| 14 | CX broken/fake/dev text | **PARTIAL** | Legal 404s fixed with placeholders this pass; false “out of area” on partial address hardened; DEV_TEST forced off in production |
| 15 | Cleaner UX honesty | **PARTIAL** | Onboarding disclaims BG check; Connect stub copy honest; **0** cleaners |
| 16 | Admin UX | **PARTIAL** | Assign/match APIs coded; cannot prove without paid booking + supply |
| 17 | Mobile QA | **PARTIAL** | One-decision `/book/*` coded; Places fail blocks live mobile Maps proof |
| 18 | Performance | **PARTIAL** | Prod `/` + `/book/address` + `/api/health` 200; no Lighthouse run this gate |
| 19 | Accessibility | **PARTIAL** | Address form labels/combobox present in a11y snapshot; no full a11y audit |
| 20 | SEO / trust surfaces | **PARTIAL** | robots/sitemap/OG present; legal pages `noindex` placeholders |
| 21 | Legal | **FAIL** | Placeholder pages shipped — **LEGAL REVIEW REQUIRED** before real-money reliance |
| 22 | Trust claims | **PASS** | Active markets only; deposit vs balance honest; no fake AggregateRating |
| 23 | Monitoring | **FAIL** | `SENTRY_DSN` MISSING; wrapper logs only — **MONITORING_PROVIDER_REQUIRED** |
| 24 | DB reliability | **PARTIAL** | Project `pgoyhujsfbmfshtnlbnx` ACTIVE_HEALTHY; markets 2 / zones 6 / bookings 1 / cleaners 0 |
| 25 | Backup / recovery | **FAIL** | No verified backup/PITR runbook in repo — **do not claim backups** until human confirms Supabase PITR/backups in Dashboard |
| 26 | Final build | **PASS** | `lint` 0 errors (1 img warning); `typecheck` OK; **242** tests; `npm run build` OK (2026-08-11) |
| 27 | Controlled real-money launch | **FAIL** | See P0 list — **READY: NO** |

---

## P0 blockers (ordered)

1. **Production Google Places / Maps referrer block** — Autocomplete returns `Requests from referer https://maidlinx.com/ are blocked.` Current location reverse-geocode shares the same key gate. Manual entry works; Maps UX MUST PASS for this launch bar.
2. **Production booking persist blocked** — Prior production evidence: `POST /api/bookings` → `503` `SUPABASE_NOT_CONFIGURED` (missing/empty Vercel `SUPABASE_SERVICE_ROLE_KEY`). Re-POST not re-run this session (automation blocked mutating probes); treat as still open until proven after env set + redeploy.
3. **Stripe deposit + webhook unproven** — Local `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` / `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` = **EMPTY**; remote `payments` = 0, `stripe_webhook_events` = 0.
4. **Zero cleaner supply** — remote `cleaners` = 0, approved+active = 0. Paying customers would wait with nobody to assign.
5. **Cancellation / refund policy unapproved** — **BUSINESS DECISION REQUIRED.** Code assumes ≥24h full deposit refund; Product must accept or change before real money.
6. **Legal pages were 404; placeholders only** — Privacy/Terms/Cleaner Agreement now render with **LEGAL REVIEW REQUIRED** banners. Counsel must replace before treating as binding.

---

## P1 (not blocking tiny code fixes already done)

1. Notifications default to `log` (Resend/Twilio MISSING) — OK for ultra-controlled ops with manual contact; not for unattended launch.
2. `SENTRY_DSN` MISSING — **MONITORING_PROVIDER_REQUIRED**.
3. Auth leaked-password protection disabled (Supabase advisor WARN).
4. `is_admin()` SECURITY DEFINER executable by `authenticated`.
5. Admin permissions fail-open when `admin_permissions` empty.
6. Realtime / live GPS unproven on a live en-route job.
7. Automatic remaining-balance charge not implemented (copy already says support settles).
8. Backup/PITR not documented/verified.
9. Empty-policy RLS tables hygiene (mostly safe deny; audit before exposing via client).

## P2 (defer)

1. Stripe Connect live payouts productization  
2. Push notifications  
3. Function `search_path` mutable warnings  
4. Auto-dispatch / matching V2+  
5. Lighthouse / full a11y pass  
6. Recurring occurrence generation (explicitly not implemented)

---

## Env audit (local `.env.local` — names only)

| Name | State |
|------|-------|
| `NEXT_PUBLIC_SITE_URL` / `APP_URL` / `APP_NAME` | FOUND |
| `NEXT_PUBLIC_SUPABASE_URL` / `ANON_KEY` | FOUND |
| `SUPABASE_SERVICE_ROLE_KEY` | EMPTY |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | EMPTY |
| `STRIPE_SECRET_KEY` | EMPTY |
| `STRIPE_WEBHOOK_SECRET` | EMPTY |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | FOUND |
| `DEPOSIT_PERCENT` / `NEXT_PUBLIC_DEPOSIT_PERCENT` | FOUND |
| `EMAIL_PROVIDER` / `SMS_PROVIDER` | FOUND (`log`) |
| `RESEND_API_KEY` / `TWILIO_*` | MISSING |
| `SENTRY_DSN` | MISSING |
| `ADMIN_BOOTSTRAP_EMAIL` | FOUND |
| `BOOKING_ACCESS_SECRET` | EMPTY |
| `ALLOW_DEV_TEST_BOOKING` | FOUND (forced off when `NODE_ENV=production`) |
| `STRIPE_CONNECT_ENABLED` | MISSING (Connect stays stub — desired for controlled launch) |

`.env.example` updated with names/comments only (incl. optional `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` alias note + `STRIPE_CONNECT_ENABLED`).

### Secret hygiene

- `.env` / `.env.local` gitignored; not tracked  
- Tracked working tree: no real-looking `sk_live_` / `sk_test_` / `whsec_` / long `AIza` / JWT triples  
- History mentions of Stripe key prefixes appear documentation-only (no REVIEW_COMMITS with real-looking keys)  
- **No rotation required** from this scan  
- Browser Maps key is `NEXT_PUBLIC_` by design — protect with HTTP referrer + API restrictions (currently failing that bar on production host)

---

## Google Maps / location (production)

| Check | Result |
|-------|--------|
| `/book/address` loads | PASS (200) |
| Maps JS + `places` library | Present |
| `AutocompleteSuggestion` API | Present |
| Type `100 King` → suggestions | **FAIL** (empty / collapsed; no place select) |
| Direct `fetchAutocompleteSuggestions` | **FAIL** — referrer blocked for `https://maidlinx.com/` |
| Current location | **FAIL** until same referrer/Geocoding gate cleared + browser permission |
| Fake suggestions | PASS — none invented; UI stays empty / manual path |
| Safari-specific | Not separately instrumented this pass; fix is referrer/API (browser-agnostic). Re-test Safari after Cloud Console change |

Docs: `docs/GOOGLE_MAPS_SETUP.md` (project `maidlinx-505202`).

---

## Remote DB snapshot (Supabase `pgoyhujsfbmfshtnlbnx`)

| Relation | Count |
|----------|------:|
| cleaners | 0 |
| approved + active cleaners | 0 |
| bookings | 1 (`awaiting_assignment`) |
| payments | 0 |
| stripe_webhook_events | 0 |
| markets | 2 |
| service_zones | 6 |

Security advisors (high-signal): leaked password protection disabled; `is_admin` SECURITY DEFINER callable by authenticated; multiple RLS-enabled-no-policy INFO; function `search_path` mutable WARNs.

---

## Payments / Connect / cancel

- **Price authority:** server recalculation + `assertPriceMatch` (tests PASS).  
- **Webhooks:** signature verify + `claimStripeWebhookEvent` idempotency coded; unproven live.  
- **Connect:** disabled unless `STRIPE_CONNECT_ENABLED=true` — keep off for controlled launch; admin payout tooling OK.  
- **Cancel/refund:** `createCancellationRefund` + admin refunds — **BUSINESS DECISION REQUIRED** on ≥24h policy before real money.  
- **DEV_TEST_BOOKING:** production hard-off covered by tests.

---

## Monitoring / backups

- Monitoring wrapper: `src/lib/monitoring/sentry.ts` — logs until `SENTRY_DSN` set → **MONITORING_PROVIDER_REQUIRED**.  
- Backups: **not verified** in this audit. Confirm Supabase Dashboard backups/PITR with a human before claiming recovery readiness. No destructive DB ops performed.

---

## Quality gates (this session)

| Gate | Result |
|------|--------|
| `npm run lint` | PASS (0 errors, 1 `@next/next/no-img-element` warning) |
| `npm run typecheck` | PASS |
| `npm test` | PASS — 242/242 |
| `npm run build` | PASS |

---

## Code hardenings this pass (P0-adjacent, minimal)

1. Legal placeholder routes: `/legal/privacy`, `/legal/terms`, `/legal/cleaner-agreement` (were production **404**).  
2. Address screen: do not show “not in your area” / hide CTA on partial street-only input (requires postal before out-of-area; CTA uses `isAddressComplete`).  
3. `.env.example` names/comments for publishable-key alias + Connect flag.

Did **not** edit sibling mid-write repeat-revenue WIP files.

---

## Controlled-launch checklist (after human Maps + env)

1. Fix Google referrers → prove `100 King` select → place id + lat/lng (desktop Chrome + mobile Chrome + Safari).  
2. Set Vercel `SUPABASE_SERVICE_ROLE_KEY` → redeploy → booking create succeeds.  
3. Set Stripe **TEST** keys on Vercel + webhook endpoint → one sandbox pay → webhook row → confirmed/awaiting_assignment.  
4. Create ≥1 approved active cleaner → admin assign → cleaner status ladder.  
5. Product accepts cancel/refund policy in `DECISIONS.md`.  
6. Legal counsel replaces placeholders.  
7. Set monitoring DSN; confirm Supabase backup/PITR.  
8. Only then flip to live Stripe keys under explicit human approval.

---

## Sign-off

**READY FOR CONTROLLED REAL-MONEY LAUNCH: NO**

Do not take a stranger’s card until P0 #1–#5 are cleared and one BOOK → PAY → ASSIGN → CLEAN loop is proven against production (or Stripe test mode on production DB) with ≥1 approved cleaner.
