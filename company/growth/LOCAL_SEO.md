# MaidLinx local SEO playbook

**Markets live for claims:** Toronto / GTA (CAD) · South Florida (USD)  
**Do not claim:** New York, California, or any city outside active service zones.  
**Rule:** No fake Google Business Profiles, invented addresses, or purchased reviews.

**Related:** `SEO_ROADMAP.md` (architecture + quality gate) · `MARKET_EXPANSION.md` (cluster launch) · `KEYWORD_MAP.md`

---

## 1. Google Business Profile (GBP)

### Policy

- Create **only real** profiles that MaidLinx can verify and staff.
- Prefer **one profile per real operating presence** (or service-area business if no public storefront).
- Categories (examples to choose truthfully): House Cleaning Service; Commercial Cleaning Service (if commercial is actively sold).
- Service areas: map to active zones in `src/config/markets.ts` / `SERVICE_ZONES` — GTA clusters + Miami-Dade / Broward / Palm Beach as actually served.
- Hours: publish only hours ops can honor for booking/support response.
- Booking link: primary CTA → `https://{production-host}/` (or tracked `/` UTM). Secondary: `/for-business` for commercial.
- Photos: real team/ops/before-after with permission; no stock-as-own, no fake interiors.
- Reviews: ask real customers after completed jobs; never gate, incentivize with money, or fabricate.

### NAP consistency

| Field | Requirement |
|-------|-------------|
| Name | **MaidLinx** (exact brand; no keyword stuffing in GBP name) |
| Address | Real registered / ops address only — or service-area business with no public storefront |
| Phone | Dedicated local or tracked number answered by support |
| Website | Production canonical URL from `NEXT_PUBLIC_SITE_URL` |
| Email | `info@maidlinx.com` (customer-facing support inbox) |

Keep the same NAP on site footer (when trust pages ship), invoices, contracts, and directories.

### Dual-market note

Operating in **Canada + US** may require separate GBP entities and clear service-area definitions. Do not create duplicate profiles for the same footprint. Confirm with Google’s current multi-location / service-area rules before launch.

---

## 2. Service areas (truthful)

### Toronto / GTA (examples from config — verify before public lists)

Toronto Core, GTA West (Mississauga, Brampton, Oakville, …), GTA East (Markham, Vaughan, Durham, …), GTA North (Newmarket, Aurora, …).

### South Florida

Miami-Dade, Broward, and other **active** FL zones in config only.

**Public copy rule:** Say “Toronto/GTA and South Florida” unless a specific city page exists with unique, accurate coverage.

---

## 3. On-site local signals (no fake LocalBusiness yet)

Until a verified NAP exists:

- Keep `Organization` + `areaServed` (shipped) — **not** invented street `LocalBusiness`.
- Homepage and marketing pages may name live markets.
- Avoid city doorway pages and “serving 50+ cities” claims.

When NAP is real: add market-level pages + careful `LocalBusiness` / `Service` schema matching GBP.

---

## 4. Reviews engine (architecture note — not a product build)

Post-job sequence (ops + product later):

1. Job `completed` → wait buffer (e.g. 2–24h).  
2. Email/SMS with deep link to in-app rating **and** optional GBP review link for that market.  
3. Store first-party review in Supabase (existing reviews tables/admin).  
4. Only surface reviews that are real, moderated, and policy-compliant.  
5. Never auto-post star ratings to schema until counts are accurate and consented.

**Growth must not** invent AggregateRating JSON-LD.

---

## 5. Photos & hours checklist

- [ ] Exterior / team / equipment photos (rights cleared)  
- [ ] Cover photo matches brand (green system, not generic purple AI look)  
- [ ] Hours match support + booking expectations  
- [ ] Q&A seeded with truthful FAQs (pricing deposit, markets, how booking works)  
- [ ] Products/services list mirrors catalog (residential, deep, move, Airbnb/STR, office, etc.)

---

## 6. Citations (ethical)

When ready: consistent NAP on major directories relevant to home services. Prefer quality over volume. No spam networks, no fake geo pages for citation farming.

---

## 7. Local SEO priorities (ranked)

| Rank | Action | Depends on |
|------|--------|------------|
| P0 | Decide real NAP / service-area GBP model | Founder + legal |
| P0 | Point GBP website to production canonical | Deploy + `NEXT_PUBLIC_SITE_URL` |
| P1 | Collect real reviews after completed jobs | MVP complete path |
| P1 | Market hub pages (2 live markets only) | Product scope after MVP gate |
| P2 | City pages for highest-demand zone cities with unique copy | Ops capacity + content |
| P3 | Dual-market citation / PR | Stable fulfillment |

---

## 8. Anti-patterns (forbidden)

- Fake GBP locations or “virtual offices” presented as stores  
- Keyword-stuffed business names (“MaidLinx Best Cheap Cleaning Toronto Miami”)  
- Purchased / swapped / bot reviews  
- Claiming inactive markets (NY, CA) as live  
- Mass city URLs with spun AI paragraphs
