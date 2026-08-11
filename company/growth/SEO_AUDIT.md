# MaidLinx SEO audit (2026-08-11)

**Role:** Growth / SEO  
**Scope:** Technical + on-page foundations only. Ethical SEO. No mass location pages.  
**Constraint:** Do not interrupt BOOK→PAY→ASSIGN→CLEAN→COMPLETE→REBOOK engineering unless a true P0 technical SEO issue blocks indexing integrity.

**Live markets (truthful only):** Toronto / GTA · South Florida  
**Not live for marketing claims:** New York, California (inactive in `src/config/markets.ts`)

---

## SEO health snapshot

| Area | Status | Notes |
|------|--------|-------|
| Root title / description | PARTIAL → improved | Customer-facing default title present; OG/Twitter aligned |
| `metadataBase` / canonical | PARTIAL → improved | Uses `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_APP_URL` via `getSiteUrl()` |
| `robots.txt` | MISSING → fixed | App Router `src/app/robots.ts` |
| `sitemap.xml` | MISSING → fixed | App Router `src/app/sitemap.ts` (3 public URLs) |
| Indexability of private apps | FAIL → fixed | Platform / auth / book funnel `noindex` |
| Structured data | MISSING → fixed | Organization + WebSite + FAQPage (no fake ratings) |
| Public URL inventory | THIN | Only `/`, `/for-business`, `/earn` are real marketing URLs |
| Custom 404 | MISSING → fixed | `src/app/not-found.tsx` |
| OG share image | WEAK | Logo used; not a 1200×630 social card |
| Legal / content pages | MISSING | `routes.legal.*`, `/services`, `/about`, `/reviews` referenced but not shipped |

---

## P0 — fix now (indexing integrity)

| ID | Issue | Evidence | Action | Owner |
|----|-------|----------|--------|-------|
| P0-1 | No `robots.txt` | Absent before this pass | Ship `robots.ts`; disallow private + funnel paths | Growth (done) |
| P0-2 | No sitemap | Absent before this pass | Ship sitemap of real indexable URLs only | Growth (done) |
| P0-3 | Private apps inheriting `index: true` | Root layout robots applied site-wide | `noindex` on `(platform)`, `(auth)`, `/book/*`, `/booking/*` | Growth (done) |
| P0-4 | Canonical / base URL env drift | `site.ts` defaulted to `:3000` vs app `:3001` | Align defaults; set prod `NEXT_PUBLIC_SITE_URL=https://maidlinx.com` (or real host) | Growth + ops |
| P0-5 | GSC not verified | No Search Console property confirmed in repo | Human verifies domain (see STOP below) | Founder |

---

## P1 — high leverage after MVP gate

| ID | Issue | Why it matters | Proposed fix (do not mass-build yet) |
|----|-------|----------------|--------------------------------------|
| P1-1 | Thin public site graph | Almost all demand must land on `/` | Add `/services`, market hubs, 2–3 service pages after MVP |
| P1-2 | Nav routes to missing pages | `routes.services`, `howItWorks`, `reviews`, `about`, legal paths 404 if hit directly | Either ship pages or remove/adjust route constants + footer links |
| P1-3 | Weak OG image | Social shares look like a logo crop | Design truthful 1200×630 brand OG (no fake ratings on creative) |
| P1-4 | FAQ answers client-gated | Accordion hides closed answers from HTML | Prefer SSR-visible FAQ text (or keep JSON-LD as bridge — JSON-LD shipped) |
| P1-5 | No dedicated market landing URLs | Local intent has nowhere to land except homepage copy | Propose `/locations/toronto-gta`, `/locations/south-florida` only when content + ops ready |
| P1-6 | Manifest description weaker than site | PWA copy omits markets | Align `manifest.json` description with `siteConfig` (cosmetic) |

---

## P2 — quality & CWV risks

