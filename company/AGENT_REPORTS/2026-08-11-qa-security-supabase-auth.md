# QA + Security — Supabase/Auth verification

**Date:** 2026-08-11  
**Scope:** Auth / Supabase verification only (no feature work)  
**Env (set/empty only):**

| Variable | State |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | SET |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | SET |
| `SUPABASE_SERVICE_ROLE_KEY` | EMPTY |
| `ADMIN_BOOTSTRAP_EMAIL` | EMPTY |

**Project:** Maidlinx (`pgoyhujsfbmfshtnlbnx`, ACTIVE_HEALTHY)

## Results summary

See chat table for PASS/FAIL/MANUAL per checklist item.

## Hard blockers observed

1. `SUPABASE_SERVICE_ROLE_KEY` EMPTY → `POST /api/bookings` returns `503 SUPABASE_NOT_CONFIGURED`
2. Supabase Auth email rate limit (`over_email_send_rate_limit` / 429) blocked new customer signup
3. DB has 0 admin profiles, 0 cleaners → role gates cannot be exercised end-to-end
4. No usable test credentials available for the single existing auth user

## Next step (single action)

Paste `SUPABASE_SERVICE_ROLE_KEY` into `.env.local`, restart `npm run dev` on `:3001`, then create/promote test customer + cleaner + admin after Auth email rate limit clears (or add users via Supabase Dashboard → Authentication → Users).
