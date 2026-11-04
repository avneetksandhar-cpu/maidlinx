# MaidLinx — App Store / Capacitor iOS shell

**Status (2026-10-19):** iOS project scaffolded and branded. Signed archive **blocked** on this Mac — see [HUMAN_ACTION_REQUIRED](#human_action_required). Do **not** submit without founder approval. Stripe LIVE stays **OFF**.

| Item | Value |
|------|--------|
| Bundle ID | `com.maidlinx.app` |
| Display name | MaidLinx |
| URL scheme | `maidlinx://` |
| Strategy | Capacitor remote-URL shell → `https://www.maidlinx.com` |
| Marketing version | `1.0` (build `1`) |
| Xcode project | `ios/App/App.xcworkspace` |
| Device install this session | **No** |
| ASC listing drafts | [`native/ASC_PREP.md`](./ASC_PREP.md) (prep only) |

---

## IOS_BUILD_STATUS

| Step | Result |
|------|--------|
| `capacitor.config.ts` | Done — appId, splash, status bar, Stripe TEST allowNavigation |
| `npx cap add ios` | Done — `ios/` created |
| Brand App Icon (1024) | Done — from `public/brand/icon-512.png` (mark only) |
| Brand Splash | Done — `#003474` + `maidlinx-mark.png` |
| Deep link `maidlinx://` | Done — Info.plist + Cap `AppDelegate` proxy |
| Offline empty state | Done — `native/www/index.html` |
| Location purpose strings | Done — Info.plist (matches real web geolocation / live job tracking) |
| CocoaPods CLI | Installed (`pod 1.17.0`) |
| `npx cap sync ios` / `pod install` | **Failed** — needs full Xcode.app (CLT alone insufficient) |
| `xcodebuild archive` | **Failed** — no `/Applications/Xcode.app`, no `iphoneos` SDK, **0** codesigning identities |
| TestFlight / App Store submit | **Not attempted** |

---

## Native-value deltas (beyond WKWebView)

| Delta | Status |
|-------|--------|
| Splash (`@capacitor/splash-screen` + branded Splash.imageset + LaunchScreen) | Implemented |
| Status bar (`@capacitor/status-bar` + light content on `#003474`) | Implemented |
| Safe areas (`contentInset: automatic` + offline CSS + www `viewport-fit=cover`) | Implemented |
| App icons from real MaidLinx logo | Implemented |
| Deep link scheme `maidlinx://` | Implemented |
| Offline empty state (`native/www`) | Implemented |
| Location purpose strings (real web geolocation / cleaner live share) | Implemented |
| Portrait lock (iPhone) | Implemented |
| Push delivery | **Stub docs only** — no APNs, no fake delivery |
| Share sheet | Not wired — do not fake |
| Native Sign in with Apple SDK | HUMAN_ACTION_REQUIRED (web OAuth interim) |

---

## Open / sync / archive (after Xcode)

```bash
cd /Users/avnee/website
npm install
bash native/scripts/generate-ios-assets.sh   # optional: refresh icons/splash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
npx cap sync ios
npx cap open ios
# Xcode: Signing Team → Product → Archive → Distribute (TestFlight)
```

CLI archive:

```bash
cd ios/App
xcodebuild -workspace App.xcworkspace \
  -scheme App \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath "$HOME/Desktop/MaidLinx.xcarchive" \
  archive
```

---

## HUMAN_ACTION_REQUIRED

Exact founder steps (this machine cannot complete signing):

### A. Toolchain (blocking now)

1. Install **Xcode** from the Mac App Store (full app — not Command Line Tools only).
2. Open Xcode once → accept license → install components.
3. `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`
4. Confirm: `xcodebuild -version` prints an Xcode version (not a CLT error).
5. `cd /Users/avnee/website && npx cap sync ios` (must finish `pod install` cleanly).

### B. Signing / device

6. Apple Developer Program → App ID **`com.maidlinx.app`**.
7. Xcode → `ios/App/App.xcworkspace` → Signing & Capabilities → select Team; Automatic signing ON.
8. Confirm certs: `security find-identity -v -p codesigning` (must list identities).
9. Run on Simulator or a physical iPhone (Development signing), or Archive → TestFlight.
10. Device install was **not** possible in this session (no Xcode / no identities).

### C. App Store Connect (do not submit yet)

11. Create ASC app record for `com.maidlinx.app`.
12. Fill listing from `native/ASC_PREP.md`; privacy questionnaire + privacy URL.
13. Screenshots for required iPhone sizes.
14. Payments: Stripe marketplace **outside** IAP — confirm guideline notes before review.
15. **Stripe LIVE OFF** until founder approval.
16. **Do not submit** for App Review until founder explicitly approves.

### D. Sign in with Apple (native) if Google login is offered

17. Enable Sign In with Apple on the App ID + Xcode capability.
18. Wire `@capacitor-community/apple-sign-in` → Supabase `signInWithIdToken` (see `docs/OAUTH_SETUP.md`).
19. Until then, web Continue with Apple inside the shell is interim — confirm App Review risk.

### E. Push stub (later — do not claim in marketing)

20. Enable Push on App ID + Xcode capability only when Product prioritizes APNs.
21. Add real plugin + server sender; never advertise push until that ships.

### F. Universal Links (optional)

22. Associated Domains `applinks:www.maidlinx.com` + hosted `apple-app-site-association`.
23. Keep `maidlinx://` as fallback.

---

## What this does NOT do

- Does not rewrite MaidLinx to React Native
- Does not enable Stripe LIVE or wallets LIVE
- Does not submit to the App Store
- Does not deliver push notifications
- Does not invent Share / features the web app does not use
