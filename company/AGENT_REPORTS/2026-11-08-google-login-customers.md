# Agent report — Google login for customers

**Date:** 2026-11-08  
**Branch:** `feature/google-login-customers`  
**Stripe LIVE:** OFF

## Verdict

| Item | Status |
|------|--------|
| IdP | Supabase Auth (existing) |
| UI | Continue with Google on `/sign-in`, `/sign-up`, booking Save-your-booking |
| Post-auth `next` | Preserved via `/auth/callback` (booking → `/book/review`) |
| Live Google consent | **BLOCKED** — Supabase Google provider not enabled (`provider is not enabled`) |
| Secrets in git / company docs | None |

## ENV_VARS_NEEDED

- App/Vercel (optional UI gate): `NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED` (default ON; set `false` to hide)
- Apple UI: `NEXT_PUBLIC_OAUTH_APPLE_ENABLED=true` only after Apple works
- Google Client ID/Secret: **Supabase Dashboard only** (not Vercel)

Founder steps: `docs/OAUTH_SETUP.md`.
