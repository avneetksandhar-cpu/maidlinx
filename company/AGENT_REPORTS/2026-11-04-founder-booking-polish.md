# Agent report — Founder Ava booking polish (Save your booking)

**Date:** 2026-11-04  
**Branch:** `feature/founder-booking-polish`  
**PR:** https://github.com/avneetksandhar-cpu/maidlinx/pull/28  
**Stripe LIVE:** OFF  
**Coord:** Pay-after kept on `feature/pay-after-cleaning` — not in this PR.  
**Preview:** http://127.0.0.1:3013 · shots in `docs/screenshots/founder-polish-2026-11-04/`

## SCREEN_STATUS

| Screen | Status | Notes |
|--------|--------|-------|
| Home | DONE | Midnight `#01193D`, 48px mark, “Where are we cleaning?”, unit on tap, upcoming → **View my booking** first, usual clean = home + prefs + current price + next opening |
| Choose your clean | DONE | One-line blurbs; What’s included? checklist; full-tap extras with price beside name; total above **Choose a time** |
| Choose a time | DONE | Earliest available first; Choose another day under; `Arrives … · Cleaning takes about N hours` when duration reliable |
| Sign in (Save your booking) | DONE | `/sign-in?from=booking` → compact mark, single-line visit reminder, OAuth only if `NEXT_PUBLIC_OAUTH_*_ENABLED=true`, else email magic link; Check your email + resend; resumes **Review**; never charges |
| Review | DONE | Address / Arrival / Service / Total + Edit each; payment timing directly above **Request clean**; change banner after Edit |
| Returning | DONE | Book my usual clean card with saved home, prefs, live price, next opening |

## Layout system

- 48px logo · 20px side margins · body 16–17px · one heading style  
- Navy BG; `#102B49` surfaces for fields / selected details  
- Solid turquoise only on primary CTA; selections = check + outline  
- Sticky footer + `--ml-keyboard-inset` so keyboard never covers inputs/errors  

## Auth / preserve

- Auth required at **review** (+ payment)  
- Draft stays in `sessionStorage` (`maidlinx_booking_state`) across Back / Edit / magic-link new tab  
- Signing in alone never creates booking or charges card  

## Env

```
NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED=false
NEXT_PUBLIC_OAUTH_APPLE_ENABLED=false
```

Flip to `true` only after Supabase provider works (see `docs/OAUTH_SETUP.md`).

## STRIPE_LIVE

**OFF** — no LIVE keys introduced; payment path untouched in this PR.
