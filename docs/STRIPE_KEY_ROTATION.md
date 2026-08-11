# Stripe API key rotation (MaidLinx)

Use this checklist when rotating **Test / Sandbox** Stripe keys locally. Keep secrets out of git and out of chat.

## Before you start

- Stay in Stripe **Test mode / Sandbox only**. Do **not** switch to Live keys for local MaidLinx development.
- Edit keys only in `.env.local` at the project root (same folder as `package.json`).
- **Never commit** `.env.local` (covered by `.env.local` and `.env*.local` in `.gitignore`).
- **Never paste keys into chat**, Slack, email, or screenshots shared with others.

## pk vs sk (know the difference)

| Variable | Prefix (test) | Where it runs | Notes |
|----------|---------------|---------------|--------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | Client / browser | Publishable. Safe to expose in the frontend. |
| `STRIPE_SECRET_KEY` | `sk_test_...` | Server only | **Secret.** Never put this behind `NEXT_PUBLIC_`. Never commit or paste into chat. |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Server only | From `stripe listen`. Treat as secret. |

## Rotate keys (sandbox)

1. Open [Stripe Dashboard](https://dashboard.stripe.com/) → confirm **Test mode** is ON (sandbox).
2. Go to **Developers** → **API keys**.
3. **Roll** the secret key. Copy the new publishable and secret keys yourself (do not send them to chat).
4. Paste into `/Users/avnee/website/.env.local` yourself:
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=` → `pk_test_...`
   - `STRIPE_SECRET_KEY=` → `sk_test_...` (server-only; never `NEXT_PUBLIC_`)
5. Re-run the local webhook forwarder for a fresh signing secret:

   ```bash
   stripe listen --forward-to localhost:3001/api/webhooks/stripe
   ```

   Copy the printed `whsec_...` into `STRIPE_WEBHOOK_SECRET` in `.env.local`.
6. Restart the Next.js app so env vars reload:
   - Stop the running server with **Ctrl+C**
   - Then run:

   ```bash
   npm run dev
   ```

   (Do not restart until you have finished pasting keys and say “done” if an agent is helping.)
7. Smoke-test a booking payment and a webhook event in **test mode**.

## Security reminders

- Never commit `.env.local`.
- Never invent, screenshot, or print secret key values in chat.
- Prefer rolling compromised keys immediately; revoke the old secret after the new one works.
- Official guide: [Best practices for managing secret API keys](https://docs.stripe.com/keys-best-practices).

## Required `.env.local` names

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

Fill values locally from the Dashboard / `stripe listen`. Empty placeholders are fine until you paste.
