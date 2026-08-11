# Lead Engineer — social link previews

**Date:** 2026-08-11  
**Branch:** `cursor/live-location-and-booking-ux`

## Done

- Root + homepage Open Graph / Twitter metadata completed (title, description, url, type, site_name, `summary_large_image`).
- Added App Router `opengraph-image.tsx` + `twitter-image.tsx` (1200×630, green/off-white, no fake metrics).
- Production site URL fallback → `https://maidlinx.com` when env unset; local still `localhost:3001`.
- Documented cache refresh in `company/growth/SOCIAL_PREVIEWS.md`.

## Ops note

Set `NEXT_PUBLIC_SITE_URL=https://maidlinx.com` in production so absolute OG URLs match the live host.
