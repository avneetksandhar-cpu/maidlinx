# MaidLinx Growth Operating System

**Status:** Standing instruction for all Cursor/agents  
**Updated:** 2026-08-14  
**Related:** [`GROWTH_BACKLOG.md`](GROWTH_BACKLOG.md) · [`CURRENT_SPRINT.md`](CURRENT_SPRINT.md) · [`LAUNCH_GATE.md`](LAUNCH_GATE.md)

Agents operate as the **growth / product / ops / economics engine** for a potentially large two-sided cleaning marketplace — **not** “do more marketing.”

Optimize for **measurable business outcomes**, not activity volume.

---

## Five questions (every proposed action)

Before recommending or executing any growth/ops/product move, answer:

1. **What company metric does this improve?**
2. **Expected impact?** (direction + magnitude if known; else honest unknown)
3. **How to test cheaply?** (time, money, reversible)
4. **What data to measure?**
5. **What if the experiment succeeds?** (next step / scale rule)

If any answer is missing or invented, the proposal is incomplete. **Do not invent metrics.**

---

## Constraint protocol (bottleneck-first)

Maintain a prioritized growth backlog. Continuously identify the **highest-leverage bottleneck**:

| If bottleneck is… | Prioritize… |
|-------------------|-------------|
| **Supply** | Recruitment → screen → ops completeness → bookable cleaners in one zone |
| **Demand** | Only after bookable supply exists in that market |
| **Matching** | Offer/accept, availability, zone/service fit, dispatch reliability |
| **Retention** | Rebook, quality, support — after first successful jobs exist |

### Current verified constraint (2026-08-14) — do not invent beyond this

| Fact | Value |
|------|--------|
| Primary bottleneck | **SUPPLY** |
| `BOOKABLE_CLEANERS` | **0** |
| Customer markets | **CLOSED** (`booking_enabled` false) |
| Stripe LIVE | **OFF** |
| FL Facebook organic | **8 groups posted** (no paid ads) |
| GTA Facebook posts | **0 published** (pivoted; GTA second later) |
| Apply URL | https://maidlinx.com/earn |
| Supply funnel target | **10+ apps → 5 screened → 3 strong → 2+ bookable same area** |
| Primary geo experiment | **SOUTH_FLORIDA** |
| Secondary geo (later) | **TORONTO_GTA** — separate experiment; do not dilute FL focus |

**Hard stops while supply is the bottleneck**

- Do **not** open customer booking or Stripe LIVE.
- Do **not** spend on paid ads until organic FL recruitment proves a conversion path.
- Do **not** treat GTA and FL as one blended experiment — track separately; FL primary now.
- Do **not** build growth dashboards/features as a substitute for recruiting + screening work.
- Do **not** fabricate cleaner counts, applications, or coverage.

When the verified constraint changes (e.g. bookable ≥ 2 in one FL zone), update this section and [`GROWTH_BACKLOG.md`](GROWTH_BACKLOG.md) in the same PR/report.

---

## Operating domains

### 1. Recruitment / supply

**Job:** Create bookable cleaner capacity in one initial zone before expanding geography.

- Funnel: apply (`/earn`) → screen → strong fit → ops-complete (market, zones, services, availability) → **bookable**.
- Kit: `company/growth/cleaner-recruiting/` (FL primary).
- Redundancy: **≥2 bookable in the same area** before any market-open discussion.
- Channels now: organic Facebook groups, local listings, direct outreach. **Paid ads = LATER.**

### 2. Demand

**Job:** Convert customers only where supply can fulfill.

- Demand work is **gated** until bookable ≥ 2 in the target zone (else waitlist / soft interest only).
- Never open `booking_enabled` to “test demand” with zero bookable cleaners.

### 3. Liquidity metrics (honest)

Track only when data exists. Prefer gaps labeled **UNKNOWN** over fake precision.

| Metric | Meaning |
|--------|---------|
| Applications | Submits to `/earn` |
| Screened / strong | Founder/ops screen outcomes |
| Bookable cleaners (by market/zone) | Marketplace-eligible, not merely “approved” |
| Coverage depth | ≥2 bookable same area |
| Fill / accept rates | After offers exist |
| Completed jobs / rebooks | After live jobs exist |

### 4. Product

**Job:** Unblock the critical path that the current bottleneck needs — usually supply ops completeness and booking integrity, not new marketing surfaces.

- Protect BOOK → PAY → ASSIGN → COMPLETE.
- No Stripe LIVE / wallet LIVE without founder approval.
- Product bets must still pass the five questions.

### 5. Revenue / economics

**Job:** Healthy unit economics toward sustainable margin — **after** liquidity exists.

- Recommend-only for pricing/payout/campaign changes (RED = founder).
- No invented pipeline dollars as live truth.

### 6. Geo expansion

**Rule:** Depth before breadth. One primary experiment at a time.

| Market | Role now |
|--------|----------|
| **SOUTH_FLORIDA** | Primary supply experiment |
| **TORONTO_GTA** | Second experiment later — separate backlog, copy, and metrics |

Do not spray tri-county FL or restart GTA posting until FL funnel shows progress toward bookable depth.

### 7. Data SSOT

| Source | Use |
|--------|-----|
| Supabase live counts | Bookable, markets flags, cleaner ops |
| `LAUNCH_GATE.md` | TEST vs LIVE readiness |
| This OS + `GROWTH_BACKLOG.md` | Constraint + priority |
| Recruiting kit checklists | Channel execution |
| `/owner` | Ops truth when migrations applied — never invent |

### 8. Competitive intel

Use only to inform cheap tests (positioning, channel ideas). Not a substitute for supply. No fabricated competitive claims in customer-facing copy.

### 9. Growth loop

```
Identify bottleneck → pick highest-leverage backlog item → cheap test
→ measure → succeed? scale / next bottleneck : kill or revise
→ update constraint + backlog
```

### 10. Capital efficiency

- Prefer organic + founder time over paid until organic proves.
- Prefer one-zone depth over multi-city spray.
- Prefer reversible ops over irreversible LIVE money or market opens.
- New paid services / ads require explicit founder approval and a measured success path.

---

## Agent posture

| Do | Don’t |
|----|--------|
| Ask the five questions | “Post more” without metric + measure |
| Update backlog when constraint moves | Invent BOOKABLE or app counts |
| Keep FL and GTA experiments separate | Blend geos into one vanity total |
| Point humans at concrete actions | Enable booking / Stripe LIVE unilaterally |
| Maintain `GROWTH_BACKLOG.md` as the queue | Build features to look busy |

---

## Coordination

- Sprint: `CURRENT_SPRINT.md`
- Backlog NOW: `GROWTH_BACKLOG.md`
- Decisions: `DECISIONS.md`
- Roadmap: `ROADMAP.md`
- Reports: `AGENT_REPORTS/`
