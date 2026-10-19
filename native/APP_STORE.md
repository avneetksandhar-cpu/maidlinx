# MaidLinx — App Store / Capacitor iOS shell

## Strategy

**Capacitor iOS shell** wrapping the live Next.js app at `https://www.maidlinx.com`.
Web remains the source of truth (booking, auth, Stripe TEST). Native project is for
Xcode → TestFlight → App Store later.

- Bundle ID: `com.maidlinx.app`
- Display name: MaidLinx
- Stripe LIVE: **OFF** (founder approval required)
- App Store submission: **founder approval required**

## Web app shell (production www)

Already shipped on tip / production after deploy:

- `/` → dark **AppOpenHome** (no marketing chrome)
- PWA `display: standalone`, dark `theme_color` / `background_color`
- `apple-mobile-web-app-*` + `viewport-fit=cover`
- Booking funnel uses sticky CTAs + safe-area insets

## Open in Xcode

`ios/` is generated on a Mac with CocoaPods (not committed until first successful `cap add`):

```bash
cd /Users/avnee/website
npm install
# once: brew install cocoapods
npx cap add ios    # first time only
npx cap sync ios
npx cap open ios
```

Requires: macOS, Xcode, Apple Developer team, CocoaPods.

## Human actions still required

1. Apple Developer Program enrollment + team assigned to `com.maidlinx.app`
2. App icons / splash assets sized for App Store Connect (use `public/brand/`)
3. Privacy policy URL (live legal page) + App Privacy questionnaire
4. Screenshots for iPhone sizes
5. Payment policy: marketplace uses Stripe **outside** IAP — confirm Apple guideline fit before submit
6. TestFlight internal build + founder review
7. Do **not** enable Stripe LIVE for App Store review until Product says yes

## What this does NOT do

- Does not rewrite MaidLinx to React Native
- Does not enable live payments
- Does not submit to the App Store
