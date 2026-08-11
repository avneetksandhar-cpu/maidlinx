# Known issues (no secrets)

Last updated: 2026-08-11 · Branch `cursor/live-location-and-booking-ux`

## P0 — blocks Sprint 1 / Phase 1 core loop

### 1. Local Supabase service role missing ← **ACTIVE STOP**

- **Symptom:** `POST /api/bookings` → `503` / `SUPABASE_NOT_CONFIGURED` (“Booking storage is not configured…”)
- **Cause:** `SUPABASE_SERVICE_ROLE_KEY` **EMPTY** in project-root `.env.local` (URL + anon **SET**)
- **Remote:** Maidlinx (`pgoyhujsfbmfshtnlbnx`) ACTIVE_HEALTHY; markets 2 / zones 6 / bookings 1 / cleaners **0**
- **Fix owner:** Human (MCP cannot mint `service_role`). Paste into `.env.local` only — never chat/git
- **Where:** Supabase Dashboard → Project Settings → API → `service_role` → `.env.local` key `SUPABASE_SERVICE_ROLE_KEY`
- **Do not:** put service_role in `NEXT_PUBLIC_*` or client bundles; do not commit `.env.local`

### 2. Stripe TEST keys missing locally

- **Symptom:** Checkout returns payment-not-configured when `STRIPE_SECRET_KEY` empty; card form needs publishable key; webhook needs signing secret
- **Cause:** `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` all **EMPTY**
- **Fix:** Stripe Dashboard **Test mode** keys + `stripe listen --forward-to localhost:3001/api/webhooks/stripe` → `whsec_…` per `docs/STRIPE_SETUP.md`
- **Rule:** TEST only (`pk_test_` / `sk_test_`). No live keys for local MVP
- **Order:** Fix #1 first (persist), then #2 (pay)

### 3. Google Maps Places / Geocoding may be billing-blocked

- **Symptom:** Autocomplete / current-location reverse geocode `REQUEST_DENIED` / billing errors
- **Cause:** Google Cloud project billing / API enablement (agents cannot accept Google billing terms)
- **Env:** `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` **SET** locally
- **Mitigation:** Manual address entry still works — does not block BOOK if typed
- **Docs:** `docs/GOOGLE_MAPS_SETUP.md` — project `maidlinx-505202`
- **STOP for Maps UX only:** Enable billing + Places + Maps JS + Geocoding; restrict key referrers to localhost:3001 and production host

### 4. Empty cleaner supply

- **Symptom:** Cannot complete ASSIGN→CLEAN ladder even if a paid booking exists
- **Cause:** Remote `cleaners` row count **0**
- **Fix after env:** Create cleaner user + approved `cleaners` row per `SETUP_TODAY.md` / `scripts/SEED_TEST_USERS.md` — no fake production reviews

## P1 — security / schema hygiene (not rewrite now)

- SECURITY DEFINER views: `public.profiles`, `public.professionals` (Supabase advisor ERROR)
- Several tables: RLS enabled with **no policies** (default deny for anon — OK if only service role touches them; audit before exposing)
- `is_admin()` SECURITY DEFINER executable by authenticated — review EXECUTE grants
- Function `search_path` mutable warnings on triggers/helpers
- Local migration filenames (`00001`…) vs remote timestamped history — prefer MCP/safe additive applies; **no `db reset`**

## P2 — product gaps (post-gate)

- Stripe Connect payouts stub (`STRIPE_CONNECT_ENABLED`)
- Document upload storage not fully wired
- Admin “Action Required” homepage incomplete
- Notification providers often log-only
- AI assistant draft schema unused — leave alone until Sprint 6
- Availability slot generation / auto-match — roadmap V2+

## Coordination

- Do not fight sibling edits to `.env.local` or growth docs under `company/growth/`
- Do not commit `.env.local`
- Never print secret values in reports or chat
- Architecture: `company/ARCHITECTURE.md` · Engines: `company/MARKETPLACE_SYSTEMS.md`
