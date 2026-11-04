# Agent report — B2B commercial primary (South Florida)

**Date:** 2026-11-04  
**Branch:** `feature/b2b-commercial-primary`  
**Compose:** Merged open PR tips **#26** (recurring discount) + **#27** (pay-after + fixture) onto **#28**/brand-header tip.

## PREVIEW

- Branch pushed: `feature/b2b-commercial-primary`  
- Open PR: https://github.com/avneetksandhar-cpu/maidlinx/pull/new/feature/b2b-commercial-primary (`gh` API Forbidden — needs `gh auth refresh`)  
- Local `next dev` hit EMFILE / empty app-paths (404s). `next build` discovers ~175 routes (compile OK); static generation then fails on pre-existing `/book/address` Suspense bailout (not B2B pages).

## ROUTES

| Tab / flow | Path |
|------------|------|
| Overview | `/dashboard` |
| Sites (select) | `/dashboard/sites` |
| Define scope | `/dashboard/sites/[id]/scope` |
| Compare / request quotes | `/dashboard/sites/[id]/quotes` → `POST /api/leads/business` → `owner_sales_leads` |
| Jobs | `/dashboard/jobs` |
| Service order | `/dashboard/jobs/[id]` |
| Billing | `/dashboard/billing` |
| Legacy | `/dashboard/bookings` → Jobs; `/dashboard/saved-places` → Sites |
| Residential (secondary) | `/` home cleaning |

## HEADER_DONE

Yes — `BrandLockup` / `BrandHeader`: circular mark + **Maid** white / **Linx** `#04CED2` on midnight navy. System font stack. Compact in booking funnel.

## FLOWS_VERIFIED

- Code paths wired: Sites → scope → Book this visit (`/book?service=office`) **or** Request quotes → CRM; Jobs → service order from real bookings; Billing = real invoices/receipts only.
- Mobile tab bar: Overview · Sites · Jobs · Billing; residential demoted on `/`.
- Typecheck clean; bottom-nav unit tests pass.
- Interactive mobile preview blocked locally (EMFILE); use Vercel preview after PR open.

## BLOCKED

- `gh` token invalid → cannot auto-open PR (branch is on origin; use new-PR URL above).
- Local preview EMFILE / turbopack empty route graph.
- Stripe LIVE OFF; BOOKABLE=0; no invented providers.

## STRIPE_LIVE

**OFF**
