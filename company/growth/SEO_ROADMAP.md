# MaidLinx SEO roadmap

**Role:** Head of SEO / Local Growth / Market Expansion  
**Date:** 2026-08-11  
**PRIMARY KPI:** **Completed paid bookings from organic** (not rankings, not traffic alone)  
**Constraint:** Do **not** interrupt CRITICAL MVP engineering (BOOK→PAY→ASSIGN→CLEAN→COMPLETE→REBOOK)  
**Ethics:** No stuffing, hidden text, fake GBP/reviews, doorway pages, spam backlinks, mass AI city pages  
**Coordination:** Sibling technical foundations in `SEO_AUDIT.md` + `LOCAL_SEO.md` — this doc owns architecture + process; avoid conflicting mass page creation

**Related:** `KEYWORD_MAP.md` · `MARKET_EXPANSION.md` · `COMPETITOR_GAPS.md`

---

## 0. MVP non-interference

| Allowed now | Not allowed until Product unlocks |
|-------------|-----------------------------------|
| Growth docs, keyword research, GBP process design | Mass `/locations/*` publishing |
| Tiny doc cross-links | Rewriting booking funnel for SEO |
| Briefs for Lead Engineer (metadata already partly shipped) | Scope expansion that blocks CRITICAL checklist |
| Content outlines for approval | Claiming inactive markets (NY, CA) |

If SEO work needs code: write a brief → Product priority → Lead Engineer implements.

---

## 1. Page architecture

```
/                                    Home — brand + book entry (index)
/services                            Service hub (planned)
/services/{slug}                     Service spokes (planned)
/locations                           Live-market index only (planned)
/locations/toronto-gta               Market hub (planned)
/locations/south-florida             Market hub (planned)
/locations/{market}/{city}           City spoke — QUALITY GATE or NOINDEX/don't create
/for-business                        Commercial (live)
/earn                                Supply (live)
/legal/*                             Trust (planned)
/book/** , /booking/** , apps        noindex (live policy in SEO_AUDIT)
```

**Service slugs (catalog-aligned):**  
`residential` · `deep` · `move-in` · `move-out` · `airbnb` · `office` · `post-construction` · `event-venue` · `recurring`

**Do not create** city or service×city matrices programmatically without Section 4 gate.

---

## 2. Page template outline

### 2.1 Market hub (`/locations/{market}`)

1. H1: Cleaning in {Market} (brand secondary, not stuffed)  
2. Honest coverage sentence (zones MaidLinx serves)  
3. Primary CTA → start book on `/` or `/book/address`  
4. Services offered (links to `/services/{slug}`)  
5. How booking works (3–5 steps, unique to ops reality)  
6. Pricing posture (deposit / instant vs quote — no fake prices)  
7. Neighborhoods **list only if true**; link to city pages only when they exist  
8. FAQ (market-specific, SSR-visible)  
9. Trust: real NAP/GBP when available; no fake ratings schema  
10. Internal links: home, services hub, for-business, earn  

### 2.2 Service spoke (`/services/{slug}`)

1. H1: service name  
2. What’s included / not included  
3. Best for (property types)  
4. Markets available (live only)  
5. CTA book  
6. Related services + market hubs  
7. FAQ  

### 2.3 City spoke (rare)

Same as hub but **city-specific proof**: travel notes, zone reality, local photos (rights-cleared), distinct FAQ. If content ≈ hub → **do not publish** (or `noindex` until unique).

### 2.4 Commercial (`/for-business`)

Buyer persona, service types, contact/CTA, no consumer keyword duplication of H1.

---

## 3. Location page quality gate — 9 rules

Publish a location URL **only if all 9 pass**. Otherwise **do not create** or keep **`noindex`**.

| # | Rule | Fail action |
|---|------|-------------|
| 1 | Market/zone is **active** in `src/config/markets.ts` / `SERVICE_ZONES` | Don’t create |
| 2 | Ops can fulfill bookings there within stated SLA | Don’t create |
| 3 | ≥1 approved cleaner realistically assignable **or** explicit founding supply plan with date | Delay |
| 4 | Unique copy (≥ ~400 words of non-boilerplate; no spun AI twins) | `noindex` / don’t create |
| 5 | Unique local proof (photo, zone note, turnaround, parking/access reality — something real) | Delay |
| 6 | Distinct primary keyword from sibling pages (cannibalization check in `KEYWORD_MAP.md`) | Merge to hub |
| 7 | Working CTA to real book path; no dead ends | Fix before index |
| 8 | Accurate NAP/service-area consistency with GBP (`LOCAL_SEO.md`) | Fix before index |
| 9 | Founder/Product **explicit approval** to index | Stay draft/`noindex` |

**Hard ban:** Near-identical AI city pages, city-name footer blocks, fake neighborhoods.

---

## 4. Controlled programmatic SEO rules

Programmatic = templates + data — **not** spam.

