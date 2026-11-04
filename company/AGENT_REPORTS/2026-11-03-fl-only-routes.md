# South Florida–only customer routes (phone-testable)

**Preview:** `http://127.0.0.1:3001/`  
**Screenshots:** `.tmp/screenshots/fl-home-mobile.png` (390×844)  
**Stripe LIVE:** OFF

## Routes

| Route | Customer promise |
|-------|------------------|
| `/` | “Come home to clean.” + **South Florida home cleaning**. One address/ZIP. Outside FL (incl. GTA) → waitlist `out_of_area`. |
| `/book` / welcome | South Florida home cleaning |
| `/book/address` | FL-biased Places; Continue only when `CUSTOMER_HOME_MARKET_ID` (SOUTH_FLORIDA); GTA → waitlist |
| Later funnel | Unchanged pricing engine; USD when FL |

## Market data preserved

- `TORONTO_GTA` remains in `LAUNCH_MARKET_IDS` / zones / flags for supply ops.
- Customer Home helpers: `CUSTOMER_HOME_MARKET_ID`, `resolveCustomerHomeWaitlistReason`.

## Verified

- HTML home: FL copy present; no Toronto/GTA/CAD clutter on first screen.
- Logic: GTA postal → `out_of_area`; FL postal → `booking_disabled` (flags still closed).
- Unit tests: `booking-availability` + booking routes.
