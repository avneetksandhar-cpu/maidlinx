# Operator progress

**Updated:** 2026-08-11  
**Operator:** Full-stack (Lead Engineer mode)  
**Rule:** Secrets never printed (last 4 only). No redesign.

## Auth / integrations discovery

| Service | Status |
|---------|--------|
| Vercel CLI | AUTH OK (`avneetksandhar-5429`) |
| GitHub `gh` | AUTH OK (`avneetksandhar-cpu`) |
| `gcloud` CLI | FOUND at `~/google-cloud-sdk/bin` · account `avneetksandhar@gmail.com` · project `maidlinx-505202` |
| Supabase CLI | NOT FOUND |
| Supabase MCP | ready |
| Stripe MCP | ready |
| Browser MCP | ready |
| Local Maps key | FOUND last4=`vmL4` |
| Prod page Maps key | FOUND last4=`vmL4` (matches local) |
| Vercel Production Maps env | FOUND |

## Maps — DONE (all 3 PASS)

### Fixed
1. **GCP HTTP referrers** on key `MaidLinx Maps Browser (local)` (`9e979b52-…`): added `https://maidlinx.com/*`, `https://www.maidlinx.com/*` (kept localhost).
2. **APIs enabled** on `maidlinx-505202`: Maps JS, Places (New), Places backend, Geocoding, Static Maps.
3. **Code bug:** `locationBias` radius was 90k/120k m; Places max is **50_000** → UI threw and showed “No matches” even when API worked. Capped to 50_000 in `address-autocomplete.tsx`.
4. **Redeployed** production (`vercel --prod`) → aliased `https://maidlinx.com`.

### Live verification (`https://maidlinx.com/book/address`)
| Check | Result | Evidence |
|-------|--------|----------|
| Autocomplete `100 King` | **PASS** | UI listbox 5 suggestions (e.g. 100 King Street East, Toronto) |
| Current location | **PASS** | Mocked GPS → filled `100 King Street West`, Toronto, ON, M5H 1H1 |
| Reverse geocoding | **PASS** | Places nearby fallback (Geocoder API still `REQUEST_DENIED` — **billing not linked**) |

### Note — billing
`gcloud billing projects describe maidlinx-505202` → `billingEnabled: false`, **0 billing accounts**. Places works today; classic Geocoder stays denied until a human links a billing account at  
https://console.cloud.google.com/billing/enable?project=maidlinx-505202  
(Click **Link a billing account** / create billing — Google legal/payment terms).

## Post-Maps progress

- [x] Supabase MCP audit: counts OK; RLS on; users role=`customer`×1; cleaners=0
- [x] Vercel: set `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (prod+preview)
- [ ] **STOPPED:** need `SUPABASE_SERVICE_ROLE_KEY` — Supabase dashboard sign-in (human)
- [ ] Redeploy after service role set
- [ ] Customer/cleaner/admin auth roles (only customer exists; 0 cleaners/admins)
- [ ] Stripe TEST (`livemode=false`) — MCP currently livemode only
- [ ] Booking create → payment sync → confirm → assign → admin
- [ ] lint / typecheck / test / build

## STOPPED — human auth

**URL:** https://supabase.com/dashboard/sign-in?returnTo=/project/pgoyhujsfbmfshtnlbnx/settings/api  

**Click:** **Continue with GitHub**  

After login lands on API settings, resume this chat — operator will copy `service_role` into Vercel + `.env.local` (never print) and continue booking path.
