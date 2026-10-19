# MaidLinx Growth Backlog

**Updated:** 2026-08-14 (dual-geo ACTIVE)  
**OS:** [`GROWTH_OPERATING_SYSTEM.md`](GROWTH_OPERATING_SYSTEM.md)  
**Constraint:** **SUPPLY** — `BOOKABLE_CLEANERS = 0` · markets CLOSED · Stripe LIVE OFF · **GTA ACTIVE** · **FL ACTIVE** (separate funnels)  
**NO_PAID_ADS_ASSUMED:** true

Every item: **metric** · **cheap test** · **measure** · **success path**.  
Paid ads marked **LATER** until organic proves. Do not blend GTA + FL vanity totals.

---

## NOW — P0 Supply A (SOUTH_FLORIDA) — ACTIVE

### P0-FL-1 — Drive FL applications via organic Facebook (continue)

| Field | Content |
|-------|---------|
| **Metric** | Applications to https://maidlinx.com/earn attributed FL |
| **Cheap test** | Keep posting/engaging in FL cleaning/job groups (8 already posted; expand only if groups allow). Kit: `company/growth/cleaner-recruiting/`. |
| **Measure** | App count + source log. Target: **10+** FL apps. |
| **Success path** | Screening cadence (P0-FL-2). Do not open booking. |
| **Status** | IN PROGRESS — 8 FL organic groups posted; no paid ads |

### P0-FL-2 — Screen toward strong FL fits

| Field | Content |
|-------|---------|
| **Metric** | Screened count; strong-fit count (FL) |
| **Cheap test** | Founder/ops short screen per `screening-notes.md`. |
| **Measure** | **5 screened → 3 strong**. |
| **Success path** | Ops-complete strongest (P0-FL-3). |
| **Status** | WAITING on applications |

### P0-FL-3 — Ops-complete → bookable in one FL zone

| Field | Content |
|-------|---------|
| **Metric** | `BOOKABLE_CLEANERS` in one SOUTH_FLORIDA zone (≥2) |
| **Cheap test** | Enter real market/zones/services/availability at `/owner/cleaners/[id]` for strong applicants only. Do not invent data for `ba902d50` if market unknown. |
| **Measure** | Marketplace eligibility truth. Target: **2+ bookable same area**. |
| **Success path** | Unlock FL P1 liquidity proof. Markets stay CLOSED until founder decides. |
| **Status** | BLOCKED on P0-FL-1/2 |

### P0-FL-4 — Optional organic FL channels (Craigslist / DMs / referrals)

| Field | Content |
|-------|---------|
| **Metric** | Incremental `/earn` applications (FL source) |
| **Cheap test** | IC-safe listings + respectful DMs to independents in Miami-Dade / Broward / Palm Beach. |
| **Measure** | Apps by channel vs FB-only baseline. |
| **Success path** | Double down on converting channels. |
| **Status** | READY alongside FB |

---

## NOW — P0 Supply B (TORONTO_GTA) — ACTIVE

### P0-GTA-1 — Publish organic GTA Facebook posts (retry after composer failures)

| Field | Content |
|-------|---------|
| **Metric** | GTA organic FB groups published (honest count); then `/earn` apps attributed GTA |
| **Cheap test** | Retry/fix 5–10 GTA cleaning/job groups with prepared copy. Prefer **show-before-post** / founder approval. Do not spam. |
| **Measure** | Posts published ≠ 0; then apps. Target: **10+** GTA apps (same funnel). |
| **Success path** | Screening (P0-GTA-2). Keep separate from FL totals. |
| **Status** | **RECOMMENDED / NEEDS HUMAN APPROVAL** — 0 GTA posts published; copy + shortlist prepared |

### P0-GTA-2 — Screen toward strong GTA fits

| Field | Content |
|-------|---------|
| **Metric** | Screened / strong (GTA) |
| **Cheap test** | Same screening notes; GTA zone focus (Toronto / Brampton / Mississauga depth). |
| **Measure** | **5 screened → 3 strong**. |
| **Success path** | Ops-complete (P0-GTA-3). |
| **Status** | WAITING on applications |

### P0-GTA-3 — Ops-complete → bookable in one GTA zone

