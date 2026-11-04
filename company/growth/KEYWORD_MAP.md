# MaidLinx keyword map

**Role:** Head of SEO / Local Growth / Market Expansion  
**Date:** 2026-08-11  
**Live markets only for local modifiers:** Toronto / GTA · South Florida  
**Do not:** keyword stuff, doorway pages, fake city coverage, near-identical AI city pages  
**Volumes:** Not pulled live this session → mark **RESEARCH REQUIRED** where tool data needed  
**Primary KPI alignment:** Keywords ranked by **booking intent**, not vanity volume

**Related:** `SEO_ROADMAP.md` · `MARKET_EXPANSION.md` · `SEO_AUDIT.md`

---

## 1. Money Keyword Opportunity Score (MKOS)

Prioritize **completed paid bookings**, not impressions.

| Component | Weight | Notes |
|-----------|--------|-------|
| Booking intent | 40% | Transactional &gt; commercial &gt; informational |
| Service margin fit | 20% | Matches active catalog + pricing model (`instant` preferred early) |
| SERP winnability | 15% | Local pack + weak content competitors help; RESEARCH REQUIRED |
| Cannibalization risk | 10% | Inverse — unique target page required |
| Funnel distance | 15% | Closer to `/` book CTA = higher |

```
MKOS = 0.4×Intent + 0.2×MarginFit + 0.15×Winnability + 0.1×(10−Cannibal) + 0.15×FunnelClose
```

Each subscore 0–10 → MKOS 0–10 (shown as **Priority:** P0 / P1 / P2 / P3).

| Priority | MKOS | Meaning |
|----------|------|---------|
| P0 | 8–10 | Build/target first (live markets) |
| P1 | 6–7.9 | Next wave after hubs exist |
| P2 | 4–5.9 | Supporting content |
| P3 | &lt;4 | Later / avoid if thin |

---

## 2. Intent clusters

### A. Transactional (book / hire / near me)

User wants to schedule cleaning soon. Map to bookable CTAs on hub/service/market pages (indexable) → funnel stays `noindex`.

### B. Service-specific

Deep, move-out/in, Airbnb/STR, office, post-construction, recurring, event venue — from catalog slugs.

### C. High-value / specialty

Move-out, post-construction, deep clean, same-day/on-demand — higher AOV hypotheses.

### D. Commercial

Office cleaning, property manager cleaning, Airbnb turnover cleaning, commercial cleaning service.

### E. Senior / family **NON-MEDICAL**

House cleaning for seniors, family home cleaning, eco-friendly home cleaning — **never** claim medical/home-health caregiving.

### F. Informational

How long does a clean take, what to tip, move-out checklist — support trust; soft CTA only.

---

## 3. Local formula (served markets only)

```
[SERVICE] + [CITY]
[SERVICE] + near me          ← GBP + home; do not fake geo pages
[SERVICE] + [NEIGHBORHOOD]   ← ONLY if zone actively served + unique proof
```

**Allowed city/neighborhood examples (from live zones — verify before page build):**

| Market | Example locales (not a publish list) |
|--------|--------------------------------------|
| Toronto / GTA | Toronto, Mississauga, Brampton, Oakville, Markham, Vaughan, Scarborough, North York, Etobicoke, Burlington, … |
| South Florida | Miami, Fort Lauderdale, Boca Raton, Hollywood FL, Miami Beach, Coral Gables, … **active zones only** |

**Forbidden:** New York / California / unserved cities as if live.

---

## 4. Planned URL architecture (targets)

| Page type | URL | Role |
|-----------|-----|------|
| Home | `/` | Brand + primary book entry |
| Services hub | `/services` | Planned — service index |
| Service spoke | `/services/{slug}` | residential, deep, move-out, airbnb, office, … |
| Business | `/for-business` | Live commercial |
| Earn / supply | `/earn` | Live cleaner acquisition |
| Locations hub | `/locations` | Planned — live markets only |
| Market hub | `/locations/toronto-gta`, `/locations/south-florida` | Planned |
| City spoke | `/locations/{market}/{city}` | **Quality gate** — rare |
| Funnel | `/book/**` | **noindex** — never primary SEO target |

---

## 5. Keyword inventory (seed map)

