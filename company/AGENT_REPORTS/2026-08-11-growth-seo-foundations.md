# Growth — SEO foundations

- Date: 2026-08-11
- Sprint ref: company/CURRENT_SPRINT.md
- Summary: Audited technical SEO; shipped safe robots/sitemap/metadata/JSON-LD/noindex/404; wrote growth docs under `company/growth/`. Did not touch booking/payment/env.
- Evidence / links:
  - `company/growth/SEO_AUDIT.md`
  - `company/growth/LOCAL_SEO.md`
  - `company/growth/CONTENT_CALENDAR.md`
  - `company/growth/COMPETITOR_RESEARCH.md`
  - `company/growth/GROWTH_ROADMAP.md`
  - `src/app/robots.ts`, `src/app/sitemap.ts`, `src/components/seo/site-json-ld.tsx`
- Blockers: Production `NEXT_PUBLIC_SITE_URL` + Google Search Console verification (human)
- Asks (Product / Lead Engineer / QA):
  - Product: after MVP gate, prioritize `/services` + 2 market hubs (not mass city pages)
  - Lead Engineer: ensure prod env has canonical site URL
  - Ops: GBP NAP decision per `LOCAL_SEO.md`
- Secrets: none
