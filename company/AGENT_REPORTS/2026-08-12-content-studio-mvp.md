# Content Studio MVP — agent report

**Date:** 2026-08-12  
**Branch:** `split/o-launch-gate` (PR #16)  
**NEW_COST:** **$0**

## ARCHITECTURE

- **Video engine:** Isolated **FFmpeg CLI** at `scripts/content-studio/render.mjs` (not Remotion). Remotion was skipped to avoid heavy root deps / Next bundling risk.
- **Data plane:** On-disk `content-studio/` (characters, episodes, assets, audio, renders, thumbnails). Never overwrites sources (timestamped uploads).
- **App surface:** Admin-only App Router pages under `/admin/content-studio` gated by existing `requireAdminSession` / `getAdminSessionOrNull`. No booking, Stripe, consent, Sentry, or cleaner flow changes. Stripe LIVE untouched.
- **Owner nav:** Deep-link to the same admin studio (owner session = admin gate).

## ROUTES

| Route | Purpose |
|-------|---------|
| `/admin/content-studio` | Library + episode generator |
| `/admin/content-studio/characters` | Lexi / Nia / Caller + reference uploads |
| `/admin/content-studio/episodes/[slug]` | Shot list, captions, Render TikTok panel |
| `POST /api/admin/content-studio/episodes` | Create episode + auto shot list |
| `GET/PUT /api/admin/content-studio/episodes/[slug]` | Load / patch |
| `GET /api/admin/content-studio/characters` | Character library |
| `POST /api/admin/content-studio/characters/[id]/upload` | Reference image (admin-only) |
| `POST /api/admin/content-studio/render` | CLI instructions or optional local spawn |

## How to open

1. `npm run dev` → sign in as admin  
2. Open `/admin/content-studio` (also linked from Admin → Growth → Content Studio and Owner nav)

## How to render Episode 01

```bash
brew install ffmpeg   # HUMAN once
npm run content-studio:render:ep01
# → content-studio/renders/001-spilled-last-summer-tiktok.mp4
# → .srt + platform caption .txt + thumbnail jpg
```

UI “Render TikTok” shows the same command; “Try local render” spawns the script when FFmpeg is on PATH.

## Episode 01

**I KNOW WHAT YOU SPILLED LAST SUMMER** — 15s mini horror-comedy + MaidLinx end card  
(`content-studio/episodes/001-spilled-last-summer/episode.json`)  
Scripted fiction disclaimer — not a customer testimonial. No franchise IP.

## DEPENDENCIES added

- **npm:** none  
- **system (optional for MP4):** FFmpeg

## BUILD STATUS

- `npm run lint` — pass  
- `npm run typecheck` — pass  
- `npm test -- src/lib/content-studio` — pass (2)  
- `npm run build` — pass (routes include `/admin/content-studio*`)

## HUMAN_ACTION_REQUIRED

1. `brew install ffmpeg` (or equivalent) to export MP4  
2. Drop character reference stills into `content-studio/characters/*/references/` (or upload in UI)  
3. Optional: episode stills under `content-studio/episodes/001-spilled-last-summer/assets/` and set `shot.still` paths  
4. Optional BGM/SFX under `content-studio/audio/`
