# MaidLinx — Stripe TEST setup (local)

Account email: **avneetksandhar@gmail.com**  
App: `http://localhost:3001`  
Never paste secret keys into chat or commit them. Put them only in `.env.local`.

## Env vars used by the app

| Variable | Where it comes from |
|----------|---------------------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API keys → Publishable key (`pk_test_...`) |
| `STRIPE_SECRET_KEY` | Same page → Secret key (`sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe CLI `stripe listen` output (`whsec_...`) |
| `DEPOSIT_PERCENT` | Already `25` in `.env.local` (deposit at checkout) |

Checkout needs `STRIPE_SECRET_KEY`. The card form needs `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`. Webhooks need `STRIPE_WEBHOOK_SECRET`.

---

## 1) Create / sign in to Stripe

1. Go to [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register).
2. Sign up or sign in with Google / email **avneetksandhar@gmail.com**.
3. Complete any account basics Stripe asks for (you can stay in Test mode for local booking).

## 2) Turn on TEST MODE

1. In the Stripe Dashboard, toggle **Test mode** **ON** (top right).
2. You should see a sandbox / test banner — do not use Live keys for local dev.

## 3) Copy API keys into `.env.local`

1. Open **Developers → API keys**  
   Direct link: [https://dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys)
2. Copy:
   - **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=`
   - **Secret key** → `STRIPE_SECRET_KEY=` (Reveal, then copy)
3. Open `/Users/avnee/website/.env.local` in your editor.
4. Paste the values yourself on those lines. Leave no spaces around `=`.
5. Confirm keys start with `pk_test_` and `sk_test_` (not `pk_live_` / `sk_live_`).

Do **not** paste these into chat, Slack, or git.

## 4) Stripe CLI + local webhook secret

Install CLI if needed (macOS):

```bash
brew install stripe/stripe-cli/stripe
```

Log in (browser opens; use the same Stripe account):

```bash
stripe login
```

In a **separate terminal**, forward webhooks to the Next.js app:

```bash
stripe listen --forward-to localhost:3001/api/webhooks/stripe
```

Copy the webhook signing secret (`whsec_...`) from that command’s output into `.env.local`:

```bash
STRIPE_WEBHOOK_SECRET=
```

Keep `stripe listen` running while you test payments.

## 5) Restart the app

```bash
cd /Users/avnee/website
npm run dev
# → http://localhost:3001
```

Env changes only apply after a restart.

## 6) Smoke-test a card payment

1. Book through `/book/address` → … → payment.
2. Use Stripe test card:
   - Number: `4242 4242 4242 4242`
   - Expiry: any future date
   - CVC: any 3 digits
   - ZIP: any
3. Expect a successful payment and booking confirmation (status moves toward **awaiting_assignment** when webhooks / confirm-payment run).

Optional **local-only** skip (no card): set `ALLOW_DEV_TEST_BOOKING=true` in `.env.local` for non-production ops testing, then use **DEV TEST — NO REAL PAYMENT** on `/book/payment`. **Never set this flag in production** — the API hard-disables the bypass when `NODE_ENV=production`. Prefer the real Stripe test-card path once keys are filled.

---

## Quick checklist

- [ ] Stripe account with **avneetksandhar@gmail.com**
- [ ] **Test mode** ON
- [ ] `pk_test_` → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in `.env.local`
- [ ] `sk_test_` → `STRIPE_SECRET_KEY` in `.env.local`
- [ ] `brew install stripe/stripe-cli/stripe` (if needed)
- [ ] `stripe login`
- [ ] `stripe listen --forward-to localhost:3001/api/webhooks/stripe`
- [ ] `whsec_` → `STRIPE_WEBHOOK_SECRET` in `.env.local`
- [ ] Restart `npm run dev`
- [ ] Pay with `4242 4242 4242 4242`
