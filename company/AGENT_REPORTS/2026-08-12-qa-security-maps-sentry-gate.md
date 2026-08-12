# QA + Security — Maps retest + gate reclass (2026-08-12)

## Maps (production browser)

| Host | Autocomplete `100 King` | Select fills / continues | Current location |
|------|-------------------------|--------------------------|------------------|
| maidlinx.com | PASS (5 suggestions) | PASS → `/book/property`; resolved King St E Toronto | PASS — not stuck; reverse geocode `110 Dolobram Trail` |
| www.maidlinx.com | PASS (5 suggestions) | PASS → `/book/property` | (exercised on apex) |

Maps P0 cleared. Preview hosts need their own referrer if used.

## Sentry

FAIL — no `@sentry/nextjs`; stub logs only; `SENTRY_DSN` MISSING.  
Human action: create Sentry project + set DSN on Vercel; LE wires SDK.

## Notifications

FAIL for real-money (log-only / providers missing). Outbox does not fake delivery. In-app/API status sufficient for controlled TEST ops only.

## Smoke / regression

Fresh TEST e2e PASS (`4700004e-…`). Lint/typecheck/272 tests/build PASS. Stripe LIVE not enabled.

## Gate

P0 remaining: 2 (Sentry, notifications).  
Controlled TEST: YES. Real-money: NO.
