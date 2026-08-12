# Launch Phase 1 — Dual-market verify + owner cleaner ops

**Date:** 2026-08-12  
**Branch:** `split/o-launch-gate` (PR #16)  
**Stripe LIVE:** OFF · **NEW_COST:** $0

## Verdict

TORONTO_GTA and SOUTH_FLORIDA remain independent and both **🔴 RED** (0 bookable). Architecture verified; gap fixed so founder can enter REAL cleaner ops without fabricating data. Markets stay `booking_enabled=false` / `launch_enabled=false`.

## Verify (1–10)

| # | Check | Result |
|---|-------|--------|
| 1 | Markets independent | PASS — separate flags, coverage, currency |
| 2 | Cleaner self-onboarding | PASS — `/pro/settings` market/zones/services; `/pro/availability` + unavailable dates |
| 3 | Owner/admin enter/edit | **FIXED** — `/owner/cleaners/[id]` + `PUT /api/owner/cleaners/[id]` |
| 4 | Authoritative eligibility | PASS — `checkMarketplaceCleanerEligibility` (strict default in matching) |
| 5 | Matching gates | PASS — market, zone, service, availability, approval, active, overlaps |
| 6 | `/owner/cleaners` table | PASS — approved/active/services/zones/avail + Bookable YES/NO + exact blocker + Edit |
| 7 | Per-market RED/YELLOW/GREEN | PASS — independent; GREEN needs ≥2 bookable |
| 8 | Address → market | PASS — unit tests GTA CAD / FL USD |
| 9 | Independent booking/launch flags | PASS — migration `00032`; both false |
| 10 | No fabricated cleaners | PASS — stop for HUMAN_INPUT |

## Shipped this pass

- `src/lib/owner/cleaner-ops.ts` — load/save market, zones, services, availability, unavailable dates, online
- `GET/PUT /api/owner/cleaners/[cleanerId]` (`cleaners.read` / `cleaners.write`)
- `/owner/cleaners/[cleanerId]` owner ops UI
- Coverage table: Bookable YES/NO, primary blocker, Edit link
- Admin cleaners table: Ops link → owner editor

## HUMAN_INPUT_REQUIRED

1. `/owner/cleaners` — review independent market status  
2. `/owner/cleaners/<uuid>` for approved cleaner `ba902d50-…` — enter REAL market + zones + services + availability (+ unavailable dates + online)  
3. `/admin/cleaners` — approve/activate additional cleaners as needed  
4. Do not enable `/admin/markets` booking/launch flags until that market’s coverage is ready  
5. Keep Stripe LIVE off  

## Costs

NEW_COST: $0 (no paid services, no Stripe LIVE, no new vendor products)
