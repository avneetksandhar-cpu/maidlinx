# Wingman

Standalone Next.js app in the `wingman/` directory. The Maidlinx app lives in the repo root — keep them separate.

See [STRUCTURE.md](./STRUCTURE.md) for folder conventions.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, Framer Motion, TanStack Query |
| Backend | Supabase (PostgreSQL, RLS, Edge Functions, Storage) |
| Auth | Supabase Auth (default) or Clerk — switch via env |
| Payments | Stripe |
| Maps | Google Maps |
| Notifications | OneSignal |
| Deployment | Vercel |

## Getting started

### 1. Install dependencies

```bash
cd wingman
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in values from your Supabase, Stripe, Google Cloud, and OneSignal dashboards. See [Auth](#auth) below for provider choice.

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3005](http://localhost:3005).

Ports 3000 and 3001 are used by the parent Maidlinx app; Wingman defaults to **3005** (3002–3004 were occupied).

## Project structure

```
wingman/
├── app/                  # Next.js App Router pages & layouts
├── components/           # Shared UI
├── features/             # Feature modules (auth, onboarding, etc.)
├── lib/
│   ├── auth.ts           # Auth provider selection (supabase | clerk)
│   ├── stripe.ts         # Re-exports Stripe client helpers
│   ├── query-provider.tsx
│   └── supabase/
│       ├── client.ts     # Browser Supabase client
│       └── server.ts     # Server Supabase client (cookies)
├── services/             # External service clients (Stripe, etc.)
├── middleware.ts         # Supabase session refresh (when using supabase auth)
└── .env.example          # Required env vars (no secrets)
```

## Auth

**Default: Supabase Auth** (`NEXT_PUBLIC_AUTH_PROVIDER=supabase`)

Supabase Auth is the recommended default because Wingman uses Supabase for PostgreSQL, RLS, Storage, and Edge Functions. User sessions map directly to RLS policies via `auth.uid()`.

**Alternative: Clerk** (`NEXT_PUBLIC_AUTH_PROVIDER=clerk`)

Use Clerk if you need richer pre-built auth UI, social login widgets, or organization management. You'll need to sync Clerk user IDs to Supabase (e.g. via JWT template or webhook) for RLS to work.

## Manual setup

### Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Copy **Project URL** and **anon key** to `.env.local`.
3. Enable Row Level Security on tables and write policies using `auth.uid()`.
4. Create Storage buckets as needed.
5. Deploy Edge Functions from the Supabase CLI when ready.

### Stripe

1. Create products/prices in the [Stripe Dashboard](https://dashboard.stripe.com).
2. Add publishable and secret keys to `.env.local`.
3. Set up a webhook endpoint (e.g. `/api/webhooks/stripe`) and add `STRIPE_WEBHOOK_SECRET`.

### Google Maps

1. Enable **Maps JavaScript API** in Google Cloud Console.
2. Restrict the API key to your domains.
3. Set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.

### OneSignal

1. Create an app at [onesignal.com](https://onesignal.com).
2. Set `NEXT_PUBLIC_ONESIGNAL_APP_ID` and `ONESIGNAL_REST_API_KEY`.
3. Integrate the OneSignal SDK when building notification features.

## Deploy to Vercel

1. Import the repo in [Vercel](https://vercel.com).
2. Set **Root Directory** to `wingman`.
3. Add all env vars from `.env.example` in the Vercel project settings.
4. Deploy — `vercel.json` is configured for Next.js.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server on port 3005 |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
