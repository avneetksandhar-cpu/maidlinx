# MaidLinx Dispatch & Live Operations V1 — Checkpoint

**Branch tip:** `cursor/dispatch-live-ops-v1`  
**Date:** 2026-08-11  
**Status:** Schema foundation applied on remote; application layer partially reused from Match Engine V1.

## Applied (remote `pgoyhujsfbmfshtnlbnx`)

- Cleaner Platform prereq + `cleaner_platform_v1` columns/gates/academy/trust (00025 core)
- `00026` tables: `booking_offers`, `dispatch_market_config`, `dispatch_exceptions`, `fraud_review_flags`, booking lifecycle timestamps, unique reviews index
- Enum sources `offer_accept` / `admin_reassign`

## Existing app foundations preserved

- Eligibility + match scoring (`src/lib/matching/*`)
- Atomic offer accept / admin assign (`assignment.ts`) with Verified gates on assign/claim
- Booking status machine (`src/lib/bookings/status.ts`)
- Notification outbox log adapters (PENDING_PROVIDER when unset)
- Customer live status + cleaner job UIs (prior work)

## Not complete in this checkpoint

- Dedicated admin Live Ops page polish beyond Assignments queues
- Full BOOK→PAY→…→RATE synthetic loop proof on this branch
- Professionals view column refresh may need DROP/CREATE on remotes with old view shape (see 00026 file)

## Handoff

Retention Engine V1 continues from this tip without redesigning dispatch/matching.
