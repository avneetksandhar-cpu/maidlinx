# MaidLinx — App Store + production readiness (2026-10-19)

**Branch:** `split/o-launch-gate` (PR tip)  
**Owner report:** end-to-end readiness for founder  
**STRIPE_LIVE:** OFF (not flipped)

See parent chat return block for the scorecard. Supporting docs:

- `native/APP_STORE.md` — Capacitor / signing / native deltas
- `native/ASC_PREP.md` — App Store Connect materials (do not submit)
- `company/LAUNCH_GATE.md` — prior controlled TEST evidence (2026-08-14)

## Live coverage (Supabase, this audit)

| Metric | Count |
|--------|------:|
| Total cleaners | 7 |
| APPROVED | 1 (unattributed `market_id=null`) |
| BOOKABLE | 0 |
| GTA / FL bookable | 0 / 0 |
| Markets booking_enabled | false / false |

Do not claim broad availability. Do not open markets until ≥2 bookable in one zone.

## Deploy identity (verify)

`GET https://www.maidlinx.com/api/health` → `status=ok`, `sentry=true`, `release=<DEPLOY_SHA>`
