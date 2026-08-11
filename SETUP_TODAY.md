# MaidLinx — get fully functional in ~30 minutes

This checklist unblocks the real booking path today. Code is ready; you must paste your own keys (cannot be automated).

## 0) Prerequisites

- Node 20+ and npm (`export PATH="$HOME/.local/node/bin:$PATH"` if needed)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`supabase --version`)
- [Stripe CLI](https://stripe.com/docs/stripe-cli) (`stripe --version`)
- Repo root: `/Users/avnee/website`

```bash
cd /Users/avnee/website
npm install
```

## 1) Create a Supabase project (~5 min)

1. Go to [https://supabase.com](https://supabase.com) → New project.
2. Project Settings → **API**:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server only)
3. Authentication → Providers → Email: enable Email provider (confirm email can be off for local testing).

## 2) Stripe TEST keys + webhook forward (~5 min)

1. [Stripe Dashboard → Test mode](https://dashboard.stripe.com/test/apikeys):
   - Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Secret key → `STRIPE_SECRET_KEY`
2. In a separate terminal:

```bash
stripe listen --forward-to localhost:3001/api/webhooks/stripe
```

3. Copy the `whsec_...` signing secret → `STRIPE_WEBHOOK_SECRET`.

## 3) Google Maps Places API key (~3 min, optional but recommended)

1. Google Cloud Console → enable **Places API** (billing required).
2. Create an API key → `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
3. Without this key, address entry still works **manually**.

## 4) Fill `.env.local`

```bash
cp .env.example .env.local   # only if .env.local is missing
```

Paste values into `.env.local` for:

| Variable | From |
|----------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe test pk |
| `STRIPE_SECRET_KEY` | Stripe test sk |
| `STRIPE_WEBHOOK_SECRET` | `stripe listen` whsec |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Places key (optional) |
| `ADMIN_BOOTSTRAP_EMAIL` | Your admin login email |

Leave `EMAIL_PROVIDER=log` and `SMS_PROVIDER=log` for local testing.

## 5) Apply migrations `00001`–`00014`

```bash
supabase login
supabase link --project-ref <YOUR_PROJECT_REF>
supabase db push
```

Migrations live in `supabase/migrations/`:

- `00001_initial_schema.sql` … `00014_match_engine_v1.sql`

Confirm in Supabase Table Editor that `bookings`, `booking_events`, `markets`, `service_zones` exist.

Local alternative: `supabase start` then `supabase db reset`.

Optional types refresh: `npm run db:types`.

## 6) Create test admin + cleaner users

See [`scripts/SEED_TEST_USERS.md`](scripts/SEED_TEST_USERS.md).

Minimum path:

1. Sign up at `http://localhost:3001/sign-up` with `ADMIN_BOOTSTRAP_EMAIL` → becomes **admin**.
2. Sign up a second email for a cleaner → set role to `cleaner` in SQL (see seed doc) and insert a `cleaners` row for that user.
3. Sign in admin → `/admin`, cleaner → `/cleaner`.

## 7) Start the app

```bash
# If Turbopack cache looks corrupt:
rm -rf .next

npm run dev
# → http://localhost:3001
```

Keep `stripe listen` running in another terminal.

## 8) Smoke the customer booking (Toronto + 4242)

Multi-route funnel: `/book/address` → property → details → service → extras → schedule → review → payment → `/booking/[id]`.

1. Open `http://localhost:3001/book/address`.
2. Enter a **Toronto** address (e.g. `100 King` / postal `M5V 2T6`) — Google suggestions if Maps key set, else type manually → Continue.
3. Property (Apt / Condo) → details (beds/baths/size) → Deep → Inside oven (total rises) → schedule → review.
4. Contact → pay with Stripe test card `4242 4242 4242 4242`, any future expiry, any CVC.
5. Expect **Cleaning booked / Finding your MaidLinx Pro…** and status **awaiting_assignment**.
   - Webhook optional locally: after card success, `POST /api/bookings/[id]/confirm-payment` syncs from Stripe PI status.

### DEV_TEST_BOOKING (no card) — development only

**Never set `ALLOW_DEV_TEST_BOOKING` or `ALLOW_DEV_BOOKING` in production.** The server forces this feature off whenever `NODE_ENV=production`, regardless of env values.

Local only: in `.env.local` set `ALLOW_DEV_TEST_BOOKING=true` (or alias `ALLOW_DEV_BOOKING=true`), then restart `npm run dev`.

On `/book/payment`, use **DEV TEST — NO REAL PAYMENT**. Creates a paid `awaiting_assignment` booking with a synthetic `dev_test_*` payment intent id. Requires `NODE_ENV !== "production"` **and** an explicit allow flag (defaults off if missing).

Out-of-market check: a Florida ZIP outside Miami/Broward/Palm Beach (e.g. Jacksonville `32099`) or Austin `78701` should show **not in service area** / fail quote (no price).

## 9) Admin assign (ranked match engine)

1. Sign in as admin → `/admin/bookings`.
2. Open the new booking → **Eligible cleaners** ranked by match score (not nearest-only).
3. Expand a cleaner for factor breakdown (Travel/ETA, reliability, rating, …).
4. **Assign** a cleaner (or create an offer).
5. Confirm **Event timeline** shows create / payment / assign events (needs migration `00012`).

Marketplace roadmap: [`docs/MARKETPLACE_ROADMAP.md`](docs/MARKETPLACE_ROADMAP.md).

## 10) Cleaner complete the job

1. Sign in as cleaner → `/cleaner/jobs`.
2. Open job → **Accept** → **On the way** → **Arrived** → **Start** → **Complete**.

## 11) Customer sees completed timeline

1. Customer dashboard `/dashboard/bookings` or confirmation page.
2. Status timeline progresses to **completed**.
3. **Book again** CTA appears on completed bookings (prefills `/book`).

---

## Quick verification commands

```bash
export PATH="$HOME/.local/node/bin:$PATH"
npm run lint
npm run typecheck
npm run test
npm run build

# Quote API (with dev server running)
curl -s -X POST http://localhost:3001/api/bookings/quote \
  -H 'content-type: application/json' \
  -d '{"line1":"123 King St W","city":"Toronto","state":"ON","postalCode":"M5V 2T6","country":"CA","serviceType":"standard","bedrooms":2,"bathrooms":1,"squareFootage":1500,"extras":[]}'

# Expect pricing.currency = CAD

curl -s -X POST http://localhost:3001/api/bookings/quote \
  -H 'content-type: application/json' \
  -d '{"line1":"1 Main","city":"Austin","state":"TX","postalCode":"78701","country":"US","serviceType":"standard","bedrooms":2,"bathrooms":1,"squareFootage":1500,"extras":[]}'

# Expect 422 OUT_OF_SERVICE_AREA
```

## What you must do manually (cannot be automated)

- Create Supabase project and paste URL + anon + service_role keys
- Create Stripe test keys and run `stripe listen` for webhook secret
- Create Google Maps Places key (optional)
- `supabase link` + `supabase db push`
- Create/sign-in real Auth users for admin + cleaner
- Pay with Stripe test card in the browser
