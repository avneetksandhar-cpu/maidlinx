-- Active cleaner GPS for en-route / arrived customer tracking.
-- Upserts current location only (no history trail). Safe additive migration.
--
-- APPLY: Do NOT run `supabase db push` / reset without confirming the target
-- Supabase project. Add this file in git; apply when your linked project is ready:
--   supabase db push   # or apply via SQL editor after verifying project ref

create table if not exists public.cleaner_live_locations (
  booking_id uuid primary key references public.bookings(id) on delete cascade,
  cleaner_id uuid not null references public.cleaners(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  accuracy double precision,
  updated_at timestamptz not null default now(),
  constraint cleaner_live_locations_lat_check check (lat >= -90 and lat <= 90),
  constraint cleaner_live_locations_lng_check check (lng >= -180 and lng <= 180)
);

create index if not exists cleaner_live_locations_cleaner_idx
  on public.cleaner_live_locations (cleaner_id);

create index if not exists cleaner_live_locations_updated_idx
  on public.cleaner_live_locations (updated_at desc);

comment on table public.cleaner_live_locations is
  'Current cleaner location for an active booking (on_the_way / arrived). Upsert-only; clear when job leaves live states.';

alter table public.cleaner_live_locations enable row level security;

-- App uses service-role admin client for read/write with explicit authz.
-- No broad authenticated policies — avoid leaking live GPS via PostgREST.
drop policy if exists cleaner_live_locations_admin_all on public.cleaner_live_locations;
create policy cleaner_live_locations_admin_all on public.cleaner_live_locations
  for all using (public.is_admin())
  with check (public.is_admin());
