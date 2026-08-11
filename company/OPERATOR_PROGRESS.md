# Operator progress

**Updated:** 2026-08-11  
**Operator:** Technical operator  
**Rule:** Secrets never printed (FOUND/MISSING or last4 only). No redesign. No dynamic pricing. Ignore migration 00024.

## Auth

| Service | Status |
|---------|--------|
| Vercel CLI | AUTH OK (`maidlinx/website`) |
| Stripe MCP | AUTH OK (TEST sandbox `acct_1TZ2mjFAmKhvpBtw`) |
| Supabase MCP | ready (`pgoyhujsfbmfshtnlbnx`) |

## Production env (FOUND/MISSING)

| Key | Status |
|-----|--------|
| NEXT_PUBLIC_SUPABASE_URL | FOUND |
| SUPABASE_SERVICE_ROLE_KEY | FOUND |
| BOOKING_ACCESS_SECRET | FOUND |
| STRIPE_SECRET_KEY | FOUND (`sk_test`, last4 oaBx) |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | FOUND (`pk_test`, last4 BSiL) |
| STRIPE_WEBHOOK_SECRET | FOUND (TEST endpoint enabled) |

## Evidence — booking `e3819c95-380d-4219-8251-83823e9f1608`

| Step | Result |
|------|--------|
| POST `/api/bookings` empty | 400 (not SUPABASE_NOT_CONFIGURED) |
| Quote | 200 · totalCents 21275 |
| Create | 201 · pending_payment |
| Checkout | 200 · deposit 5319 CAD · PI `pi_3U3Aq5…` |
| Stripe TEST confirm (`pm_card_visa`) | succeeded · livemode false |
| Webhook `payment_intent.succeeded` | processed · `evt_3U3Aq5…` · livemode false |
| payments row | succeeded · amount_cents 5319 · deposit |
| Booking after pay | status `awaiting_assignment` · payment_status `deposit_paid` |
| TEST cleaner | `ba902d50…` approved+active (synthetic ops identity) |
| Assignment | `cleaner_assignments` active · source admin_manual |
| Status chain | assigned → on_the_way → arrived → in_progress → **completed** |
| Confirm email log | MaidLinx booking confirmed — E3819C95 |
| Prod deploy | `website-haydrhfrc-maidlinx.vercel.app` aliased to maidlinx.com |

## P0 checklist

- [x] P0-1 Production Supabase + new booking row  
- [x] P0-2 Stripe TEST checkout + webhook + payment DB  
- [x] P0-3 TEST cleaner + assign + complete  
- [x] P0-4 E2E loop evidence in DB / Stripe / API  

## Human action

**NONE**
