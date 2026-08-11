# MaidLinx Match Engine V1

Deterministic, explainable cleaner ranking for admin dispatch and offer/accept.
**No AI/ML.** Ineligible cleaners never receive a score.

> **Closest ≠ quickest.** Travel Fit weights ETA (travel minutes) over raw distance.
> A nearer cleaner stuck behind a long hop / heavy day can rank below a slightly
> farther cleaner who is free and reliable. See [`MARKETPLACE_ROADMAP.md`](./MARKETPLACE_ROADMAP.md).

## Workflow

```
confirmed → awaiting_assignment → eligible ranked → offer created → cleaner accepts → assigned
```

Admin may also **manually assign / reassign / cancel assignment** (override, audited).

## Eligibility (before scoring)

Hard gates in `src/lib/matching/eligibility.ts` (uses `src/lib/availability/`):

- not approved (`is_verified`)
- inactive
- does not offer requested service
- does not serve booking zone
- unavailable (weekly windows)
- conflicting jobs (duration from pricing + travel buffer)
- cannot reasonably reach job (radius)
- does not meet service requirements

## Score factors

Weights in `src/lib/matching/config.ts` only (sum = 100):

| Factor | Weight | Notes |
|--------|--------|-------|
| Travel / ETA Fit | 25 | Time-weighted; closest ≠ quickest |
| Reliability | 20 | Completion vs cancel |
| Customer Rating | 15 | |
| Service Experience | 15 | Job-type / specialty fit |
| Schedule Fit | 10 | Availability windows |
| Repeat Customer Match | 10 | Favorites + history |
| Operational Fit | 5 | Workload balancing + vehicle/payout |

Each factor returns a breakdown label for admin WHY, e.g. `Travel Fit 22/25`.

## Module layout

```
src/lib/matching/
  types.ts
  eligibility.ts      # hard gates BEFORE score
  calculateMatchScore.ts
  rankCleaners.ts / rank.ts
  assignment.ts
  config.ts           # ONLY place to tune weights
  geo.ts
  batch.ts            # V4 multi-job stub (TODO)
```

## Concurrency

- Optimistic lock: `UPDATE bookings … WHERE professional_profile_id IS NULL`
- Unique partial index: one `cleaner_assignments` row with `status = 'active'` per booking
- Unique partial index: one accepted `booking_offers` row per booking

## Admin UX — ranked assign

1. `/admin/bookings` → open booking detail  
2. **Eligible cleaners** list from `GET /api/admin/bookings/[id]/matches`  
3. Expand a row for factor points / WHY  
4. **Assign** (manual override) or **Create offer**  
5. Cleaner accepts via cleaner portal, or admin assign skips offer  

Customer tracking then shows: assigned → on_the_way → arrived → in_progress → completed  
(ETA minutes when cleaner + job coords available — haversine V1).

## Future

- V2: auto-offer top N, real slot generation, notifications, recurring  
- V4: `batch.ts` multi-job day optimizer (interface only today)
