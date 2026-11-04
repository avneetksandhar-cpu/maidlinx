# Agent report — Google + Apple Sign In (MaidLinx)

**Date:** 2026-10-19  
**Branch:** `split/o-launch-gate` (PR #16)  
**Stripe LIVE:** OFF

## Status

| Item | Status |
|------|--------|
| GOOGLE_STATUS | CODE_READY · SECRETS_PENDING (Supabase Google provider + Google Cloud OAuth client) |
| APPLE_STATUS | CODE_READY · SECRETS_PENDING (Supabase Apple provider + Apple Services ID / key); native Capacitor documented |
| UI_PATHS | `/sign-in`, `/sign-up`, `/sign-up?role=cleaner&next=/cleaner/application` |
| ENV_REQUIRED | No new Vercel secrets — configure in Supabase dashboard + Google Cloud + Apple Developer (see `docs/OAUTH_SETUP.md`) |
| STRIPE_LIVE | OFF |

## Code

- `src/lib/auth/oauth.ts` — providers, safe next, redirectTo builder, allowlist
- `src/app/api/auth/oauth/[provider]/route.ts` — PKCE OAuth start
- `src/components/auth/oauth-buttons.tsx` — dark mint Google / Apple rows
- `src/components/auth/auth-form.tsx` — buttons above email/password
- `src/app/auth/callback/route.ts` — role heal + cleaner applicant after OAuth
- Docs: `docs/OAUTH_SETUP.md`, `native/APP_STORE.md` (native Apple section)

## HUMAN_ACTION_REQUIRED

Founder must enable Google + Apple in Supabase with real client IDs/secrets/keys.
Until then, buttons show and start URLs generate, but provider consent will fail.
