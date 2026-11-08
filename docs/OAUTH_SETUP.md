# MaidLinx — Google + Apple Sign In (Supabase Auth)

Web OAuth is implemented in code against **Supabase Auth** (not Clerk / NextAuth).
**Google consent stays blocked until the founder enables the Google provider in
Supabase with a real Google Cloud OAuth client.** Never commit client secrets or
private keys.

Stripe LIVE stays **OFF**.

## Status (honest)

| Item | Status |
|------|--------|
| Code / UI | Ready — “Continue with Google” on `/sign-in`, `/sign-up`, booking Save-your-booking |
| IdP | Supabase Auth (`signInWithOAuth` + PKCE callback) |
| Live Google login | **BLOCKED** until Google Cloud + Supabase Google provider secrets exist |
| Live Apple login | **BLOCKED** + UI hidden until `NEXT_PUBLIC_OAUTH_APPLE_ENABLED=true` |

Verified probe (project `pgoyhujsfbmfshtnlbnx`): Supabase returns
`Unsupported provider: provider is not enabled` for `provider=google`.

---

## What shipped in code

| Piece | Path |
|-------|------|
| OAuth helpers + redirect allowlist | `src/lib/auth/oauth.ts` |
| UI enable gates | `src/lib/auth/oauth-enabled.ts` |
| Server OAuth start (PKCE) | `GET /api/auth/oauth/[provider]` |
| Callback (+ cleaner role heal) | `GET /auth/callback` |
| Dark mint Google / Apple rows | `src/components/auth/oauth-buttons.tsx` |
| Marketing sign-in / sign-up | `src/components/auth/auth-form.tsx` |
| Booking Save-your-booking | `src/components/auth/booking-save-sign-in.tsx` |
| UI entry points | `/sign-in`, `/sign-up`, `/sign-in?from=booking&next=/book/review` |

After Google succeeds, `/auth/callback` exchanges the code and redirects to the
safe `next` path (default `/account`; booking uses `/book/review`). Booking draft
stays in `sessionStorage` on the device.

---

## ENV_VARS_NEEDED (app / Vercel)

Put **no Google client secret** in Vercel or git. Only UI gates:

| Variable | Where | Value | Notes |
|----------|-------|-------|-------|
| `NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED` | `.env.local` / Vercel (optional) | `true` (default) or `false` | Omit or `true` to show Google; `false` hides it |
| `NEXT_PUBLIC_OAUTH_APPLE_ENABLED` | `.env.local` / Vercel | `true` only after Apple works | Default / omit = hidden |
| `NEXT_PUBLIC_SUPABASE_URL` | already required | project URL | Existing |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | already required | anon key | Existing |

**Not used / do not invent:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` in Next.js env.
Those belong only in **Supabase Dashboard → Authentication → Providers → Google**.

---

## HUMAN_ACTION_REQUIRED (founder)

### 1) Google Cloud OAuth client

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Configure **OAuth consent screen** (External; add test users while in Testing)
3. Create **OAuth client ID** → Application type: **Web application**
4. Authorized JavaScript origins:
   - `http://127.0.0.1:3001`
   - `http://localhost:3001`
   - `https://maidlinx.com`
   - `https://www.maidlinx.com`
5. Authorized redirect URIs — **only the Supabase callback** (not maidlinx.com):
   - `https://pgoyhujsfbmfshtnlbnx.supabase.co/auth/v1/callback`
6. Copy **Client ID** + **Client Secret**

### 2) Supabase → Authentication → Providers → Google

1. Open project **Maidlinx** (`pgoyhujsfbmfshtnlbnx`)
2. Authentication → Providers → **Google** → Enable
3. Paste Client ID + Client Secret → Save
4. Do **not** put the client secret in Vercel env or git

### 3) Supabase → Authentication → URL Configuration

**Site URL (production):** `https://www.maidlinx.com`  
(or `https://maidlinx.com` if that is the canonical host)

**Redirect URLs** — add all of:

```
http://127.0.0.1:3001/**
http://localhost:3001/**
https://maidlinx.com/**
https://www.maidlinx.com/**
https://*-maidlinx.vercel.app/**
https://website-*-maidlinx.vercel.app/**
```

### 4) Smoke after secrets are live

1. Local: `http://127.0.0.1:3001/sign-in` — “Continue with Google” visible
2. Click Google → Google account picker (not `provider is not enabled`)
3. Complete → land on `/account` (or booking `next`, e.g. `/book/review`)
4. Booking path: `/sign-in?from=booking&next=/book/review` → Google → Review & pay
5. Optional Vercel: set `NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED=true` explicitly (already default)

### Blocked until configured

- UI + `/api/auth/oauth/google` start path are shipped
- Tapping Google shows a clear in-app message (or returns `provider is not enabled`) until step 2 is done
- Treat **GOOGLE_STATUS** as **CODE_READY · SECRETS_PENDING**

---

## Apple Sign In (web — Services ID)

Required for App Store later; web works via Supabase Apple provider.

1. Apple Developer → Identifiers → **Services ID** (e.g. `com.maidlinx.app.web`)
2. Enable **Sign In with Apple** → Configure:
   - Domains: `maidlinx.com`, `www.maidlinx.com`, and your Supabase project auth host
   - Return URL: `https://pgoyhujsfbmfshtnlbnx.supabase.co/auth/v1/callback`
3. Create a **Sign in with Apple** key (.p8) under Keys
4. Note Team ID, Key ID, Services ID, and .p8 contents
5. Supabase → Authentication → Providers → **Apple** → Enable and paste those values
6. Set `NEXT_PUBLIC_OAUTH_APPLE_ENABLED=true` on Vercel / `.env.local`
7. Never commit the `.p8` key

---

## Capacitor / native App Store (Apple)

Web OAuth covers browser + Capacitor **remote URL** shell (`capacitor.config.ts` →
`https://www.maidlinx.com`). For App Store review, Apple often expects **native**
Sign in with Apple when other social logins exist.

See `native/APP_STORE.md` § Sign in with Apple (native). Summary:

1. Enable Sign in with Apple capability on `com.maidlinx.app` (App ID)
2. Prefer `@capacitor-community/apple-sign-in` (or Capacitor Social Login) to get an
   identity token, then `supabase.auth.signInWithIdToken({ provider: 'apple', token })`
3. Keep the same role/`next` handling as web (cleaner → application)
4. Google native (optional): Google Sign-In SDK → `signInWithIdToken` with provider `google`
5. Do not submit to App Store until founder approves; Stripe LIVE stays OFF
