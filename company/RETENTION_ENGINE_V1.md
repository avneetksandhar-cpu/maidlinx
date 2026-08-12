# Retention Engine V1 — Checkpoint

**Branch tip:** `cursor/retention-engine-v1` (from `cursor/dispatch-live-ops-v1`)  
**Date:** 2026-08-11  
**Status:** No new Retention code committed this session — prior Repeat Revenue foundation remains on ancestry.

## Already present (prior work)

- One-tap Book again + soft preferred cleaner (`booking-card`, `preferred_professional_id`)
- Recurring preference UI + `recurring_plans` architecture (generation OFF; no Stripe auto-charge)
- Referral codes/attributions with `credits_live=false`
- Retention event queue (`src/lib/retention/events.ts`) — providers log/PENDING
- Favorites, saved places, funnel analytics hooks
- Migration `00023_repeat_revenue_foundation.sql` (may still need remote apply)

## Not completed this session

- Credits ledger, membership foundation OFF tables, `/admin/retention`, pause/skip lifecycle APIs
- Remote apply of `00023` (referral/retention tables were missing on last inspect)

## Handoff

MaidLinx Brain V1 continues from this tip; Retention remains extendable without redesign.