| ID | Issue | Risk | Notes |
|----|-------|------|-------|
| P2-1 | Homepage loads Maps provider | LCP / TBT on first paint | Keep booking UX; defer non-critical Maps where CX/Lead Engineer allow |
| P2-2 | Dynamic marketing sections | How-it-works / FAQ code-split | Good for JS weight; ensure key copy remains discoverable |
| P2-3 | Service worker registered | Stale HTML risk if misconfigured | Audit `sw.js` cache strategy before aggressive SEO campaigns |
| P2-4 | Font: DM Sans via `next/font` | Generally good | `display: swap` already set |
| P2-5 | Image pipeline | AVIF/WebP enabled | Ensure hero / future photos use `next/image` + sizes |
| P2-6 | Mobile booking chrome | Critical path PARTIAL in sprint | SEO secondary; CWV follows CX fixes |
| P2-7 | Duplicate `/pro` → `/cleaner` | Redirects exist (good) | Keep permanent redirects; avoid dual content |

---

## P3 — later / scale

| ID | Issue | Notes |
|----|-------|-------|
| P3-1 | Service × city matrix | **Do not mass-generate.** Architecture only (below) |
| P3-2 | Blog / guides | Only after unique ops insight; no AI doorway spam |
| P3-3 | Hreflang CA/US | Consider when localized pricing/content pages exist |
| P3-4 | Review schema | Only after real, consented, non-incentivized reviews exist in product |
| P3-5 | LocalBusiness per market | Needs real NAP + GBP consistency — see `LOCAL_SEO.md` |

---

## Indexability matrix (current)

| URL pattern | Index? | Reason |
|-------------|--------|--------|
| `/` | Yes | Primary acquisition + booking entry |
| `/for-business` | Yes | Commercial intent |
| `/earn` | Yes | Supply acquisition |
| `/book/**` | No | Transactional funnel |
| `/booking/**` | No | Private status + tokens |
| `/dashboard/**`, `/admin/**`, `/cleaner/**` | No | Authenticated apps |
| `/sign-in`, `/sign-up`, `/onboarding` | No | Auth |
| `/api/**` | No | Machines only |
| `/services`, `/about`, `/reviews`, `/legal/*` | N/A | Not implemented (would 404) |

---

## Metadata notes

**Default title:** `MaidLinx | Book Cleaning On Demand`  
**Description:** Markets + on-demand booking claim aligned to product (`siteConfig.description`).  
**Canonical:** `/` at root; page-level on `/earn`, `/for-business`.  
**OG/Twitter:** Title aligned to default title; card `summary_large_image`; image currently logo.

---

## Structured data (truthful)

Shipped `@graph`:

- `Organization` — name, url, logo, support email, `areaServed` GTA + South Florida  
- `WebSite` — name, url, publisher  
- `FAQPage` — same five FAQs as homepage  

**Explicitly not shipped:** `AggregateRating`, fake `Review`, invented `Offer` prices, fake `LocalBusiness` street address.

---

## Proposed URL architecture (document only — do not mass-generate)

```
/                                 Home + book entry
/services                         Service index (hub)
/services/{service-slug}          e.g. deep, move-out, airbnb, office
/locations                        Market index (live markets only)
/locations/toronto-gta            Market hub
/locations/south-florida          Market hub
/locations/{market}/{city}        ONLY after real coverage + unique copy
/for-business                     Commercial
/earn                             Cleaner supply
/legal/privacy|terms|...          Trust pages
```

**Service slugs (from catalog, when pages exist):**  
`residential`, `deep`, `move-in`, `move-out`, `airbnb`, `office`, `post-construction`, `event-venue`, `recurring`

**City pages:** Generate only for cities in active `SERVICE_ZONES` with unique proof (photos, turnaround, coverage notes). Never invent cities outside live zones.

**Internal linking rules:** Hub → spoke; every spoke links to `/` book CTA + parent hub; no orphan doorway pages.

---

## Redirects & 404s

**Existing good redirects** (`next.config.ts`): `/become-a-cleaner`, `/pro/signup`, `/cleaner/signup` → `/earn`; `/pro/*` → `/cleaner/*`.

**Gaps:** No branded 404 before this pass (fixed). Missing marketing routes in `siteConfig.routes` should not be linked in nav until pages exist (Services currently hash-links to `/#services` — OK).

---

## CWV / mobile / images / fonts (summary)

- Mobile viewport configured; theme color set.  
- Primary risk: Maps + booking JS on homepage.  
- Fonts: OK (`next/font`).  
- Images: brand assets local; prefer dedicated OG asset later.

---

## STOP — Google Search Console

See final report **STOP** section: verification required before sitemap submission claims.
