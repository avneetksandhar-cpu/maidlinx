# Seed test admin + cleaner (after Supabase is connected)

Migrations `00001`–`00014` must already be applied (`supabase db push`).

## Admin (preferred)

1. Set in `.env.local`:

```bash
ADMIN_BOOTSTRAP_EMAIL=you@example.com
```

2. Restart `npm run dev`, then sign up / sign in with that email at `/sign-up`.
3. On first login the app promotes that profile to `admin`.
4. Open `/admin`.

## Cleaner (SQL after Auth user exists)

1. Sign up a second user in the app (e.g. `cleaner@example.com`).
2. In Supabase → **SQL Editor**, run (replace the email):

```sql
-- Promote cleaner role
update public.profiles
set role = 'cleaner'
where email = 'cleaner@example.com';

-- Ensure cleaners row exists (adjust columns if your schema differs)
insert into public.cleaners (user_id, is_active, is_verified)
select id, true, true
from public.profiles
where email = 'cleaner@example.com'
on conflict (user_id) do update
set is_active = true,
    is_verified = true;
```

3. Attach the cleaner to a market/zone used by matching (if your migrations define capability tables), e.g. `TORONTO_GTA` / `zone_toronto_core` — see `00010_markets_services.sql` and `00014_match_engine_v1.sql`.
4. Sign in as that user → `/cleaner`.

## Optional: Auth users via Supabase Dashboard

Authentication → Users → Add user (email + password). Then run the SQL above for role / cleaner row. Admin still needs `ADMIN_BOOTSTRAP_EMAIL` match or a manual:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

## Verify

| Role | URL |
|------|-----|
| Admin | `/admin/bookings` |
| Cleaner | `/cleaner/jobs` |
| Customer | `/dashboard/bookings` |