| Field | Content |
|-------|---------|
| **Metric** | `BOOKABLE_CLEANERS` in one TORONTO_GTA zone (≥2) |
| **Cheap test** | Real ops completeness only for verified GTA applicants. |
| **Measure** | **2+ bookable same area**. |
| **Success path** | Unlock GTA P1 liquidity proof (independent of FL). |
| **Status** | BLOCKED on P0-GTA-1/2 |

### P0-GTA-4 — Kijiji + GTA DMs / referrals

| Field | Content |
|-------|---------|
| **Metric** | Incremental GTA `/earn` applications |
| **Cheap test** | Kijiji IC-safe listing + respectful DMs to independents already advertising in GTA. |
| **Measure** | Apps by channel. |
| **Success path** | Scale channels that convert; kill those that don’t. |
| **Status** | READY alongside / after first FB posts |

---

## Shared P0 — Attribution hygiene

### P0-ATTR-1 — Applicant source tracker (markdown)

| Field | Content |
|-------|---------|
| **Metric** | % of apps with known market + channel |
| **Cheap test** | Manual log in `company/growth/applicant-source-tracker.md` (no new dashboard). |
| **Measure** | Rows filled when apps arrive; UNKNOWN allowed. |
| **Success path** | Know which free channel converts before any paid spend. |
| **Status** | READY |

---

## NEXT — P1 Liquidity proof (after bookable ≥ 2 in that market)

### P1-1 — Controlled TEST jobs in the first ready market (Stripe TEST only)

| Field | Content |
|-------|---------|
| **Metric** | Completed TEST bookings; offer→accept→complete |
| **Cheap test** | Founder-enable `booking_enabled` for **one** market only in TEST; 1–2 controlled jobs. Stripe LIVE stays OFF. |
| **Measure** | Lifecycle PASS with real bookable cleaners; no stranded customers. |
| **Success path** | Decide demand thaw (P2) vs more supply depth. |
| **Status** | GATED on P0-FL-3 **or** P0-GTA-3 |

### P1-2 — Matching reliability check

| Field | Content |
|-------|---------|
| **Metric** | Offer accept rate; time-to-assign; no-show risk |
| **Cheap test** | Manual offer path first; note gaps without building new product. |
| **Measure** | Qualitative log + any existing `/owner` signals. |
| **Success path** | Fix ops gaps; only then consider auto-match tuning. |
| **Status** | GATED on P1-1 |

---

## LATER — P2 Demand (only after bookable ≥ 2 in that market)

### P2-1 — Customer waitlist / soft interest (no open market required)

| Field | Content |
|-------|---------|
| **Metric** | Waitlist / interest signups by geo |
| **Cheap test** | Existing waitlist path if migration applied; organic posts — not paid. |
| **Measure** | Signups; do not treat as revenue. |
| **Success path** | Warm list for when booking opens. |
| **Status** | LATER — do not prioritize over supply |

### P2-2 — Open customer booking (founder RED)

| Field | Content |
|-------|---------|
| **Metric** | Paid bookings (still Stripe TEST until LIVE approved); fill rate |
| **Cheap test** | Enable `booking_enabled` for **one** market after coverage GREEN (≥2 bookable). |
| **Measure** | Bookings created, paid, completed, cleaner utilization. |
| **Success path** | Retention loop; then consider Stripe LIVE (separate RED). |
| **Status** | LATER — founder only |

---

## LATER — Paid acquisition (after organic proves)

### L-ADS-1 — Paid cleaner recruitment (Meta/Indeed/etc.)

| Field | Content |
|-------|---------|
| **Metric** | Cost per application; cost per bookable cleaner |
| **Cheap test** | Small capped budget **only after** organic shows nonzero app→screen→bookable conversion in a market. |
| **Measure** | CPA vs organic baseline; kill if worse unit economics. |
| **Success path** | Scale channels with proven CPA to bookable. |
| **Status** | **LATER — blocked until organic proves · NO_PAID_ADS_ASSUMED** |

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
- Fabricating cleaners, applications, posts, leads, or revenue
- Reporting organic as paid
- Paid recruitment ads (not in use; not assumed)
- AI campaign auto-send

---

## How to refresh this file

1. Re-read verified constraint in `GROWTH_OPERATING_SYSTEM.md`.
2. Re-rank: supply (both ACTIVE geos, separate) → liquidity → demand → retention → paid.
3. Every new item must include metric / cheap test / measure / success path.