**CONTENT STATUS:** `None` · `Partial` (homepage/FAQ mention) · `Planned` · `Live page`  
**Volumes:** RESEARCH REQUIRED (do not invent monthly search counts)

### 5.1 Transactional — national / head (country-level)

| KEYWORD | COUNTRY | MARKET | SEARCH INTENT | SERVICE | FUNNEL STAGE | TARGET PAGE | PRIORITY | CONTENT STATUS |
|---------|---------|--------|---------------|---------|--------------|-------------|----------|----------------|
| book house cleaning online | CA/US | All live | Transactional | Residential | TOFU→BOFU | `/` | P0 | Partial |
| on demand house cleaning | CA/US | All live | Transactional | Residential | BOFU | `/` | P0 | Partial |
| hire a cleaner online | CA/US | All live | Transactional | Residential | BOFU | `/` | P0 | Partial |
| house cleaning service | CA/US | All live | Transactional | Residential | MOFU | `/services` (planned) | P0 | None |
| maid service near me | CA/US | GBP | Transactional | Residential | BOFU | GBP + `/` | P0 | Partial |
| cleaning service near me | CA/US | GBP | Transactional | Residential | BOFU | GBP + `/` | P0 | Partial |
| same day cleaning service | CA/US | All live | Transactional | Residential | BOFU | `/` + service FAQ | P1 | Partial |
| book a maid | CA/US | All live | Transactional | Residential | BOFU | `/` | P1 | Partial |
| apartment cleaning service | CA/US | Condo-heavy | Transactional | Residential | MOFU | `/services/residential` | P1 | None |
| condo cleaning service | CA | GTA | Transactional | Residential | MOFU | `/locations/toronto-gta` | P0 | None |

### 5.2 Transactional — Toronto / GTA local

| KEYWORD | COUNTRY | MARKET | SEARCH INTENT | SERVICE | FUNNEL STAGE | TARGET PAGE | PRIORITY | CONTENT STATUS |
|---------|---------|--------|---------------|---------|--------------|-------------|----------|----------------|
| house cleaning Toronto | CA | GTA | Transactional | Residential | BOFU | `/locations/toronto-gta` | P0 | Planned |
| cleaning service Toronto | CA | GTA | Transactional | Residential | BOFU | `/locations/toronto-gta` | P0 | Planned |
| maid service Toronto | CA | GTA | Transactional | Residential | BOFU | `/locations/toronto-gta` | P0 | Planned |
| house cleaning Mississauga | CA | GTA | Transactional | Residential | BOFU | city spoke **if gate** | P1 | None |
| house cleaning Brampton | CA | GTA | Transactional | Residential | BOFU | city spoke **if gate** | P1 | None |
| house cleaning Oakville | CA | GTA | Transactional | Residential | BOFU | city spoke **if gate** | P2 | None |
| house cleaning Markham | CA | GTA | Transactional | Residential | BOFU | city spoke **if gate** | P2 | None |
| deep cleaning Toronto | CA | GTA | Transactional | Deep | BOFU | `/services/deep` + GTA hub | P0 | None |
| move out cleaning Toronto | CA | GTA | Transactional | Move-out | BOFU | `/services/move-out` | P0 | None |
| Airbnb cleaning Toronto | CA | GTA | Transactional | Airbnb | BOFU | `/services/airbnb` | P1 | None |
| office cleaning Toronto | CA | GTA | Commercial | Office | MOFU | `/for-business` | P1 | Live (generic) |

### 5.3 Transactional — South Florida local

| KEYWORD | COUNTRY | MARKET | SEARCH INTENT | SERVICE | FUNNEL STAGE | TARGET PAGE | PRIORITY | CONTENT STATUS |
|---------|---------|--------|---------------|---------|--------------|-------------|----------|----------------|
| house cleaning Miami | US | SFL | Transactional | Residential | BOFU | `/locations/south-florida` | P0 | Planned |
| cleaning service Fort Lauderdale | US | SFL | Transactional | Residential | BOFU | `/locations/south-florida` | P0 | Planned |
| maid service South Florida | US | SFL | Transactional | Residential | BOFU | `/locations/south-florida` | P0 | Planned |
| house cleaning Boca Raton | US | SFL | Transactional | Residential | BOFU | city spoke **if gate** | P2 | None |
| Airbnb cleaning Miami | US | SFL | Transactional | Airbnb | BOFU | `/services/airbnb` | P0 | None |
| move out cleaning Miami | US | SFL | Transactional | Move-out | BOFU | `/services/move-out` | P0 | None |
| deep cleaning Miami | US | SFL | Transactional | Deep | BOFU | `/services/deep` | P0 | None |
| condo cleaning Miami | US | SFL | Transactional | Residential | MOFU | SFL hub | P1 | None |
| office cleaning Miami | US | SFL | Commercial | Office | MOFU | `/for-business` | P1 | Live (generic) |

