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

## Sign in with Apple (native)

Web Google + Apple OAuth already ships via Supabase (`docs/OAUTH_SETUP.md`). The Capacitor
shell loads `www.maidlinx.com`, so **web OAuth works inside the WKWebView** for many flows.

**App Store guideline 4.8:** if the app offers third-party login (Google), Apple usually
requires a native **Sign in with Apple** option as well. Plan before TestFlight external:

### HUMAN_ACTION_REQUIRED (native Apple)

1. Apple Developer → Identifiers → App ID `com.maidlinx.app` → enable **Sign In with Apple**
2. Xcode capability: Sign in with Apple on the iOS target
3. Add a native plugin (recommended):
   - `@capacitor-community/apple-sign-in` **or** Capacitor Social Login
4. Exchange the Apple identity token with Supabase (do **not** invent a parallel session):

```ts
// Pseudocode — wire after plugin is installed; keep role/next from auth screens
const { identityToken } = await AppleSignIn.authorize();
await supabase.auth.signInWithIdToken({
  provider: "apple",
  token: identityToken,
});
// Then POST /api/auth/cleaner-applicant when role=cleaner (same as web)
```

5. Services ID / key used for **web** Apple in Supabase may differ from the **App ID**
   native flow — follow current Supabase “Sign in with Apple” native docs
6. Google native (optional later): Google Sign-In SDK → `signInWithIdToken({ provider: "google" })`
7. Stripe LIVE stays **OFF** until founder approval

Until native Apple is wired, the web “Continue with Apple” button remains the App Store
fallback inside the remote-URL shell — confirm with App Review policy before submit.

## What this does NOT do

- Does not rewrite MaidLinx to React Native
- Does not enable live payments
- Does not submit to the App Store
- Does not enable Stripe LIVE
