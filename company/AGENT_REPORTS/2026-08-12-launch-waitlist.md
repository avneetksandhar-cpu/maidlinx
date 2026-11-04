# Launch waitlist capture — agent report

**Date:** 2026-08-12  
**Branch:** `split/o-launch-gate` (PR #16)  
**Scope:** Email waitlist when booking unavailable (out of area or `booking_enabled=false`)

## Delivered

| Item | Detail |
|------|--------|
| Table | `public.launch_waitlist` (migration `00033_launch_waitlist.sql`) |
| Columns | `email` (required), `name` (optional), `market_id`, `source`, `page`, `created_at` |
| RLS | Public **insert** only (`anon`/`authenticated`); **select/delete** for `is_admin()` only; no public read of emails |
| API | `POST /api/waitlist` (Zod validation + IP rate limit 8/min); `GET /api/waitlist` owner-only |
| Confirmation email | Best-effort via existing `sendEmail` / `EMAIL_PROVIDER` (log or Resend). Signup succeeds even if email fails. No new paid services. |
| UI surfaces | Homepage hero (replaces mailto), `/book/address`, booking form market banner |
| Admin | `/owner/waitlist` — count + recent emails (admin/owner session) |
| Booking path | Unchanged when `booking_enabled=true`; auto-advance / Find cleaners gated closed when flag off |

## Signup appears when

1. Address resolves **out of service area**, or  
2. Address resolves to a market with **`booking_enabled=false`** (current TORONTO_GTA + SOUTH_FLORIDA config)

## Confirmation email

**Sent:** optional / best-effort after successful store.  
- `EMAIL_PROVIDER=log` (default): logged only, not delivered.  
- `EMAIL_PROVIDER=resend` + `RESEND_API_KEY`: single “You're on the list” email.

## Costs / safety

- **NEW_COST:** $0  
- Stripe LIVE: not touched  
- Content Studio: not touched  
- No fabricated subscribers  

## HUMAN_ACTION_REQUIRED

1. Apply Supabase migration **`00033_launch_waitlist`** (local + staging/prod as appropriate).  
2. Smoke: out-of-area + Toronto/FL address → waitlist form → row in `/owner/waitlist`.  
3. Keep `booking_enabled=false` until coverage GREEN per market.

## Tests

- `src/lib/waitlist/schema.test.ts`  
- `src/lib/markets/booking-availability.test.ts`  
- `src/app/api/waitlist/route.test.ts`  
