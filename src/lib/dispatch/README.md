# Dispatch (future)

Auto-offer / auto-assign orchestration on top of [`src/lib/matching/`](../matching/).

MVP uses **admin match score + manual assign**. This module is a stub for:

- offer fan-out from `rankCleaners`
- accept / decline / expire windows (`booking_offers` table)
- reassignment when an offer lapses

Do not invent production dispatch logic here yet.
