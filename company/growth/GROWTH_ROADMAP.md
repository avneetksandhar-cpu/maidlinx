# MaidLinx growth + SEO roadmap

**Priority hierarchy reminder:** Safety/payments → booking critical path → CX → cleaner ops → revenue → **growth** → polish.  
**Hard gate:** Do **not** interrupt MVP engineering for growth features while `company/CURRENT_SPRINT.md` CRITICAL items remain FAIL / NEEDS USER ACTION.

This roadmap ranks **growth/SEO work only**. MVP infra stays with Lead Engineer / Product.

---

## P0 — foundations (safe; ship without touching booking logic)

| Item | Why | Status |
|------|-----|--------|
| `robots.txt` + private path disallow | Crawl hygiene | Done (this pass) |
| Sitemap of real public URLs | Discovery | Done |
| Root metadata / OG / Twitter / canonical base | Snippets + shares | Done |
| `noindex` auth, platform, booking funnel | Index bloat / privacy | Done |
| Truthful Organization + FAQ JSON-LD | Rich results eligibility | Done |
| Custom 404 with recovery links | Soft bounce recovery | Done |
| Production `NEXT_PUBLIC_SITE_URL` + GSC verify | Canonical truth | **STOP — human** |
| GBP decision (real NAP / service-area) | Local demand | Human / ops |

---

## P1 — after MVP critical path PASSES

| Item | Type | Notes |
|------|------|-------|
| Market hub pages (`/locations/toronto-gta`, `/locations/south-florida`) | Content + light eng | Unique copy; link to book CTA |
| Service hub + 3 priority service pages | Content + light eng | Deep, move-out, Airbnb/STR first |
| Trust pages: privacy, terms | Eng + legal | Routes already reserved |
| Real review collection loop | Ops + product brief | See architecture below |
| OG 1200×630 asset | Design | Replace logo crop |
| Analytics + UTM discipline | Ops | See attribution architecture |
| Deepen `/for-business` | Content | Commercial SEO |

**Lead Engineer briefs only** — Growth does not drive-by rewrite booking.

---

## P2 — scale once P1 pages convert

| Item | Notes |
|------|-------|
| Selective city pages inside live zones | Unique proof required; no mass gen |
| Commercial landing variants (office, retail, restaurant) | Under `/for-business` or `/services/office` |
| Supply SEO for `/earn` (GTA + FL job intent) | Honest pay/process only |
| Citation consistency | After NAP locked |
| Email lifecycle: complete → review → rebook | Coordinate CX + Product |

---

## P3 — later / experimental

| Item | Notes |
|------|-------|
| Referral program | Architecture note only until Product ranks it |
| Membership / gift SEO surfaces | Roadmap LATER features |
| Blog / guides program | Only original expertise |
| Hreflang / localized currency landing | When UX truly splits CA vs US |
| Partner content (PMs, realtors) | Sales-led; no unsolicited spam |

---

## Proposed URL architecture (services + locations)

Documented fully in `SEO_AUDIT.md`. Summary:

```
/services
/services/{slug}          ← catalog slugs only
/locations
/locations/toronto-gta
/locations/south-florida
/locations/{market}/{city}  ← selective, never mass AI
/for-business
/earn
/legal/*
```

**Do not implement the matrix until Product scopes and MVP passes.**

---

## Architecture notes (not full product builds)

### Review engine

```
completed job → delay → ask in-app rating → optional GBP link by market
                 → store first-party review → moderate → display
                 → schema only when counts are real
```

Owners: CX (copy) · Cleaner Ops (timing) · Lead Engineer (hooks) · Growth (GBP links).

### Referrals (future)

```
completed customer → unique code → friend books + pays deposit → reward after friend’s complete
```

Needs: fraud rules, Stripe/coupon integrity, Product approval. **No autonomous discounts.**

### Commercial SEO

- Hub: `/for-business`  
- Spokes later: office, retail, restaurant, post-construction (quote-aware)  
- Sales collateral links to same URLs (one canonical story)  
- Schema: `Service` + Organization only; no fake case-study ratings  

### Attribution

| Layer | Tooling (proposed) | Notes |
|-------|--------------------|-------|
| Organic | Google Search Console | Verify production property |
| Web analytics | Privacy-respecting analytics (TBD choice) | No PII in events |
| Campaign | UTM on GBP, partners, social | `utm_source`, `utm_medium`, `utm_campaign` |
| Booking | Persist UTM on booking create (brief LE) | Server-side; not in client secrets |
| Revenue | Deposit paid / completed | Align with `METRICS.md` placeholders |

Do not invent conversion rates in reports.

---

## What Growth will not do during MVP FAIL state

- Mass location/service page generation  
- Homepage visual redesign  
- Booking/payment/Supabase/env changes  
- Fake social proof  
- Unsolicited prospect spam (Sales rule)  

---

## Handoffs

| Need | Ask |
|------|-----|
| Production URL env | Ops / Lead Engineer |
| GSC DNS/HTML verify | Founder |
| Service/market pages coded | Product priority → Lead Engineer |
| Review SMS/email | CX + Lead Engineer after complete path works |
