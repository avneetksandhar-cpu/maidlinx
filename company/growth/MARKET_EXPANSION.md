# MaidLinx market expansion scoring

**Role:** Head of SEO / Local Growth / Market Expansion  
**Date:** 2026-08-11  
**Constraint:** Planning docs only. Do **not** interrupt BOOK→PAY→ASSIGN→CLEAN→COMPLETE→REBOOK.  
**Live markets (may claim service):** Toronto / GTA · South Florida  
**Inactive in product config:** New York · California (research / expansion only — do not market as live)  
**Rule:** No #1 ranking guarantees. No fake locations, reviews, or mass city-page spam.

**Related:** `SEO_ROADMAP.md` · `KEYWORD_MAP.md` · `COMPETITOR_GAPS.md` · `LOCAL_SEO.md` · `SEO_AUDIT.md`

---

## 1. Market Opportunity Score (0–100)

Composite score for **where MaidLinx should operate next**, not where to spam SEO pages.

| Factor | Weight | What it measures | Scoring guide (0–10 before weight) |
|--------|--------|------------------|--------------------------------------|
| **A. Estimated booking value** | 20% | Expected AOV × realistic density of bookable jobs (homes, STR, move volume) | 10 = dense metro + high cleaning AOV; 5 = mid; 1 = thin / low willingness-to-pay |
| **B. Competition** | 15% | Intensity of national apps + local agencies + aggregators (**inverse**: lower competition → higher score) | 10 = fragmented locals, weak digital; 5 = mixed; 1 = saturated (Handy/Taskrabbit/Thumbtack + strong locals) |
| **C. Cleaner supply** | 20% | Ability to recruit, vet, and retain enough approved cleaners for SLA | 10 = large labor pool + immigrant/gig density + easy recruiting; 1 = tight labor / high wage pressure |
| **D. Recurring potential** | 15% | Share of demand that can become weekly/biweekly residential or STR turnover | 10 = condo/suburban recurring culture strong; 5 = seasonal spikes; 1 = mostly one-off |
| **E. Commercial potential** | 10% | Offices, property managers, Airbnb hosts, venues (later P3 — still scores optionality) | 10 = dense PM / STR / office corridors; 1 = mostly single-family one-offs |
| **F. SEO opportunity** | 10% | Ability to win **local transactional** queries ethically with unique pages + GBP | 10 = searchable intent + weak SERP quality; 1 = SERP dominated + thin opportunity |
| **G. Cluster / ops adjacency** | 10% | Fits an existing market cluster (travel, timezone, currency, founder ops) | 10 = same cluster as live market; 5 = same country new cluster; 1 = distant / hard ops |

**Formula:**

```
Opportunity Score =
  2.0×A + 1.5×B + 2.0×C + 1.5×D + 1.0×E + 1.0×F + 1.0×G
```

Each letter is 0–10 → total **0–100**.

**Honesty rule:** Where public SERP volume, wage, or competitor depth was not measured this session, cells say **RESEARCH REQUIRED** and scores are **directional hypotheses** based on general market structure (metro size, known marketplace density, currency/ops fit). Re-score with Ahrefs/GSC/ops interviews before spend.

---

## 2. Tier definitions

| Tier | Score | Meaning | Action |
|------|-------|---------|--------|
| **TIER 1 — Dominate** | 75–100 | Live or next cluster extension with ops reality | Deepen supply + SEO hubs; **no new country clusters until SLA holds** |
| **TIER 2 — Prepare** | 60–74 | Strong candidates after Tier 1 cluster density | Scorecard refresh + supply pilot before any marketing claim |
| **TIER 3 — Watch** | 45–59 | Attractive long-term; low ops fit or high competition now | Research only; no GBP / city pages |
| **AVOID (for now)** | &lt;45 **or** ops red flags | Cannot serve honestly, or SEO-only temptation | Do not create location pages; do not claim coverage |

**Launch sequence principle:** Dominate a **cluster** (fulfillment radius + cleaner density + GBP + 2–3 hub pages) before opening the next metro. SEO follows ops — never the reverse.

---

## 3. Initial market scorecard

**Legend for qualitative cells:** High / Med / Low = directional. `$` bands are **hypothesis**, not measured AOV.

**Estimated booking value bands (hypothesis):**  
`H` ≈ premium metro AOV · `M` ≈ mid · `L` ≈ price-sensitive / thin density

### United States

