# Daily Miami event sync

Authorized sources only. No scraping. Ticketmaster and PredictHQ keys stay on the server.

## Required environment variables

Paste into `.env.local`. Do not commit values. Do not invent keys.

| Variable | Required for | If missing |
| --- | --- | --- |
| `DATABASE_URL` / `DATABASE_URL_UNPOOLED` | App + migrate | App will not start |
| `AUTH_SECRET` | Sessions | Auth fails |
| `EVENT_SYNC_SECRET` | `POST /api/cron/event-sync` | Cron returns 503 unless an operator is signed in. Admin **Sync now** still works. |
| `TICKETMASTER_API_KEY` | Ticketmaster Discovery adapter | Adapter **skips** with a structured log. Job still runs. |
| `PREDICTHQ_TOKEN` | Optional PredictHQ adapter | Adapter **skips**. |
| `STRIPE_SECRET_KEY` | Payments | Pay stays blocked |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Payments | Pay stays blocked |
| `STRIPE_WEBHOOK_SECRET` | Webhooks | Pay stays blocked |
| `SEED_PASSWORD` | Local seed accounts | `npm run seed` fails |

Partner feed (future Tabler) is **disabled**. It has no scrape and no key.

Request a Ticketmaster Discovery key at https://developer.ticketmaster.com/. PredictHQ is optional.

## Setup

```bash
cd /Users/avnee/website/wingman
cp .env.example .env.local   # add Neon + EVENT_SYNC_SECRET + optional TM / PredictHQ
npm install
npm run migrate
npm run seed                 # keeps the existing 34 discovery events
npm run sync:events          # daily job locally; TM/PredictHQ skip without keys
```

Vercel cron: `0 10 * * *` (10:00 UTC daily) → `GET/POST /api/cron/event-sync` with header `Authorization: Bearer $EVENT_SYNC_SECRET`.

Production uses the **same** server env var name as local: `TICKETMASTER_API_KEY`. Set it on the Vercel project (Production). Do not prefix it `NEXT_PUBLIC_`. Do not invent a key. Without that var, the Ticketmaster adapter **skips** — skip/empty-key is not a successful Ticketmaster sync. Also set `EVENT_SYNC_SECRET` on Vercel or cron returns 503.

Admin **Sync now** is on `/operator/events` (operator session, no secret required).

## Sources

1. Ticketmaster Discovery API (Miami and Miami Beach only; nightlife / dance-electronic / concerts / festivals / official afterparties; skip if no key).
2. Approved venue listings — E11EVEN, LIV, Club Space, Factory Town, M2 from admin/CSV/seed. No scrape.
3. PredictHQ — optional.
4. Admin-created and CSV/XLSX imports (CSV stays pending until approved).
5. Partner feed stub — disabled.

## Rules

- Upsert on `source_id + external_id`.
- Dedup across sources by normalized venue + title/performer + local start (`America/New_York`).
- Stale after **two** missed syncs. One miss does not remove a listing.
- Hide from the public feed 6 hours after end.
- Admin-locked fields are never overwritten by automated data.
- Ticketmaster Discovery images are stored only when the URL is on an authorized Ticketmaster host. Attribution is saved on `image_attribution`. Other sources do not copy images unless an operator marks usage verified. Public cards show the authorized image or a branded / licensed atmosphere fallback.
- `Book with Wingman` only when `booking_status = VERIFIED_AVAILABLE`.
