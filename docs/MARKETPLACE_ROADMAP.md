# MaidLinx Marketplace Roadmap

**Matching + scheduling is the marketplace core** (Uber principles, not Uber UI):
eligible supply → explainable rank → assign/offer → track → complete → rebook.

> **Closest ≠ quickest.** Travel time (ETA), availability, reliability, and
> customer history beat raw nearest-neighbor distance. See [`MATCHING.md`](./MATCHING.md).

Related docs:

| Doc | Role |
|-----|------|
| [`MATCHING.md`](./MATCHING.md) | Match Engine V1 eligibility, weights, admin assign |
| [`ALGORITHMS.md`](./ALGORITHMS.md) | Full algorithm system map + contracts |
| [`SETUP_TODAY.md`](../SETUP_TODAY.md) | Local setup → book → admin assign → track |
| [`MARKETPLACE.md`](./MARKETPLACE.md) | Markets / services config |

---

## Customer path (product)

```
address → estimate → service → schedule → pay → assign → track → rate → rebook
```

Statuses shared with booking UX (do not fork):

`pending_payment` → `confirmed` / `awaiting_assignment` → `assigned` →
`on_the_way` → `arrived` → `in_progress` → `completed`

---

## V1 — Foundation (ship / harden now)

Manual marketplace ops with a real engine underneath.

| Capability | Status | Module |
|------------|--------|--------|
| Multi-factor match score (not nearest-only) | **Live** | `src/lib/matching/` |
| Eligibility **before** score | **Live** | `eligibility.ts` |
| Explainable factor breakdowns for admin | **Live** | `calculateMatchScore.ts` |
| Admin ranked assign / offer / accept | **Live** | `assignment.ts` + admin matches API |
| Double-book + travel buffer | **Live** | `src/lib/availability/` |
| Job duration from pricing rules | **Live** | `pricing.estimateDurationMinutes` → matching |
| Customer status timeline | **Live** | `status-timeline` + confirmation/dashboard |
| Haversine travel ETA display | **Live (simple)** | `src/lib/eta/` → booking load |
| Funnel analytics hooks | **Live (console/no-op)** | `src/lib/analytics/booking-funnel.ts` |
| Stripe deposit + auth | **Live** | unchanged — do not break |

**Admin ranked assign:** open booking → Suggested/Eligible cleaners (score + WHY) →
Assign or Create offer. Weights tuned only in `src/lib/matching/config.ts`.

---

## V2 — Automation layer

Build on V1 contracts; do not replace the scorer.

| Capability | Status |
|------------|--------|
| Automated matching / auto-offer top N | Planned |
| Availability engine → real slot generation from cleaner capacity | Partial (`suggestArrivalWindows` structured for supply) |
| Customer/cleaner notifications on status + ETA | Planned |
| Preferred cleaners / favorites in dispatch | Soft boost live; UX polish later |
| Recurring bookings | Planned |

---

## V3 — Reliability & growth

| Capability | Status |
|------------|--------|
| Dedicated reliability composite (lateness, disputes) | Stub `src/lib/reliability/` |
| Live ETA (maps / on-the-way refresh) | Stub-ready `src/lib/eta/` |
| Demand forecasting → hiring / incentives | Stub `src/lib/demand/` |
| Fraud / risk gates | Stub `src/lib/fraud/` |
| Recommendations (cadence, extras) | Stub `src/lib/recommendations/` |

---

## V4 — Multi-job optimization

Batch / route optimization across a cleaner's day.

| Capability | Status |
|------------|--------|
| Multi-job schedule optimizer | **Interface stub only** — `src/lib/matching/batch.ts` |
| Cross-booking travel minimization | Future |
| Dynamic rebalancing when jobs cancel | Future |

Do **not** fake a full V4 batch optimizer. The stub documents the contract for later.

---

## Rank factors (V1)

Weights sum to 100 (`config.ts`):

1. **Travel / ETA** — time + distance; closest ≠ quickest  
2. **Reliability** — completion vs cancel rates  
3. **Customer rating**  
4. **Service qualification / experience** (job type fit)  
5. **Schedule / availability fit**  
6. **Repeat customer / favorites**  
7. **Operational fit + workload balancing** (day load, vehicle, payout fit)

---

## Coordination with booking UX

- Share statuses and booking fields (`scheduled_at`, `estimated_duration_minutes`,
  `professional_profile_id`, cleaner display, ETA minutes).
- Marketplace agents own `src/lib/matching`, `availability`, `eta`, `demand`, docs.
- Booking UX agents own customer UI flows — do not fight redesigns; keep APIs stable.
