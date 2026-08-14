# MaidLinx Growth Backlog

**Updated:** 2026-08-14  
**OS:** [`GROWTH_OPERATING_SYSTEM.md`](GROWTH_OPERATING_SYSTEM.md)  
**Constraint:** **SUPPLY** — `BOOKABLE_CLEANERS = 0` · markets CLOSED · Stripe LIVE OFF · FL primary

Every item: **metric** · **cheap test** · **measure** · **success path**.  
Paid ads marked **LATER** until organic proves.

---

## NOW — P0 Supply (SOUTH_FLORIDA)

### P0-1 — Drive FL applications via organic Facebook (continue)

| Field | Content |
|-------|---------|
| **Metric** | Applications to https://maidlinx.com/earn (FL) |
| **Cheap test** | Keep posting/engaging in FL cleaning/job groups (8 already posted; expand only if groups allow). Use kit in `company/growth/cleaner-recruiting/`. |
| **Measure** | App count + which group/channel (manual log OK). Target: **10+** apps. |
| **Success path** | Move to screening cadence (P0-2). Do not open booking. |
| **Status** | IN PROGRESS — 8 FL groups posted; no paid ads |

### P0-2 — Screen toward strong FL fits

| Field | Content |
|-------|---------|
| **Metric** | Screened count; strong-fit count |
| **Cheap test** | Founder/ops short screen per `screening-notes.md` (experience, supplies, transport, zone, IC clarity). |
| **Measure** | **5 screened → 3 strong** (funnel target). |
| **Success path** | Ops-complete strongest candidates (P0-3). Reject politely; no fake “approved for launch.” |
| **Status** | WAITING on applications |

### P0-3 — Ops-complete → bookable in one FL zone

| Field | Content |
|-------|---------|
| **Metric** | `BOOKABLE_CLEANERS` in one SOUTH_FLORIDA zone (≥2) |
| **Cheap test** | Enter real market/zones/services/availability at `/owner/cleaners/[id]` for strong applicants only. Do not invent data for `ba902d50` market if unknown. |
| **Measure** | Marketplace eligibility truth (approved + active + market + zone + service + availability). Target: **2+ bookable same area**. |
| **Success path** | Unlock P1 liquidity proof. Markets stay CLOSED until founder decides. |
| **Status** | BLOCKED on P0-1/P0-2 |

### P0-4 — Optional organic FL channels (Craigslist / direct outreach)

| Field | Content |
|-------|---------|
| **Metric** | Incremental `/earn` applications |
| **Cheap test** | IC-safe listings + respectful DMs to independents already advertising in Miami-Dade / Broward / Palm Beach. |
| **Measure** | Apps attributed to channel vs FB-only baseline. |
| **Success path** | Double down on channels that convert; kill ones that don’t. |
| **Status** | READY after/alongside FB |

---

## NEXT — P1 Liquidity proof (after bookable ≥ 2 same FL zone)

### P1-1 — Controlled TEST jobs in one FL zone (Stripe TEST only)

| Field | Content |
|-------|---------|
| **Metric** | Completed TEST bookings; offer→accept→complete |
| **Cheap test** | Founder-enable `booking_enabled` for SOUTH_FLORIDA only in TEST; run 1–2 controlled jobs. Stripe LIVE stays OFF. |
| **Measure** | Lifecycle PASS with real bookable cleaners; no stranded customers. |
| **Success path** | Decide demand thaw (P2) vs more supply depth. |
| **Status** | GATED on P0-3 |

### P1-2 — Matching reliability check

| Field | Content |
|-------|---------|
| **Metric** | Offer accept rate; time-to-assign; no-show risk |
| **Cheap test** | Manual offer path first; note gaps without building new product. |
| **Measure** | Qualitative log + any existing `/owner` signals. |
| **Success path** | Fix ops gaps; only then consider auto-match tuning. |
| **Status** | GATED on P1-1 |

---

## LATER — P2 Demand (only after bookable ≥ 2)

### P2-1 — FL customer waitlist / soft interest (no open market required)

| Field | Content |
|-------|---------|
| **Metric** | Waitlist / interest signups in FL geo |
| **Cheap test** | Existing waitlist path if migration applied; organic posts pointing to waitlist — not paid. |
| **Measure** | Signups; do not treat as revenue. |
| **Success path** | Warm list for when booking opens. |
| **Status** | LATER — do not prioritize over supply |

### P2-2 — Open FL customer booking (founder RED)

| Field | Content |
|-------|---------|
| **Metric** | Paid bookings (still Stripe TEST until LIVE approved); fill rate |
| **Cheap test** | Enable `booking_enabled` for SOUTH_FLORIDA only after coverage GREEN (≥2 bookable). |
| **Measure** | Bookings created, paid, completed, cleaner utilization. |
| **Success path** | Retention loop; then consider Stripe LIVE (separate RED). |
| **Status** | LATER — founder only |

---

## LATER — P3 TORONTO_GTA (separate experiment)

GTA is **not** cancelled — it is **second**. Do not mix GTA vanity metrics with FL.

### P3-1 — Resume GTA organic supply when FL has depth

| Field | Content |
|-------|---------|
| **Metric** | GTA applications → bookable in one GTA zone |
| **Cheap test** | Same kit patterns; swap geography; 0 GTA FB posts published as of 2026-08-14 pivot. |
| **Measure** | Separate funnel from FL. Same 10→5→3→2+ target in one area. |
| **Success path** | Independent GTA liquidity proof. |
| **Status** | DEFERRED — FL primary |

---

## LATER — Paid acquisition (after organic proves)

### L-ADS-1 — Paid cleaner recruitment (Meta/Indeed/etc.)

| Field | Content |
|-------|---------|
| **Metric** | Cost per application; cost per bookable cleaner |
| **Cheap test** | Small capped budget **only after** organic FL shows nonzero app→screen→bookable conversion. |
| **Measure** | CPA vs organic baseline; kill if worse unit economics. |
| **Success path** | Scale channels with proven CPA to bookable. |
| **Status** | **LATER — blocked until organic proves** |

### L-ADS-2 — Paid customer demand ads

| Field | Content |
|-------|---------|
| **Metric** | Cost per booked/completed job |
| **Cheap test** | Only with bookable ≥ 2 and booking open in that market. |
| **Measure** | CAC vs contribution margin (honest; no invented LTV). |
| **Success path** | Scale if unit economics hold. |
| **Status** | **LATER — after supply + organic demand path** |

---

## Explicitly not now

- New growth dashboards / product features “for marketing”
- Stripe LIVE / Connect LIVE / wallet LIVE
- Enabling `booking_enabled` with BOOKABLE=0
- Fabricating cleaners or application counts
- Broad multi-city or GTA+FL simultaneous spray
- AI campaign auto-send

---

## How to refresh this file

1. Re-read verified constraint in `GROWTH_OPERATING_SYSTEM.md`.
2. Re-rank: supply → liquidity → demand → retention → geo #2 → paid.
3. Every new item must include metric / cheap test / measure / success path.
