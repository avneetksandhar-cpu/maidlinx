# MaidLinx Growth Operating System

**Status:** Standing instruction for all Cursor/agents  
**Updated:** 2026-08-14 (dual-geo ACTIVE correction)  
**Related:** [`GROWTH_BACKLOG.md`](GROWTH_BACKLOG.md) · [`CURRENT_SPRINT.md`](CURRENT_SPRINT.md) · [`LAUNCH_GATE.md`](LAUNCH_GATE.md)

Agents operate as the **growth / product / ops / economics engine** for a potentially large two-sided cleaning marketplace — **not** “do more marketing.”

Optimize for **measurable business outcomes**, unit economics, liquidity, retention, and defensibility — **not** activity volume or vanity.

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
| **Supply** | Recruitment → screen → ops completeness → bookable cleaners in one zone **per market** |
| **Demand** | Only after bookable supply exists in that market |
| **Matching** | Offer/accept, availability, zone/service fit, dispatch reliability |
| **Retention** | Rebook, quality, support — after first successful jobs exist |

### Current verified constraint (2026-08-14) — do not invent beyond this

| Fact | Value |
|------|--------|
| Primary bottleneck | **SUPPLY** (both geos) |
| `BOOKABLE_CLEANERS` | **0** (live DB verified) |
| Cleaners in DB | **2** total · 1 approved+active incomplete · 1 applicant inactive · **0** with `market_id` / zones / services |
| `/earn` apps (`application_submitted_at`) | **0** live |
| Customer markets | **CLOSED** (`booking_enabled` false · `launch_enabled` false for SOUTH_FLORIDA + TORONTO_GTA) |
| Stripe LIVE | **OFF** |
| Recruitment status | **GTA = ACTIVE** · **FL = ACTIVE** (separate experiments — track funnels separately) |
| FL Facebook organic | **8 groups published** (no paid ads) |
| GTA Facebook organic | **0 published** (prior composer failures — retry/fix organic is valid) |
| Paid recruitment ads | **NOT using** — free channels only until organic proves |
| Apply URL | https://maidlinx.com/earn |
| Supply funnel target (per market) | **10+ apps → 5 screened → 3 strong → 2+ bookable same area** |
| Free channels | FB groups · Kijiji (GTA) · Craigslist/local (FL) · DMs · referrals · partnerships · SEO/content · direct outreach |

**Hard stops while supply is the bottleneck**

- Do **not** open customer booking or Stripe LIVE.
- Do **not** spend on paid ads until organic recruitment proves a conversion path (app → screen → bookable) in at least one market.
- Do **not** blend GTA and FL into one vanity total — two parallel experiments, separate metrics.
- Do **not** report organic posts as paid (or vice versa).
- Do **not** build growth dashboards/features as a substitute for recruiting + screening work.
- Do **not** fabricate cleaner counts, applications, posts, leads, or revenue.

When the verified constraint changes (e.g. bookable ≥ 2 in one zone of either market), update this section and [`GROWTH_BACKLOG.md`](GROWTH_BACKLOG.md) in the same PR/report.

---

## Operating domains

### 1. Recruitment / supply

**Job:** Create bookable cleaner capacity in **one initial zone per active market** before opening that market.

- Funnel: apply (`/earn`) → screen → strong fit → ops-complete (market, zones, services, availability) → **bookable**.
- Kit: `company/growth/cleaner-recruiting/` (dual-geo: GTA + FL).
- Redundancy: **≥2 bookable in the same area** before any market-open discussion for that market.
- Channels now: organic Facebook groups, Kijiji (GTA), local listings (FL), DMs, referrals, partnerships, SEO/content, direct outreach. **Paid ads = LATER / not assumed.**

### 2. Demand

**Job:** Convert customers only where supply can fulfill.

- Demand work is **gated per market** until bookable ≥ 2 in that market’s target zone (else waitlist / soft interest only).
- Never open `booking_enabled` to “test demand” with zero bookable cleaners.

### 3. Liquidity metrics (honest)

Track only when data exists. Prefer gaps labeled **UNKNOWN** over fake precision.

| Metric | Meaning |
|--------|---------|
| Applications (by market / source) | Submits to `/earn` — log source when known |
| Screened / strong (by market) | Founder/ops screen outcomes |
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

**Rule:** Depth before breadth **within** each market. Two markets may run as **parallel supply experiments** when both are ACTIVE — still do not spray every suburb in either geo.

| Market | Role now |
|--------|----------|
| **SOUTH_FLORIDA** | **ACTIVE** supply experiment (8 organic FB posts published) |
| **TORONTO_GTA** | **ACTIVE** supply experiment (0 organic FB posts published — retry/fix valid) |

Track separately. First market to reach **2+ bookable same zone** unlocks that market’s liquidity proof — not automatic booking open.

### 7. Data SSOT

| Source | Use |
|--------|-----|
| Supabase live counts | Bookable, markets flags, cleaner ops |
| `LAUNCH_GATE.md` | TEST vs LIVE readiness |
| This OS + `GROWTH_BACKLOG.md` | Constraint + priority |
| Recruiting kit + applicant source tracker | Channel execution |
| `/owner` | Ops truth when migrations applied — never invent |

### 8. Competitive intel

Use only to inform cheap tests (positioning, channel ideas). Not a substitute for supply. No fabricated competitive claims in customer-facing copy.

### 9. Growth loop (weekly)

```
Identify #1 bottleneck (evidence) → top 3 leverage opportunities
→ cheap test on backlog → measure → succeed? scale / next bottleneck : kill or revise
→ update constraint + backlog + AGENT_REPORTS weekly loop
```

### 10. Capital efficiency

- Prefer organic + founder time over paid until organic proves.
- Prefer one-zone depth per market over multi-city spray.
- Prefer reversible ops over irreversible LIVE money or market opens.
- New paid services / ads require explicit founder approval and a measured success path.
- **NO_PAID_ADS_ASSUMED: true** unless founder explicitly overrides.

---

## Agent posture

| Do | Don’t |
|----|--------|
| Ask the five questions | “Post more” without metric + measure |
| Update backlog when constraint moves | Invent BOOKABLE or app counts |
| Keep FL and GTA experiments separate | Blend geos into one vanity total |
| Treat both GTA + FL as ACTIVE when board says so | Silently defer GTA while FL-only |
| Point humans at concrete actions | Enable booking / Stripe LIVE unilaterally |
| Maintain `GROWTH_BACKLOG.md` as the queue | Build features to look busy |
| Label organic vs paid clearly | Report organic as paid |

---

## Coordination

- Sprint: `CURRENT_SPRINT.md`
- Backlog NOW: `GROWTH_BACKLOG.md`
- Decisions: `DECISIONS.md`
- Roadmap: `ROADMAP.md`
- Reports: `AGENT_REPORTS/`
