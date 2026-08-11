# MaidLinx MVP Audit & Plan

**Date:** 2026-08-10 (updated same day — foundation workstream)  
**Scope:** Root MaidLinx app (`/Users/avnee/website`). Ignore `wingman/`.

## Exists (working code paths)

| Area | Status | Notes |
|------|--------|-------|
| Customer book wizard | **PASS** | `/book` steps + **manual address fallback** when Maps blocked |
| Customer dashboard | **PASS** | Bookings, favorites, invoices, receipts, profile, notifications |
| Auth + roles | **PASS** | Supabase Auth; `customer` / `cleaner` / `admin`; middleware gates |
| Cleaner / Pro portal | **PASS** | Canonical `/cleaner` (`/pro` redirects). Home, jobs ladder, onboarding, documents, availability + time-off, earnings, ratings, profile, settings, Connect stub |
| Job offer privacy | **PASS** | `sanitizeAvailableJob` hides street/contact until assigned |
| Matching | **PASS** | Eligibility + weighted score; online/onboarding/unavailable-date gates; admin suggestions + offers |
| Admin ops | **PASS** | Cleaner **Approve/Reject**, assign from booking detail, queues, payments, disputes |
| Schema | **PASS** | Migrations `00001`–`00019` (incl. Pro foundation + professionals view fields) |
| Stripe deposit | **PASS** (code) | TEST mode only; needs keys |
| Stripe Connect | **STUB** | Status machine + Account Link architecture; gated by `STRIPE_CONNECT_ENABLED` |

## Verification (this session)

| Check | Result |
|-------|--------|
| `tsc --noEmit` | **PASS** |
| `vitest run` | **PASS** (220 tests) |
| `eslint .` | **PASS** (0 errors; pre-existing warnings remain) |
| `next build` (`NEXT_DIST_DIR=.next-mvp-foundation`) | **PASS** |

## STOP items (need user)

- Google Maps key / billing / restrictions (sibling owns Maps / `.env.local` / autocomplete).
- Fill Supabase + Stripe **TEST** keys in `.env.local` (do not paste into chat).
- Apply migrations through `00019` on the target Supabase project.
- Stripe Connect platform settings in Dashboard (TEST); set `STRIPE_CONNECT_ENABLED=true` only after that.
- Production deploy, live Stripe, identity verification vendor, legal acceptance copy sign-off.

## Remaining gaps (honest)

1. **Real document file upload** — metadata registration only; storage bucket + signed upload UX TBD.
2. **Connect live Account Links** — stub/test path until Connect platform + `STRIPE_CONNECT_ENABLED`.
3. **Auto-dispatch** — still out of scope; manual assign + offers remain MVP.
4. **Split Date / Time / Access booking screens** — schedule step still combined (P2).
5. **Background-check vendor** — never claimed; ops approval ≠ verified identity.
6. **Payout ledger → Stripe transfers** — `payouts` table exists; no automatic transfer job yet.
7. **Lint warnings** — unused vars in a few legacy files (non-blocking).

## Routing

- **`/cleaner` canonical**; `/pro/*` → `/cleaner/*`; `/pro/signup` & `/cleaner/signup` → `/earn`.
- APIs mirrored under `/api/cleaner/*` and `/api/pro/*` (redirect).
