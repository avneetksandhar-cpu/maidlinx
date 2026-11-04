# Cleaner live location (MaidLinx)

Customer en-route tracking when a cleaner is assigned and the booking is **`on_the_way`** or **`arrived`**.

## Privacy rules

- Share **current point only** (upsert) — no history trail table.
- Only while status is `on_the_way` or `arrived` (marketplace names; not a separate `EN_ROUTE` enum).
- Stop / delete row when the job moves to `in_progress`, `completed`, `cancelled`, etc.
- Customer API requires booking ownership (session or booking access token) **and** an assigned cleaner.
- Exact address / access notes remain gated until accept (existing job reveal rules).
- Prefer device GPS while en route — do not treat a home-base address as live location.

## Database

Migration: `supabase/migrations/00020_cleaner_live_locations.sql`

Columns: `booking_id` (PK), `cleaner_id`, `lat`, `lng`, `accuracy`, `updated_at`.

**Do not** run `supabase db push` / reset without confirming the linked Supabase project. Apply when ready:

```bash
# After verifying project ref in `supabase link` / dashboard
supabase db push
```

Or paste the migration SQL in the Supabase SQL editor for that project.

## APIs

| Method | Path | Who | Notes |
|--------|------|-----|--------|
| `PATCH` | `/api/cleaner/jobs/:id/location` (alias `/api/pro/...`) | Assigned cleaner | Auth + status checks; body `{ lat, lng, accuracy?, timestamp? }` |
| `GET` | `/api/bookings/:id/location` | Customer (owner / token) | Returns live view + ETA when allowed |

## UI

- Cleaner job detail: `LiveLocationSharer` watches GPS while en route / arrived.
- Customer `/booking/[id]`: `LiveCleanerMap` — “Your MaidLinx Pro is on the way”, two markers, ETA, last update.
