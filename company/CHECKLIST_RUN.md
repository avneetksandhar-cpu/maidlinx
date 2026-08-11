# Founder checklist run

**Timestamp:** 2026-08-11 (operator Maps fix + continuation)  
**Role:** Full-stack operator  
**Surfaces:** Production `https://maidlinx.com` · GCP `maidlinx-505202` · Vercel · Supabase MCP `pgoyhujsfbmfshtnlbnx`  
**Rule:** No invented PASS. Stripe TEST only. Secrets not printed (last 4 OK).

---

## Google Maps — ALL PASS (2026-08-11 operator)

| Check | Result | Evidence |
|-------|--------|----------|
| Autocomplete `100 King` | **PASS** | UI listbox showed 5 suggestions (e.g. 100 King Street East, Toronto) after fix+redeploy |
| Current location | **PASS** | Mocked GPS → filled `100 King Street West` / Toronto / ON / M5H 1H1; auto-advanced booking step |
| Reverse geocoding | **PASS** | Places nearby fallback returned structured address (Geocoder API still `REQUEST_DENIED` — billing unlinked) |

### What was fixed
1. GCP key referrers on `MaidLinx Maps Browser (local)` (prod key last4=`vmL4`): added `https://maidlinx.com/*`, `https://www.maidlinx.com/*` (kept localhost).
2. Enabled APIs: Maps JavaScript, Places API (New), Places backend, Geocoding, Static Maps.
3. Code: `locationBias` radius capped to **50_000** m (was 90k/120k → Places rejected → UI “No matches”).
4. `vercel --prod` redeploy → aliased `https://maidlinx.com`.

### Residual (non-blocking for Places UX)
- GCP **billingEnabled=false** / 0 billing accounts → classic `Geocoder` stays denied; app uses Places nearby for reverse geocode.
- Optional human: [Link billing for maidlinx-505202](https://console.cloud.google.com/billing/enable?project=maidlinx-505202)

---

## Next blocker — Booking create (STOPPED for auth)

| Item | Status |
|------|--------|
| `POST /api/bookings` (prod) | **503** `SUPABASE_NOT_CONFIGURED` |
| Vercel Production env | Only Maps + `NEXT_PUBLIC_SITE_URL` listed; **missing** Supabase URL / anon / service role + Stripe |
| Local `SUPABASE_SERVICE_ROLE_KEY` | **EMPTY** |
| Local Stripe keys | **EMPTY** |
| Supabase remote counts | bookings=1, payments=0, stripe_webhook_events=0, cleaners=0, customers=1, users=1, markets=2, service_zones=6, payouts=0 |
| Stripe MCP | Connected **livemode=true** only — need TEST (`livemode=false`) |

**Human auth required now:** Supabase dashboard sign-in to reveal **service_role** key for Vercel + `.env.local`.

**URL open:** https://supabase.com/dashboard/sign-in?returnTo=%2Fproject%2Fpgoyhujsfbmfshtnlbnx%2Fsettings%2Fapi  

**Click:** **Continue with GitHub** (or Sign in with email/password), then open **Project Settings → API** → reveal `service_role` (do not paste in chat — resume agent after login; agent will set Vercel/local).

---

## Prior QA results (still valid except Maps)

| Check | Result | Evidence / notes |
|-------|--------|------------------|
| Google autocomplete | **PASS** | Updated above |
| Current location | **PASS** | Updated above |
| Booking storage | **FAIL** | Service role missing on Vercel + local EMPTY |
| Supabase (bookings table) | historical row only | Not a new checklist booking |
| Stripe test | **FAIL** | Keys EMPTY; MCP livemode only |
| Webhook | **FAIL** | `stripe_webhook_events=0` |
| Admin / Cleaner / Status / Completion | **FAIL** | Blocked by booking create + 0 cleaners |
| Mobile ~390px | **PASS*** | Prior audit |

### Env snapshot (FOUND / EMPTY only)

| Variable | Local `.env.local` | Vercel Production |
|----------|-------------------|-------------------|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | FOUND (`vmL4`) | FOUND |
| `NEXT_PUBLIC_SITE_URL` | FOUND | FOUND |
| `NEXT_PUBLIC_SUPABASE_URL` / `ANON` | FOUND | **MISSING** (needs set) |
| `SUPABASE_SERVICE_ROLE_KEY` | EMPTY | **MISSING** |
| Stripe publishable / secret / webhook | EMPTY | **MISSING** |
