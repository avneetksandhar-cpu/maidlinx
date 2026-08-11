# Matching — Match Engine V1

Canonical architecture: [`docs/ALGORITHMS.md`](../../../docs/ALGORITHMS.md) §1 ·
product notes: [`docs/MATCHING.md`](../../../docs/MATCHING.md) ·
roadmap: [`docs/MARKETPLACE_ROADMAP.md`](../../../docs/MARKETPLACE_ROADMAP.md).

Deterministic, explainable ranking. **No AI/ML.** Eligibility runs before scoring.
**Closest ≠ quickest** — Travel Fit favors ETA over raw km.

## Layout

| File | Role |
|------|------|
| `types.ts` | Booking/cleaner/context + factor breakdown types |
| `config.ts` | **Only** place weights/thresholds are tuned |
| `eligibility.ts` | Hard gates — ineligible cleaners never scored |
| `calculateMatchScore.ts` | Score 0–100 + WHY breakdown labels |
| `rank.ts` / `rankCleaners.ts` | Filter → score → sort |
| `assignment.ts` | Offer / accept / admin assign / reassign / cancel |
| `geo.ts` | Distance helpers (no Maps API) |
| `batch.ts` | V4 multi-job optimizer **stub** (throws TODO) |

## Weights (`config.ts`)

Travel/ETA 25 · Reliability 20 · Customer Rating 15 · Service Experience 15 · Schedule Fit 10 · Repeat Customer 10 · Operational + workload 5

## Admin

`GET /api/admin/bookings/[id]/matches` → ranked eligible cleaners with breakdowns.
`POST /api/admin/bookings/[id]/offers` → create offer.
Cleaner: `POST /api/cleaner/offers/[id]/accept`.
