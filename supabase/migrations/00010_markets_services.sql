-- Multi-market, multi-service marketplace foundation
-- Config-driven markets/zones/services; cleaner capability tables.
-- Market ids: TORONTO_GTA, SOUTH_FLORIDA (aligned with src/config/markets.ts).

-- ---------------------------------------------------------------------------
-- Enum extensions for new service types (booking.service_type remains enum)
-- ---------------------------------------------------------------------------

alter type public.service_type add value if not exists 'post_construction';
alter type public.service_type add value if not exists 'event_venue';
alter type public.service_type add value if not exists 'move_in';
alter type public.service_type add value if not exists 'move_out';
alter type public.service_type add value if not exists 'office';

-- ---------------------------------------------------------------------------
-- Markets & zones
-- ---------------------------------------------------------------------------

create table if not exists public.markets (
  id text primary key,
  code text not null unique,
  slug text not null unique,
  name text not null,
  country char(2) not null,
  currency char(3) not null,
  timezone text not null,
  active boolean not null default true,
  center_lat double precision not null,
  center_lng double precision not null,
  regions text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_zones (
  id text primary key,
  market_id text not null references public.markets(id) on delete cascade,
  name text not null,
  postal_codes text[] not null default '{}',
  cities text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists service_zones_market_id_idx on public.service_zones (market_id);

-- ---------------------------------------------------------------------------
-- Services catalog (mirrors src/config/services.ts; DB is source for admin)
-- ---------------------------------------------------------------------------

create table if not exists public.services (
  id text primary key,
  slug text not null unique,
  name text not null,
  description text,
  icon text,
  category text not null,
  active boolean not null default true,
  pricing_model text not null check (pricing_model in ('instant', 'quote')),
  supported_markets text[] not null default '{}',
  required_questions jsonb not null default '[]'::jsonb,
  estimated_duration_rules jsonb not null default '{}'::jsonb,
  cleaner_requirements jsonb not null default '{}'::jsonb,
  legacy_service_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.market_services (
  market_id text not null references public.markets(id) on delete cascade,
  service_id text not null references public.services(id) on delete cascade,
  active boolean not null default true,
  primary key (market_id, service_id)
);

-- ---------------------------------------------------------------------------
-- Cleaner capabilities
-- ---------------------------------------------------------------------------

create table if not exists public.cleaner_services (
  cleaner_id uuid not null references public.cleaners(id) on delete cascade,
  service_id text not null references public.services(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (cleaner_id, service_id)
);

create table if not exists public.cleaner_service_zones (
  cleaner_id uuid not null references public.cleaners(id) on delete cascade,
  zone_id text not null references public.service_zones(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (cleaner_id, zone_id)
);

alter table public.cleaners
  add column if not exists approved boolean not null default false,
  add column if not exists has_vehicle boolean not null default false,
  add column if not exists qualifications text[] not null default '{}',
  add column if not exists preferences jsonb not null default '{}'::jsonb,
  add column if not exists travel_radius_km numeric(6,2),
  add column if not exists completed_jobs integer not null default 0,
  add column if not exists cancellation_rate numeric(5,4) not null default 0,
  add column if not exists on_time_rate numeric(5,4) not null default 0;

-- Backfill approved from is_verified for existing rows
update public.cleaners set approved = is_verified where approved = false and is_verified = true;

-- ---------------------------------------------------------------------------
-- Booking marketplace columns
-- ---------------------------------------------------------------------------

alter table public.bookings
  add column if not exists market_id text references public.markets(id) on delete set null,
  add column if not exists service_zone_id text references public.service_zones(id) on delete set null,
  add column if not exists zone_id text references public.service_zones(id) on delete set null,
  add column if not exists service_id text references public.services(id) on delete set null,
  add column if not exists pricing_model text check (pricing_model in ('instant', 'quote')),
  add column if not exists booking_answers jsonb not null default '{}'::jsonb,
  add column if not exists service_answers jsonb not null default '{}'::jsonb,
  add column if not exists estimated_duration_minutes integer,
  add column if not exists tax_cents integer not null default 0,
  add column if not exists discount_cents integer not null default 0,
  add column if not exists fees_cents integer not null default 0,
  add column if not exists payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'pending', 'deposit_paid', 'paid', 'refunded', 'failed')),
  add column if not exists quote_requested boolean not null default false;

-- Keep zone_id and service_zone_id in sync for callers that use either name
create or replace function public.sync_booking_zone_columns()
returns trigger
language plpgsql
as $$
begin
  if new.service_zone_id is not null and (new.zone_id is null or new.zone_id is distinct from new.service_zone_id) then
    new.zone_id := new.service_zone_id;
  elsif new.zone_id is not null and (new.service_zone_id is null or new.service_zone_id is distinct from new.zone_id) then
    new.service_zone_id := new.zone_id;
  end if;
  if new.fees_cents = 0 and new.platform_fee_cents is not null then
    new.fees_cents := new.platform_fee_cents;
  end if;
  return new;
end;
$$;

drop trigger if exists bookings_sync_zone_columns on public.bookings;
create trigger bookings_sync_zone_columns
before insert or update on public.bookings
for each row execute function public.sync_booking_zone_columns();

create index if not exists bookings_market_id_idx on public.bookings (market_id);
create index if not exists bookings_service_id_idx on public.bookings (service_id);
create index if not exists bookings_service_zone_id_idx on public.bookings (service_zone_id);

-- ---------------------------------------------------------------------------
-- Seed markets / zones (TORONTO_GTA, SOUTH_FLORIDA)
-- ---------------------------------------------------------------------------

insert into public.markets (id, code, slug, name, country, currency, timezone, active, center_lat, center_lng, regions)
values
  ('TORONTO_GTA', 'TORONTO_GTA', 'toronto-gta', 'Toronto / GTA', 'CA', 'CAD', 'America/Toronto', true, 43.6532, -79.3832, array['ON']),
  ('SOUTH_FLORIDA', 'SOUTH_FLORIDA', 'south-florida', 'South Florida', 'US', 'USD', 'America/New_York', true, 26.1224, -80.1373, array['FL'])
on conflict (id) do update set
  code = excluded.code,
  name = excluded.name,
  currency = excluded.currency,
  timezone = excluded.timezone,
  active = excluded.active,
  center_lat = excluded.center_lat,
  center_lng = excluded.center_lng,
  regions = excluded.regions,
  updated_at = now();

insert into public.service_zones (id, market_id, name, postal_codes, cities, active)
values
  ('zone_toronto_core', 'TORONTO_GTA', 'Toronto Core',
    array['M4','M5','M6','M3','M2','M1','M8','M9'],
    array['toronto','north york','scarborough','etobicoke','york','east york'], true),
  ('zone_gta_west', 'TORONTO_GTA', 'GTA West',
    array['L4','L5','L6','L7'],
    array['mississauga','brampton','oakville','burlington','milton'], true),
  ('zone_gta_east', 'TORONTO_GTA', 'GTA East',
    array['L1','L3'],
    array['markham','richmond hill','vaughan','ajax','pickering','whitby','oshawa'], true),
  ('zone_miami_dade', 'SOUTH_FLORIDA', 'Miami-Dade',
    array['331','330','332'],
    array['miami','miami beach','coral gables','hialeah','homestead','doral','kendall'], true),
  ('zone_broward', 'SOUTH_FLORIDA', 'Broward',
    array['333','334'],
    array['fort lauderdale','lauderdale','lauderdale beach','pompano beach','lauderdale park','sunrise','plantation','davie'], true),
  ('zone_palm_beach', 'SOUTH_FLORIDA', 'Palm Beach',
    array['334'],
    array['west palm beach','boca raton','delray beach','boynton beach','jupiter','palm beach gardens'], true)
on conflict (id) do update set
  market_id = excluded.market_id,
  name = excluded.name,
  postal_codes = excluded.postal_codes,
  cities = excluded.cities,
  active = excluded.active,
  updated_at = now();

insert into public.services (id, slug, name, description, icon, category, active, pricing_model, supported_markets, required_questions, estimated_duration_rules, cleaner_requirements, legacy_service_type)
values
  ('svc_residential', 'residential', 'Residential', 'Regular maintenance clean for occupied homes.', 'home', 'residential', true, 'instant', '{}', '[]'::jsonb,
    '{"baseMinutes":120,"minutesPerBedroom":20,"minutesPerBathroom":15,"minutesPerExtra":20,"minutesPerSizeTier":15}'::jsonb,
    '{"minYearsExperience":0,"requiresApproved":true,"qualifications":[]}'::jsonb, 'standard'),
  ('svc_deep', 'deep', 'Deep clean', 'Detailed top-to-bottom clean with extra attention.', 'sparkles', 'deep', true, 'instant', '{}', '[]'::jsonb,
    '{"baseMinutes":180,"minutesPerBedroom":20,"minutesPerBathroom":15,"minutesPerExtra":20,"minutesPerSizeTier":15}'::jsonb,
    '{"minYearsExperience":1,"requiresApproved":true,"qualifications":[]}'::jsonb, 'deep'),
  ('svc_move_in', 'move-in', 'Move-in', 'Fresh start before you unpack.', 'truck', 'move', true, 'instant', '{}', '[]'::jsonb,
    '{"baseMinutes":210,"minutesPerBedroom":20,"minutesPerBathroom":15,"minutesPerExtra":20,"minutesPerSizeTier":15}'::jsonb,
    '{"minYearsExperience":1,"requiresApproved":true,"qualifications":[]}'::jsonb, 'move_in'),
  ('svc_move_out', 'move-out', 'Move-out', 'Leave the space spotless for turnover.', 'truck', 'move', true, 'instant', '{}', '[]'::jsonb,
    '{"baseMinutes":210,"minutesPerBedroom":20,"minutesPerBathroom":15,"minutesPerExtra":20,"minutesPerSizeTier":15}'::jsonb,
    '{"minYearsExperience":1,"requiresApproved":true,"qualifications":[]}'::jsonb, 'move_out'),
  ('svc_airbnb', 'airbnb', 'Airbnb / STR', 'Fast turnovers between guest stays.', 'key', 'airbnb', true, 'instant', '{}', '[]'::jsonb,
    '{"baseMinutes":90,"minutesPerBedroom":15,"minutesPerBathroom":10,"minutesPerExtra":15,"minutesPerSizeTier":10}'::jsonb,
    '{"minYearsExperience":0,"requiresApproved":true,"qualifications":["str_turnover"]}'::jsonb, 'airbnb_turnover'),
  ('svc_office', 'office', 'Office & commercial', 'Professional cleaning for offices and workspaces.', 'building', 'office', true, 'quote', '{}', '[]'::jsonb,
    '{"baseMinutes":150,"minutesPerExtra":20,"minutesPerSizeTier":20}'::jsonb,
    '{"minYearsExperience":1,"requiresApproved":true,"qualifications":["commercial"]}'::jsonb, 'office'),
  ('svc_post_construction', 'post-construction', 'Post-construction', 'Dust, debris, and finish cleaning after renovations.', 'hard-hat', 'post_construction', true, 'quote', '{}', '[]'::jsonb,
    '{"baseMinutes":240,"minutesPerExtra":30,"minutesPerSizeTier":25}'::jsonb,
    '{"minYearsExperience":2,"requiresApproved":true,"qualifications":["post_construction"]}'::jsonb, 'post_construction'),
  ('svc_event', 'event-venue', 'Event / venue', 'Pre- or post-event venue cleaning.', 'calendar', 'event', true, 'quote', '{}', '[]'::jsonb,
    '{"baseMinutes":180,"minutesPerExtra":20,"minutesPerSizeTier":20}'::jsonb,
    '{"minYearsExperience":1,"requiresApproved":true,"qualifications":["event_venue"]}'::jsonb, 'event_venue'),
  ('svc_recurring', 'recurring', 'Recurring', 'Weekly or bi-weekly home cleaning on a schedule.', 'repeat', 'recurring', true, 'instant', '{}', '[]'::jsonb,
    '{"baseMinutes":120,"minutesPerBedroom":20,"minutesPerBathroom":15,"minutesPerExtra":20,"minutesPerSizeTier":15}'::jsonb,
    '{"minYearsExperience":0,"requiresApproved":true,"qualifications":[]}'::jsonb, 'standard')
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  pricing_model = excluded.pricing_model,
  estimated_duration_rules = excluded.estimated_duration_rules,
  cleaner_requirements = excluded.cleaner_requirements,
  legacy_service_type = excluded.legacy_service_type,
  active = excluded.active,
  updated_at = now();

insert into public.market_services (market_id, service_id, active)
select m.id, s.id, true
from public.markets m
cross join public.services s
on conflict (market_id, service_id) do nothing;

-- ---------------------------------------------------------------------------
-- RLS (read-mostly public catalog; writes via service role / admin)
-- ---------------------------------------------------------------------------

alter table public.markets enable row level security;
alter table public.service_zones enable row level security;
alter table public.services enable row level security;
alter table public.market_services enable row level security;
alter table public.cleaner_services enable row level security;
alter table public.cleaner_service_zones enable row level security;

drop policy if exists markets_public_read on public.markets;
create policy markets_public_read on public.markets for select using (active = true);

drop policy if exists service_zones_public_read on public.service_zones;
create policy service_zones_public_read on public.service_zones for select using (active = true);

drop policy if exists services_public_read on public.services;
create policy services_public_read on public.services for select using (active = true);

drop policy if exists market_services_public_read on public.market_services;
create policy market_services_public_read on public.market_services for select using (active = true);