| MARKET | OPPORTUNITY SCORE | ESTIMATED BOOKING VALUE | COMPETITION | CLEANER SUPPLY | RECURRING POTENTIAL | COMMERCIAL POTENTIAL | SEO OPPORTUNITY | RECOMMENDATION |
|--------|-------------------|-------------------------|-------------|----------------|---------------------|----------------------|-----------------|----------------|
| South Florida (Miami–Ft Lauderdale–Palm Beach) | **82** LIVE | H | Med–High | Med (recruit hard but doable) | H (STR + seasonal homes) | H (STR / PM) | Med | **TIER 1 — Dominate cluster** |
| Tampa Bay / St. Pete | **74** | M–H | Med | Med | H | Med–H | Med–H | **TIER 1 — Adjacent FL cluster** after SFL SLA |
| Orlando | **70** | M | Med | Med | Med–H (tourism/STR) | Med–H | Med | **TIER 2 — FL cluster extension** |
| Atlanta | **68** | M–H | Med–High | Med–H | H | Med–H | Med | **TIER 2 — Prepare** (new SE cluster) |
| Charlotte | **66** | M | Med | Med | H | Med | Med–H | **TIER 2 — SE cluster with ATL** |
| Austin | **65** | H | High | Med (tight labor) | Med–H | Med–H | Med | **TIER 2 — Watch wage/supply** |
| Dallas–Fort Worth | **64** | M–H | Med–High | Med–H | H | H | Med | **TIER 2 — TX cluster (later)** |
| Houston | **63** | M | Med | Med–H | Med–H | Med–H | Med | **TIER 2 — TX cluster (later)** |
| Phoenix | **62** | M | Med | Med | H | Med | Med–H | **TIER 2 / 3 — Climate seasonality** |
| Denver | **60** | H | Med–High | Med (wage pressure) | Med–H | Med | Med | **TIER 3 — Watch** |
| Chicago | **58** | M–H | High | Med–H | H | H | Med–Low | **TIER 3 — High competition** |
| Washington DC / NOVA | **57** | H | High | Med | H | H | Low–Med | **TIER 3 — Expensive ops** |
| Boston | **55** | H | High | Low–Med | H | Med–H | Low–Med | **TIER 3 — Wage / winter ops** |
| Philadelphia | **54** | M | Med–High | Med | H | Med | Med | **TIER 3 — Watch** |
| Seattle | **52** | H | High | Low–Med | Med–H | Med–H | Low–Med | **TIER 3 / AVOID near-term** |
| New York (config inactive) | **51** | H | Very High | Med | H | H | Low | **AVOID claim until supply + ops**; research only |
| Los Angeles / SoCal (CA inactive) | **50** | H | Very High | Med | Med–H | H | Low | **AVOID near-term** (config inactive) |
| San Diego | **53** | H | High | Med | Med–H | Med–H | Med | **TIER 3 — CA cluster only if CA ops real** |
| San Francisco Bay | **42** | H | Extreme | Low | Med | H | Low | **AVOID** (cost + competition) |
| Las Vegas | **56** | M | Med | Med | Med (STR) | Med–H | Med–H | **TIER 3 — Watch** |
| Nashville | **61** | M | Med | Med | Med–H | Med | Med–H | **TIER 2 / 3 — SE adjacency** |
| Minneapolis–St. Paul | **48** | M | Med | Med | H | Med | Med | **TIER 3 — Winter ops** |
| Portland OR | **47** | M | Med–High | Low–Med | Med | Med | Med | **AVOID near-term** |

**US RESEARCH REQUIRED before capital:** exact Google Keyword Planner / Ahrefs volumes by city; Thumbtack/Handy/Taskrabbit density audits; cleaner wage floors; MaidLinx zone polygons for any new market.

### Canada

