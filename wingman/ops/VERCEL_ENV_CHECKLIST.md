# Wingman — Vercel env + first paid TEST night

**Purpose:** Host this app on **its own** HTTPS URL and prove one Stripe **TEST** booking end to end.  
**Verdict until this list is done:** not deploy-ready. Localhost (`:3005`) already works.

Do **not** add these keys to MaidLinx (`website` / `maidlinx`). Live Stripe keys are rejected by the app.

---

## 1. Create the project (human)

- [ ] Vercel → **Add New** → this Git repo
- [ ] **Root Directory** = `wingman` (not repo root)
- [ ] Framework = Next.js (see `vercel.json`)
- [ ] Production branch you actually deploy
- [x] Dedicated project created: **maidlinx/wingman** (`prj_YWe6qMDYruUTreIenjCCehmcgCRn`) — not `website` / maidlinx.com
- [x] Production URL: `https://wingman-ecru-rho.vercel.app`
- [ ] Copy the Production URL: `https://wingman-ecru-rho.vercel.app` (no trailing slash)

Framework, install, and build commands are already in `vercel.json`. Daily cron hits `/api/cron/event-sync` at 10:00 UTC — that route needs `EVENT_SYNC_SECRET`.

---

## 2. Production environment variables

Set these on the **Wingman** project → Settings → Environment Variables → **Production** (and Preview if you use preview deploys). Values stay in Vercel — never in git or `company/`.

### Required (app will not run without these)

| Name | Rule |
| --- | --- |
| `DATABASE_URL` | Existing Neon pooled URL (`sslmode=require`) |
| `DATABASE_URL_UNPOOLED` | Same Neon project, unpooled (migrations / some jobs) |
| `AUTH_SECRET` | Long random secret. **New value for production** — do not reuse a leaked local string if you can avoid it |
| `NEXT_PUBLIC_APP_URL` | Exact `https://YOUR-HOST` (must match the live origin) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Must start with `pk_test_` |
| `STRIPE_SECRET_KEY` | Must start with `sk_test_` or `rk_test_` |
| `STRIPE_WEBHOOK_SECRET` | Must start with `whsec_` — from the **production** webhook endpoint (step 3), not the `stripe listen` secret |

### Required flags (wrong values break launch)

| Name | Production value |
| --- | --- |
| `ENABLE_TEST_FIXTURES` | `false` |
| `AUTH_DEV_RESET` | `false` (do not return reset URLs/tokens in JSON) |

### Optional (skip is fine; adapters no-op)

| Name | Notes |
| --- | --- |
| `TICKETMASTER_API_KEY` | Discovery sync; without it Ticketmaster is skipped |
| `EVENT_SYNC_SECRET` | Required for the Vercel cron and unauthenticated `/api/cron/event-sync` |
| `PREDICTHQ_TOKEN` | Optional second source |
| `SEED_PASSWORD` | **Do not set on Production** |

### Do not set on this project

- Any `sk_live_` / `pk_live_` / `rk_live_`
- MaidLinx Supabase / Clerk production keys (Sprint 1 auth is Neon cookies)
- `ENABLE_TEST_FIXTURES=true`

After env is saved: **Redeploy** Production so Next.js picks up `NEXT_PUBLIC_*`.

---

## 3. Stripe TEST webhook (production host)

Local `stripe listen` secrets **do not** work on Vercel.

- [ ] Stripe Dashboard (test mode) → Developers → Webhooks → **Add endpoint**
- [ ] URL: `https://YOUR-HOST/api/webhooks/stripe`
- [ ] Events at minimum: `checkout.session.completed`, `checkout.session.expired`, `payment_intent.payment_failed`, `charge.refunded`
- [ ] Copy the endpoint signing secret (`whsec_…`) into `STRIPE_WEBHOOK_SECRET` on Vercel
- [ ] Redeploy if you changed the secret after the first deploy

---

## 4. Neon / seed before first traffic

On your laptop (same Neon project the Vercel `DATABASE_URL` points at):

```bash
cd /Users/avnee/website/wingman
# .env.local already has Neon
ENABLE_TEST_FIXTURES=false npm run migrate
ENABLE_TEST_FIXTURES=false npm run seed
```

- [ ] Migrations applied on that Neon
- [ ] `ENABLE_TEST_FIXTURES=false` so TEST Wingman / TEST offers stay off public pages
- [ ] Confirm `GET https://YOUR-HOST/api/wingmen` → `count: 0`
- [ ] Confirm `GET https://YOUR-HOST/api/events?when=all` → listings, `bookableCount: 0`

---

## 5. Smoke test on the live URL

Do this as a real user in a private window. Do **not** use `/test/booking` as the happy path.

- [ ] `https://YOUR-HOST` — landing, **Get Started**, no “Stripe TEST” copy
- [ ] `/legal/privacy` and `/legal/terms` load
- [ ] Sign up → lands on `/home`
- [ ] Events load (or honest empty/error)
- [ ] `/book` → confirm $500 → Stripe Checkout (test card `4242…`)
- [ ] After pay, Stripe webhook **200** on the endpoint
- [ ] Request status becomes paid/confirmed; chat unlocks
- [ ] Forgot-password does **not** return a `resetUrl` in the JSON (`AUTH_DEV_RESET=false`)

If checkout says payment is unavailable: keys missing or live keys were pasted. Fix env; do not invent keys.

---

## 6. After HTTPS works — TestFlight (optional)

Only if you want the iPhone WebView. Full Apple steps: [`TESTFLIGHT_READY_REPORT.md`](../TESTFLIGHT_READY_REPORT.md).

- [ ] `mobile/.env` → `EXPO_PUBLIC_API_URL=https://YOUR-HOST`
- [ ] `eas init` → paste `projectId` into `mobile/app.json`
- [ ] App Store Connect app bundle ID `com.wingman.miami`
- [ ] Privacy Policy URL = `https://YOUR-HOST/legal/privacy`

---

## 7. Password reset later (not required for first TEST night)

Production reset creates a token in Neon but **does not send email**. Add a real mailer (Resend or similar) only when testers need “Forgot password”. Until then, testers create a new account.

---

**Done when:** one $500 Stripe **TEST** night is paid on `https://YOUR-HOST` and the webhook updates the booking. Still not real-money launch.