### 5.4 Service cluster (both countries — page is national/service, local via hubs)

| KEYWORD | COUNTRY | MARKET | SEARCH INTENT | SERVICE | FUNNEL STAGE | TARGET PAGE | PRIORITY | CONTENT STATUS |
|---------|---------|--------|---------------|---------|--------------|-------------|----------|----------------|
| deep cleaning service | CA/US | Live | Service | Deep | MOFU | `/services/deep` | P0 | None |
| move out cleaning | CA/US | Live | Service | Move-out | BOFU | `/services/move-out` | P0 | None |
| move in cleaning | CA/US | Live | Service | Move-in | BOFU | `/services/move-in` | P1 | None |
| Airbnb turnover cleaning | CA/US | Live | Service | Airbnb | BOFU | `/services/airbnb` | P0 | None |
| vacation rental cleaning | US | SFL | Service | Airbnb | MOFU | `/services/airbnb` | P1 | None |
| post construction cleaning | CA/US | Live | Service | Post-construction | MOFU | `/services/post-construction` | P1 | None |
| recurring house cleaning | CA/US | Live | Service | Recurring | MOFU | `/services/recurring` | P1 | None |
| office cleaning service | CA/US | Live | Commercial | Office | MOFU | `/for-business` + `/services/office` | P1 | Partial |
| event venue cleaning | CA/US | Live | Service | Event | MOFU | `/services/event-venue` | P2 | None |
| end of tenancy cleaning | CA | GTA | Service | Move-out | BOFU | `/services/move-out` | P1 | None |

### 5.5 High-value

| KEYWORD | COUNTRY | MARKET | SEARCH INTENT | SERVICE | FUNNEL STAGE | TARGET PAGE | PRIORITY | CONTENT STATUS |
|---------|---------|--------|---------------|---------|--------------|-------------|----------|----------------|
| move out cleaning cost | CA/US | Live | High-value / commercial research | Move-out | MOFU | `/services/move-out` | P1 | None |
| deep cleaning price | CA/US | Live | High-value | Deep | MOFU | `/services/deep` | P1 | None |
| same day deep cleaning | CA/US | Live | High-value | Deep | BOFU | `/services/deep` | P1 | None |
| construction final clean | CA/US | Live | High-value | Post-construction | MOFU | `/services/post-construction` | P2 | None |
| furnished apartment cleaning | CA/US | Live | High-value | Residential/Airbnb | MOFU | service + hub | P2 | None |

### 5.6 Commercial

| KEYWORD | COUNTRY | MARKET | SEARCH INTENT | SERVICE | FUNNEL STAGE | TARGET PAGE | PRIORITY | CONTENT STATUS |
|---------|---------|--------|---------------|---------|--------------|-------------|----------|----------------|
| commercial cleaning service | CA/US | Live | Commercial | Office | MOFU | `/for-business` | P0 | Live |
| office cleaning company | CA/US | Live | Commercial | Office | MOFU | `/for-business` | P0 | Live |
| property manager cleaning service | CA/US | Live | Commercial | Residential/Airbnb | MOFU | `/for-business` | P0 | Partial |
| Airbnb cleaning service for hosts | CA/US | Live | Commercial | Airbnb | BOFU | `/services/airbnb` + business | P0 | None |
| janitorial service small office | CA/US | Live | Commercial | Office | MOFU | `/for-business` | P1 | Partial |
| retail store cleaning | CA/US | Live | Commercial | Office | MOFU | `/for-business` | P2 | Partial |
| medical office cleaning | CA/US | Live | Commercial | Office | MOFU | `/for-business` | P2 | None — **no medical claims** beyond facility clean |
| HOA common area cleaning | US | SFL | Commercial | Quote | MOFU | `/for-business` | P2 | None |
| coworking space cleaning | CA | GTA | Commercial | Office | MOFU | `/for-business` | P2 | None |
| short term rental cleaning company | US | SFL | Commercial | Airbnb | BOFU | `/services/airbnb` | P0 | None |

