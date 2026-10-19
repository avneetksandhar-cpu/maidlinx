# MaidLinx — App Store Connect prep (DO NOT SUBMIT)

**Date:** 2026-10-19  
**Bundle ID:** `com.maidlinx.app`  
**Primary backend:** https://www.maidlinx.com (SHA via `/api/health`)  
**Stripe LIVE:** OFF — App Review must use TEST / demo mode only until founder enables LIVE.  
**Submission:** Founder approval required. This file prepares materials only.

---

## App information (draft)

| Field | Draft |
|-------|--------|
| Name | MaidLinx |
| Subtitle | Book trusted home cleaning |
| Category | Lifestyle (secondary: Business) |
| Content rights | MaidLinx owns branding; venue/stock photos only if licensed |
| Support URL | https://www.maidlinx.com (or support mailto from siteConfig) |
| Marketing URL | https://www.maidlinx.com |
| Privacy Policy URL | https://www.maidlinx.com/legal/privacy |
| Copyright | © 2026 MaidLinx |

### Description (draft)

MaidLinx is a cleaning marketplace. Enter your address, choose a service, pick a time, and pay a deposit securely with Stripe. Track your cleaner when the job is underway. Businesses can manage multiple properties.

MaidLinx is not available in every city yet. Where booking is closed, you can join the waitlist. Payments for real-world cleaning services use Stripe (cards / Apple Pay via Stripe) — not In-App Purchase.

### Keywords (draft)

cleaning, house cleaning, maid, home service, book cleaner, apartment clean

### Promotional text (draft)

Book a clean in a few taps. Address-first booking, secure deposit, live job status when your cleaner is on the way.

---

## Age rating notes

- No unrestricted web browsing; loads MaidLinx product surfaces.
- No gambling, alcohol, tobacco, or mature content as core features.
- User-generated content limited to profiles, addresses, job photos, support messages — moderated via ops.
- Suggest: **4+** or **12+** if reviewers flag UGC photos; complete ASC questionnaire honestly.

---

## App Privacy (questionnaire hints)

Align with live `/legal/privacy` (counsel review still required):

| Category | Collect? | Linked to identity? | Tracking? |
|----------|----------|---------------------|-----------|
| Contact info (email, phone, name) | Yes | Yes | No |
| Location (precise / coarse) | Yes — address assist + live job tracking | Yes | No |
| User content (addresses, photos, messages) | Yes | Yes | No |
| Identifiers | Yes (auth / device as provided by OS/auth) | Yes | No |
| Payment info | Processed by Stripe; MaidLinx keeps references | Yes | No |
| Diagnostics (Sentry) | Yes when configured | No Session Replay | No |

---

## Screenshots (HUMAN_ACTION_REQUIRED)

Capture on iPhone 6.7" and 6.1" (and iPad if supporting):

1. App open / home (dark shell)
2. Address step (manual entry visible)
3. Service / property selection
4. Review + pricing
5. Payment (Stripe TEST — never LIVE screenshots with real charges)
6. Booking status / confirmation (use TEST booking or demo mode)
7. Cleaner or B2B dashboard (optional secondary set)

Store originals under `native/asc-screenshots/` (git-ignore large binaries if needed).

---

## Review notes (draft)

```
Thank you for reviewing MaidLinx.

Backend: https://www.maidlinx.com must be reachable.
Stripe is in TEST mode — do not expect live charges.
Booking may be closed in some markets (waitlist). For a full paid TEST path,
use the demo account below OR ask us to temporarily enable booking in TEST
for the review window.

Demo account: [FOUNDER TO FILL — create dedicated App Review user]
Demo password: [FOUNDER TO FILL]
Demo address: use a Toronto or South Florida address shown in review notes;
if booking is disabled you will see waitlist — that is intentional.

Payments: Stripe Elements / Apple Pay via Stripe for real-world services (not IAP).
Account deletion: Profile → Delete account (type DELETE).
Privacy: https://www.maidlinx.com/legal/privacy
```

---

## Demo account / demo mode plan

1. Create App Store Review customer in Supabase Auth (no admin role).
2. Prefer controlled TEST Stripe path; never flip LIVE for review.
3. If BOOKABLE=0 / booking_enabled=false: either (a) temporary TEST market enable for review window with founder approval + revert, or (b) document waitlist + provide video of TEST lifecycle.
4. Do not invent cleaners or fake reviews for screenshots.

---

## Backend availability checklist

- [ ] `GET https://www.maidlinx.com/api/health` → `status=ok`, expected release SHA
- [ ] `sentry=true` on health
- [ ] Privacy URL 200
- [ ] Auth (email + OAuth) works in WKWebView / native shell
- [ ] Stripe TEST keys only on Vercel Production
- [ ] Webhook endpoint receiving TEST events
- [ ] Account deletion path live after deploy of tip privacy work
- [ ] No `ALLOW_DEV_TEST_BOOKING` on Production

---

## Native / signing (HUMAN_ACTION_REQUIRED)

Full Xcode is required on this Mac (currently Command Line Tools only — no `/Applications/Xcode.app`).

1. Install Xcode from Mac App Store; open once; accept license.
2. `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`
3. Install CocoaPods if needed: `sudo gem install cocoapods` or `brew install cocoapods`
4. `cd /Users/avnee/website && npm install && npx cap sync ios && npx cap open ios`
5. Xcode → Signing & Capabilities → Team (Apple Developer) → bundle `com.maidlinx.app`
6. Enable Push capability stub only if shipping push later (do not claim push without APNs).
7. Product → Archive → Distribute App → App Store Connect / TestFlight
8. Do **not** submit for App Review until founder approval

---

## Payment guideline note

Marketplace charges for real-world cleaning (service outside the app) → Stripe / Apple Pay via Stripe is the intended path. Confirm with counsel against App Store Review Guideline 3.1.5 (physical goods / services) before submit. Do not use IAP for cleaning deposits.
