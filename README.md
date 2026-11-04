# MaidLinx

MaidLinx is a two-sided cleaning marketplace built with Next.js, Supabase, and Stripe. Customers book trusted cleaners online; cleaners and administrators manage jobs through dedicated dashboards.

## Stack

- **Next.js** (App Router) + TypeScript (strict)
- **Tailwind CSS** — MaidLinx ivory / espresso / champagne design system
- **Supabase** — PostgreSQL, Auth, Storage, Row Level Security
- **Stripe Checkout** — server-side payments and webhooks
- **React Hook Form** + **Zod** — forms and validation
- **Lucide React** — icons
- **Vitest** — pricing and payment workflow tests

## Local development

```bash
npm install
cp .env.example .env.local
# Fill in Supabase and Stripe test keys — see SETUP_TODAY.md for the full checklist
npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

**Same-day setup:** follow [`SETUP_TODAY.md`](./SETUP_TODAY.md) (Supabase + Stripe test + migrations + smoke path).

## Environment variables

Copy `.env.example` to `.env.local` and configure:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (browser-safe) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin operations |
| `STRIPE_SECRET_KEY` | Stripe API secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `EMAIL_PROVIDER` | `log`, `resend`, or `postmark` |
| `ADMIN_BOOTSTRAP_EMAIL` | Email promoted to admin on first login (e.g. `info@maidlinx.com`) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Places autocomplete (optional; manual address still works) |

Never commit `.env.local` or real secrets.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run test` | Vitest unit tests |

## Project phases

Development follows phased delivery:

1. **Foundation** — design system, env validation, layout, Supabase session middleware
2. **Marketing** — landing page, navigation, SEO
3. **Auth & database** — migrations, RLS, Supabase Auth, roles
4. **Booking** — pricing engine, multi-step flow, quotes
5. **Payments** — Stripe Checkout, webhooks, confirmation
6. **Customer dashboard**
7. **Cleaner dashboard**
8. **Admin dashboard**
9. **Hardening** — error boundaries, security headers, tests
10. **Documentation & launch checklist**

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Copy the project URL, anon key, and service role key into `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only; required for `POST /api/bookings`)
3. Apply migrations from `supabase/migrations/`:

   ```bash
   # Link your project (first time only)
   supabase link --project-ref <your-project-ref>

   # Push migrations to remote
   supabase db push
   ```

   For local Supabase: `supabase start` then `supabase db reset`.

4. Generate types: `npm run db:types` (requires Supabase CLI).

Without Supabase env vars, the booking UI still works for quotes, but `POST /api/bookings` returns **503** with a clear configuration message.

## Stripe test setup

1. Create a Stripe account and enable test mode.
2. Add `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to `.env.local`.
3. For webhooks locally: `stripe listen --forward-to localhost:3001/api/webhooks/stripe`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`.

Test users (admin + cleaner): see [`scripts/SEED_TEST_USERS.md`](./scripts/SEED_TEST_USERS.md).

## Deployment (Vercel)

1. Push the repository to GitHub.
2. Import the project in Vercel.
3. Add all environment variables from `.env.example`.
4. Configure the Stripe webhook endpoint to `https://your-domain.com/api/webhooks/stripe`.
5. Run Supabase migrations against the production database before go-live.

## License

Proprietary — MaidLinx.