| MARKET | OPPORTUNITY SCORE | ESTIMATED BOOKING VALUE | COMPETITION | CLEANER SUPPLY | RECURRING POTENTIAL | COMMERCIAL POTENTIAL | SEO OPPORTUNITY | RECOMMENDATION |
|--------|-------------------|-------------------------|-------------|----------------|---------------------|----------------------|-----------------|----------------|
| Toronto / GTA | **88** LIVE | H (CAD) | High but winnable locally | Med–H | H | H (condos/PM) | Med–H | **TIER 1 — Dominate cluster** |
| Hamilton / Burlington / Niagara fringe | **76** | M–H | Med | Med–H | H | Med | Med–H | **TIER 1 — GTA west adjacency** (ops-first) |
| Kitchener–Waterloo–Cambridge | **72** | M | Med | Med | H | Med–H (tech offices) | Med–H | **TIER 1 / 2 — Ontario cluster** |
| Ottawa–Gatineau | **67** | M–H | Med | Med | H | Med–H (gov/office) | Med–H | **TIER 2 — Prepare** |
| London ON | **63** | M | Low–Med | Med | H | Med | H | **TIER 2 — Ontario fill-in** |
| Calgary | **64** | M–H | Med | Med | H | Med–H | Med–H | **TIER 2 — Prairies cluster** |
| Edmonton | **60** | M | Med | Med | H | Med | Med–H | **TIER 2 / 3 — with Calgary** |
| Vancouver / Metro | **58** | H | High | Low–Med (cost) | H | H | Med–Low | **TIER 3 — High cost; watch** |
| Victoria BC | **52** | M | Med | Low–Med | H | Med | Med | **TIER 3 — Small TAM** |
| Montréal | **59** | M–H | Med–High | Med–H | H | Med–H | Med (FR content needed) | **TIER 2 / 3 — bilingual ops gate** |
| Québec City | **45** | M | Med | Med | Med–H | Med | Med (FR) | **TIER 3 — FR-first** |
| Winnipeg | **50** | M | Low–Med | Med | H | Med | H | **TIER 3 — Watch** |
| Halifax | **49** | M | Low–Med | Low–Med | Med–H | Med | H | **TIER 3 — Small metro** |
| Regina / Saskatoon | **44** | L–M | Low | Low–Med | Med | L–M | Med–H | **AVOID near-term** (thin density) |

**Canada RESEARCH REQUIRED:** bilingual (FR) content cost for Québec; BC wage/housing impact on cleaner supply; GTA zone demand heatmaps from real bookings once MVP metrics exist.

---

## 4. Tier rollup

### TIER 1 — Dominate first

1. **Toronto / GTA** (live)  
2. **South Florida** (live)  
3. **GTA adjacency** (Hamilton / Halton densify — only where `SERVICE_ZONES` already cover or Product expands)  
4. **Tampa Bay** (FL cluster — after SFL fulfillment proof)

### TIER 2 — Prepare (no marketing claims)

Atlanta · Charlotte · Orlando · Austin · DFW · Ottawa · Calgary · Kitchener–Waterloo · London ON · Houston · Nashville · Phoenix

### TIER 3 — Watch

Chicago · Denver · Vancouver · Montréal (language gate) · DC · Boston · Philly · Seattle · Winnipeg · Halifax · Vegas · San Diego

### AVOID (near-term)

SF Bay · mass CA claim without ops · NY claim while `active: false` · thin Prairie micros · any market without cleaner recruiting plan

---

## 5. Launch sequence (cluster-first)

```
Phase 0 (now)     CRITICAL MVP proof — no expansion marketing
Phase 1           Dominate GTA: supply density → GBP → /locations/toronto-gta → top zone cities ONLY if quality gate
Phase 1 parallel  Dominate South Florida: same pattern → /locations/south-florida
Phase 2           FL cluster: Tampa Bay (ops + unique pages), then Orlando if SLA holds
Phase 3           Ontario cluster: Kitchener–Waterloo / Ottawa (CAD ops reuse)
Phase 4           New US cluster (SE: Atlanta/Charlotte) OR Prairies (Calgary) — pick ONE
Phase 5           High-competition prestige metros (NY/LA/Van) only with dedicated supply budget
```

**Hard stop:** Do not open Phase 2+ if Phase 1 completion rate / assign latency fails Product SLA (define in `METRICS.md` when measured).

---

## 6. What “launch a market” means (ops + SEO)

| Gate | Required before public claim |
|------|------------------------------|
| Product | Market `active: true` + zones in `markets.ts` |
| Supply | Minimum approved cleaners per zone (**RESEARCH REQUIRED** — set with Cleaner Ops) |
| Payments | Currency + Stripe path verified for that country |
| Trust | Real NAP/GBP model per `LOCAL_SEO.md` |
| SEO | Hub page unique copy + internal links; **no** city matrix spam |
| Legal | Service area claims match actual fulfillment |

---

## 7. Anti-patterns

- Scoring a market high **only** because keyword volume looks big  
- Publishing `/locations/{city}` for cities MaidLinx cannot book  
- Treating inactive `NEW_YORK` / `CALIFORNIA` config stubs as live  
- Expanding to chase SEO before cleaner supply exists  

---

## 8. Rescore cadence

| Trigger | Action |
|---------|--------|
| First 50 completed paid jobs in a live market | Replace hypotheses with real AOV / zone heat |
| Supply crisis (assign &gt; SLA) | Freeze expansion; drop SEO city page plans |
| Product activates a market flag | Promote from research → Tier 1 prep checklist |
| Quarterly | Refresh Competition + SEO Opportunity with live SERP tools |

**Owner:** Growth (scoring) · Product (activate markets) · Cleaner Ops (supply gate) · Lead Engineer (config only when Product prioritizes)