### 5.7 Senior / family NON-MEDICAL

| KEYWORD | COUNTRY | MARKET | SEARCH INTENT | SERVICE | FUNNEL STAGE | TARGET PAGE | PRIORITY | CONTENT STATUS |
|---------|---------|--------|---------------|---------|--------------|-------------|----------|----------------|
| house cleaning for seniors | CA/US | Live | Senior/family | Residential | MOFU | `/services/residential` + guide | P1 | None |
| cleaning service for elderly parents | CA/US | Live | Senior/family | Residential | MOFU | guide → book | P1 | None |
| family home cleaning service | CA/US | Live | Senior/family | Residential | MOFU | `/services/residential` | P2 | None |
| eco friendly house cleaning | CA/US | Live | Family | Residential | MOFU | service FAQ (only if true) | P2 | None |
| pet friendly cleaning service | CA/US | Live | Family | Residential | MOFU | extras FAQ | P2 | Partial |

**Compliance:** Never rank for / claim nursing, personal care, or medical housekeeping.

### 5.8 Informational (supporting)

| KEYWORD | COUNTRY | MARKET | SEARCH INTENT | SERVICE | FUNNEL STAGE | TARGET PAGE | PRIORITY | CONTENT STATUS |
|---------|---------|--------|---------------|---------|--------------|-------------|----------|----------------|
| what is included in a house cleaning | CA/US | — | Informational | Residential | TOFU | FAQ / guide | P2 | Partial |
| how to prepare for a house cleaner | CA/US | — | Informational | Residential | TOFU | guide | P2 | None |
| move out cleaning checklist | CA/US | — | Informational | Move-out | TOFU | guide → `/services/move-out` | P1 | None |
| how often should I clean my house | CA/US | — | Informational | Recurring | TOFU | guide | P3 | None |
| Airbnb cleaning checklist | CA/US | — | Informational | Airbnb | TOFU | guide → airbnb service | P1 | None |
| tipping house cleaners | CA/US | — | Informational | — | TOFU | FAQ | P3 | None |

---

## 6. Cannibalization rules

| Risk | Rule |
|------|------|
| Home vs `/services` | Home = brand + book; `/services` = catalog hub. Do not duplicate H1 “House cleaning service” on both. |
| Market hub vs city | One primary city phrase per URL. Hub owns “Toronto” / “South Florida”; city pages own “Mississauga” etc. |
| Service vs market | Service page owns head term (“move out cleaning”); market page owns geo (“move out cleaning Toronto”) via sections + links, **or** dedicated local section — not two thin pages with same copy. |
| `/for-business` vs `/services/office` | Business = buyer persona + lead; office service = bookable SKU. Cross-link; different H1. |
| Funnel URLs | Never optimize `/book/*` for organic; keep `noindex`. |

---

## 7. Mapping to Money Keyword waves

### Wave 0 (now — no mass pages)

Track + copy-tune on live URLs only: `/`, `/for-business`, `/earn` + GBP “near me”.

### Wave 1 (after MVP gate + Product approval)

`/services`, `/services/deep`, `/services/move-out`, `/services/airbnb`, `/locations/toronto-gta`, `/locations/south-florida`

### Wave 2

Remaining service spokes + 2–4 city pages that pass quality gate.

### Wave 3

Informational guides that feed Wave 1 money pages (checklists, host guides).

---

## 8. RESEARCH REQUIRED (tools)

Before paid content production at scale:

1. Keyword Planner / Ahrefs / Semrush volumes for P0 rows (CA vs US separately)  
2. Local pack occupancy for “cleaning service” + city in GTA & SFL  
3. Rank tracking for brand + 20 P0 keywords  
4. Search Console queries after sitemap verified (`SEO_AUDIT.md` STOP)

**Awaiting user approval before mass-publish.**
