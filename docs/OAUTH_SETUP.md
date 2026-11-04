# MaidLinx — Google + Apple Sign In (Supabase Auth)

Web OAuth is implemented in code. **Providers stay OFF until founder configures secrets
in Google Cloud, Apple Developer, and the Supabase dashboard.** Never commit client
secrets or private keys.

Stripe LIVE stays **OFF**.

## What shipped in code

| Piece | Path |
|-------|------|
| OAuth helpers + redirect allowlist | `src/lib/auth/oauth.ts` |
| Server OAuth start (PKCE) | `GET /api/auth/oauth/[provider]` |
| Callback (+ cleaner role heal) | `GET /auth/callback` |
| Dark mint Google / Apple rows | `src/components/auth/oauth-buttons.tsx` |
| Wired on sign-in + sign-up | `src/components/auth/auth-form.tsx` |
| UI entry points | `/sign-in`, `/sign-up`, `/sign-up?role=cleaner` |

Customer and cleaner share the same screens (Uber-like). Cleaner intent
(`?role=cleaner` or `next` under `/cleaner` / `/pro`) is carried through OAuth and
lands in cleaner application / onboarding via `ensureCleanerApplicant`.

---

## HUMAN_ACTION_REQUIRED

### 1) Supabase → Authentication → URL Configuration

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

Also ensure the Supabase callback itself is valid for Google/Apple:
`https://<PROJECT_REF>.supabase.co/auth/v1/callback`

### 2) Google Cloud OAuth client

1. Google Cloud Console → APIs & Services → Credentials → Create **OAuth client ID**
2. Application type: **Web application**
3. Authorized JavaScript origins:
   - `http://127.0.0.1:3001`
   - `http://localhost:3001`
   - `https://maidlinx.com`
   - `https://www.maidlinx.com`
4. Authorized redirect URIs:
   - `https://<PROJECT_REF>.supabase.co/auth/v1/callback`
5. Copy **Client ID** + **Client Secret** into Supabase → Authentication → Providers → **Google** → Enable
6. Do **not** put Google client secret in Vercel env or git

### 3) Apple Sign In (web — Services ID)

Required for App Store later; web works via Supabase Apple provider.

1. Apple Developer → Identifiers → **Services ID** (e.g. `com.maidlinx.app.web`)
2. Enable **Sign In with Apple** → Configure:
   - Domains: `maidlinx.com`, `www.maidlinx.com`, and your Supabase project auth host
   - Return URL: `https://<PROJECT_REF>.supabase.co/auth/v1/callback`
3. Create a **Sign in with Apple** key (.p8) under Keys
4. Note Team ID, Key ID, Services ID, and .p8 contents
5. Supabase → Authentication → Providers → **Apple** → Enable and paste those values
6. Never commit the `.p8` key

### 4) Smoke after secrets are live

1. Local: open `http://127.0.0.1:3001/sign-in` — Google + Apple rows visible
2. Click Google → should hit Google consent (not `provider is not enabled`)
3. Complete → land on `/account` (customer) or `/cleaner/application` (cleaner signup)
4. Repeat Apple on a device/browser that supports it
5. Preview: hit a Vercel preview `/sign-in` and confirm redirect allowlist wildcards work

### Blocked until configured

Until Google/Apple are enabled in Supabase with real secrets:

- UI + `/api/auth/oauth/*` start path are shipped
- Provider consent screens will fail with a Supabase “provider not enabled” (or similar) error
- Treat **GOOGLE_STATUS** / **APPLE_STATUS** as **CODE_READY · SECRETS_PENDING**

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
