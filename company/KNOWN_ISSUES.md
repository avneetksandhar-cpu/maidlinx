# Known issues (no secrets)

Last updated: 2026-08-11 · Branch `cursor/live-location-and-booking-ux`

## P0 — blocks Sprint 1 core loop

### 1. Local Supabase service role missing

- **Symptom:** `POST /api/bookings` → `503` / `SUPABASE_NOT_CONFIGURED` (“Booking storage is not configured…”)
- **Cause:** `SUPABASE_SERVICE_ROLE_KEY` empty in project-root `.env.local` (URL + anon present)
- **Remote:** Maidlinx project healthy; marketplace booking columns, statuses, markets/zones present; sample paid booking exists
- **Fix owner:** Human (MCP cannot mint service_role). Paste service_role into `.env.local` only — never chat/git
- **Do not:** put service_role in `NEXT_PUBLIC_*` or client bundles

### 2. Stripe TEST keys missing locally

- **Symptom:** Checkout returns payment-not-configured when `STRIPE_SECRET_KEY` empty; card form needs publishable key; webhook needs signing secret
- **Cause:** `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` empty
- **Fix:** Stripe Dashboard **Test mode** keys + `stripe listen` → `whsec_…` per `docs/STRIPE_SETUP.md`
- **Rule:** TEST only (`pk_test_` / `sk_test_`). No live keys for local MVP

### 3. Google Maps Places / Geocoding may be billing-blocked

- **Symptom:** Autocomplete / current-location reverse geocode `REQUEST_DENIED` / billing errors
- **Cause:** Google Cloud project billing / API enablement (agents cannot accept Google billing terms)
- **Mitigation:** Manual address entry still works
- **Docs:** `docs/GOOGLE_MAPS_SETUP.md` — project `maidlinx-505202`
- **STOP for Maps:** Enable billing + Places + Maps JS + Geocoding; restrict key referrers to localhost:3001 and production host

### 4. Empty cleaner supply

- **Symptom:** Cannot complete ASSIGN→CLEAN ladder even if a paid booking exists
- **Cause:** `cleaners` count is 0 on remote
- **Fix after env:** Create cleaner user + `cleaners` row (approved) per `SETUP_TODAY.md`

## P1 — security / schema hygiene (not rewrite now)

- SECURITY DEFINER views: `public.profiles`, `public.professionals` (Supabase advisor ERROR)
- Several tables: RLS enabled with **no policies** (default deny for anon — OK if only service role touches them; audit before exposing)
- `is_admin()` SECURITY DEFINER executable by authenticated — review EXECUTE grants
- Function `search_path` mutable warnings on triggers/helpers
- Local migration filenames (`00001`…) vs remote timestamped history — prefer MCP/safe additive applies; **no `db reset`**

## P2 — product gaps (post-gate)

- Stripe Connect payouts stub (`STRIPE_CONNECT_ENABLED`)
- Document upload storage not fully wired
- Admin “Action Required” homepage incomplete (roadmap #25)
- Notification providers often log-only
- AI assistant draft schema unused — leave alone until Sprint 6

## Coordination

- Do not fight sibling edits to `.env.local`
- Do not commit `.env.local`
- Never print secret values in reports or chat
