# Agent report — B2B commercial primary (South Florida)

**Date:** 2026-11-04  
**Branch:** `feature/b2b-commercial-primary`  
**Compose:** Merged open PR tips **#26** (recurring discount) + **#27** (pay-after + fixture) onto **#28**/brand-header tip.

## PREVIEW

Local: `npm run dev` → sign in → `/dashboard` (commercial shell).  
Vercel preview: after PR push.

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

- Office manager path: Sites → existing site → scope → Book this visit (`/book?service=office`) when ready; Jobs → service order from real booking.
- Property manager path: Sites → scope → Request quotes (honest empty proposals; no Bayline/Coastal invent) → CRM lead.
- Mobile tab bar: Overview · Sites · Jobs · Billing.
- Typecheck clean; bottom-nav unit tests pass.

## BLOCKED

- `gh` GitHub auth token invalid in this environment — push/PR may need founder `gh auth refresh`.
- Stripe LIVE remains OFF; BOOKABLE=0; markets still gated.
- No invented providers; live proposals only when real jobs/CRM exist.

## STRIPE_LIVE

**OFF**