| Allowed | Forbidden |
|---------|-----------|
| Template components shared across hubs | Auto-generating 1,000 city pages |
| Fields from real `MARKETS` / `SERVICE_ZONES` | Inventing cities outside zones |
| Human edit pass before `index` | Pure AI body with city string replace |
| Cap: start with **2 market hubs**; city pages **≤ 1 per sprint** after gate | Service×city×addon explosion |
| `noindex` default for drafts | Indexing stubs “to claim territory” |
| Sitemap includes only indexable URLs | Sitemap stuffing |

**Approval:** Awaiting user/Product approval before mass-publish.

---

## 5. Internal linking

```
Home ←→ Services hub ←→ Service spokes
Home ←→ Location hubs ←→ (gated) City spokes
Service spokes ←→ relevant Location hubs (live markets)
For-business ←→ office / airbnb services
Every indexable page → clear Book CTA
Earn links from supply CTAs only (not forced sitewide spam)
```

- Max logical depth: Home → Hub → Spoke (3 clicks)  
- No orphan location URLs  
- Avoid reciprocal link schemes with directories  

---

## 6. Technical SEO checklist

Coordinate with `SEO_AUDIT.md` (do not duplicate conflicting fixes).

| Item | Status / action |
|------|-----------------|
| `robots.ts` | Shipped — keep private/funnel disallowed |
| `sitemap.ts` | Shipped — add URLs only when indexable pages exist |
| Canonical / `metadataBase` | Align prod `NEXT_PUBLIC_SITE_URL` |
| noindex platform/auth/book | Shipped — preserve |
| Structured data | Org + WebSite + FAQ — no fake AggregateRating |
| CWV | Defer Maps where CX allows; `next/image` for future photos |
| Custom 404 | Shipped |
| OG image 1200×630 | Brief design (non-blocking) |
| GSC verify + sitemap submit | **Founder** — STOP until done |
| Hreflang CA/US | Only when localized pages exist |
| Redirect hygiene | Keep `/pro` → `/cleaner`; avoid soft 404s on nav |

---

## 7. Google Business Profile process

See full policy in `LOCAL_SEO.md`. Roadmap sequence:

1. Decide service-area vs storefront NAP (Founder + legal)  
2. One real profile per real operating presence (likely separate CA / US)  
3. Categories truthful; services = catalog  
4. Website → production canonical + UTM  
5. Photos rights-cleared  
6. Reviews only after completed jobs  
7. Weekly Q&A / review response cadence  
8. Never create fake geo pins for unserved cities  

---

## 8. Conversion funnel metrics (organic)

Track in `company/METRICS.md` when instrumentation exists — **TBD until measured**.

| Stage | Metric | Notes |
|-------|--------|-------|
| Discovery | Organic sessions / GSC clicks | Vanity if unpaid |
| Intent | Organic → Start booking | UTM `utm_medium=organic` |
| Activate | Address completed | Maps dependency |
| Convert | Checkout started | |
| **Primary** | **Completed paid bookings from organic** | Source of truth |
| Quality | Organic → completed rate; refund/cancel rate | Don’t scale bad traffic |
| Local | GBP actions (calls, site clicks) → bookings | Tie when possible |
| Supply | Organic → `/earn` applications | Secondary |

**Attribution note:** Implement booking source capture post-MVP (Roadmap P2) — until then, annotate manually / approximate with landing URL.

---

## 9. Phased SEO plan

| Phase | When | Deliverables |
|-------|------|--------------|
| **A — Foundations** | Parallel to MVP (non-blocking) | robots/sitemap/noindex/JSON-LD (largely done); GSC; GBP decision |
| **B — Money pages** | After MVP gate + approval | `/services` + 3 spokes (deep, move-out, airbnb); 2 market hubs |
| **C — Trust** | After B | Legal pages, about (truthful), review display when real |
| **D — Selective local** | After B + supply | ≤ few city pages passing 9-rule gate |
| **E — Content assists** | Ongoing | Checklists/guides linking to money pages |
| **F — Expansion SEO** | Per `MARKET_EXPANSION.md` Tier 1 cluster only | New hub only when market `active` |

---

## 10. First build queue (recommendation)

See final report in Growth agent report. Summary:

**First 10 SEO pages (proposed — not built):**  
1. `/services`  
2. `/services/deep`  
3. `/services/move-out`  
4. `/services/airbnb`  
5. `/locations`  
6. `/locations/toronto-gta`  
7. `/locations/south-florida`  
8. `/services/residential`  
9. `/services/office` (link heavy to `/for-business`)  
10. `/legal/privacy` + `/legal/terms` (trust; pair as one workstream)

**Awaiting user approval before mass-publish.**

---

## 11. Owners

| Work | Owner |
|------|-------|
| Priority / index approval | Product / CEO |
| Implementation of pages | Lead Engineer (or content-only MDX if Product chooses) |
| Copy / keyword map | Growth |
| GBP / citations | Growth + Founder |
| Release gate | QA + Security |
| Supply truth for cities | Cleaner Operations |
