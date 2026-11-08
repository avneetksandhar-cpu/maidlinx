# Maidlinx Website

> Saved from the MaidLinx website project (`/Users/avnee/website`).  
> Active redesign work lives in **MaidLinx v2** at `/Users/avnee/maidlinx-v2`.

## Current status

| Location | Role |
|----------|------|
| `/Users/avnee/website` | Original MaidLinx Next.js marketplace (foundation, dashboards, booking APIs) |
| `/Users/avnee/maidlinx-v2` | Premium mobile-first redesign — address-first homepage, 10-step booking flow, navy/teal design system |

**MaidLinx v2** is the primary development target. See `docs/REDESIGN-PLAN.md` and `docs/ARCHITECTURE.md` in that repo for the latest plan and shared-backend strategy.

---

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
# Fill in Supabase and Stripe test keys (see below)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

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

## License

Proprietary — MaidLinx.
