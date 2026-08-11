# Social link previews (Open Graph / Twitter)

**Preview copy (customer-facing):**

| Field | Value |
|-------|--------|
| Title | MaidLinx \| Book Cleaning On Demand |
| Description | Book cleaning on demand in Toronto/GTA and South Florida. Enter your address, pick a service and time, and confirm online. |
| Image | App Router `opengraph-image` / `twitter-image` (1200×630), brand green / off-white |
| Canonical | `/` (and page-specific canonicals on `/earn`, `/for-business`) |

**Absolute URLs:** Set `NEXT_PUBLIC_SITE_URL` (preferred) or `NEXT_PUBLIC_APP_URL` to `https://maidlinx.com` in production. Without those, production falls back to `https://maidlinx.com`; local dev falls back to `http://localhost:3001`.

## Refresh crawler caches after deploy

Social apps cache OG tags aggressively. After changing title/description/image:

1. **Facebook / Instagram / Messenger** — [Sharing Debugger](https://developers.facebook.com/tools/debug/): scrape `https://maidlinx.com` (and key pages), then **Scrape Again**.
2. **LinkedIn** — [Post Inspector](https://www.linkedin.com/post-inspector/): inspect the URL and clear cache.
3. **Twitter / X** — [Card Validator](https://cards-dev.twitter.com/validator) (or post a test tweet and confirm the large image card).
4. **WhatsApp / iMessage / SMS** — usually pick up Facebook/OG data; if stale, re-scrape with the Facebook debugger first, then send a fresh message (or append a harmless query like `?v=2` once for testing).

Do not invent ratings or customer counts in preview text or on the OG creative.
