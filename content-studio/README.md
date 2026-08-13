# MaidLinx Content Studio (V1)

**Date:** 2026-08-12  
**Status:** MVP — admin-only, $0 new SaaS  
**Branch:** `split/o-launch-gate`

## Smallest safe plan

| Decision | Choice | Why |
|----------|--------|-----|
| Auth | `/admin/content-studio` via existing `requireAdminSession` | Reuses admin gate; owner can deep-link |
| Video engine | **FFmpeg CLI** (`scripts/content-studio/render.mjs`) | Remotion would add heavy deps to Next root and risk `next build` / bundling |
| Paid AI video | **None** | Cost hard stop |
| Stripe LIVE | Untouched | Launch rule |
| Customer app | No middleware / booking / payment changes | Isolated folders + admin route only |

### V1 deliverables

1. On-disk library under `content-studio/` (characters, episodes, assets, audio, renders, thumbnails).
2. Character profiles (Lexi, Nia, The Caller) + local reference image slots.
3. Episode generator UI (fields + auto timestamped shot list).
4. Episode 01 template: *I Know What You Spilled Last Night*.
5. FFmpeg compose: stills / color plates, Ken Burns, hard cuts, text overlays, end card, SRT + platform captions + thumbnail.
6. `npm run content-studio:render` for local export (not required in CI).  
7. Render API returns CLI only (no server-side FFmpeg spawn — keeps Next NFT safe).

### Explicitly out of V1

- Remotion monorepo package
- Paid stock / AI video APIs
- Fake customer testimonials presented as real reviews
- Serverless render on Vercel (FFmpeg may be absent)

## Open Content Studio

1. Sign in as admin (bootstrap / admin role).
2. Open [http://localhost:3001/admin/content-studio](http://localhost:3001/admin/content-studio).

## Render Episode 01

```bash
# Requires system FFmpeg (brew install ffmpeg)
npm run content-studio:render -- --episode=001-spilled-last-night
```

Outputs under `content-studio/renders/` and `content-studio/thumbnails/` (+ `.srt`, caption `.txt` files).

## Brand

Pulls MaidLinx ink `#111827`, accent `#0d9488`, logos from `public/brand/`. End card copy:

> MaidLinx  
> Your Clean Connection.  
> maidlinx.com

## NEW_COST

**$0** — open-source FFmpeg only (system install).
