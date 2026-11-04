-- Independent per-market launch / booking flags (TORONTO_GTA + SOUTH_FLORIDA).
-- Configured ≠ ready: flags default OFF until founder enables after real coverage.
-- Does not invent zones, prices, or cleaner markets.

alter table public.markets
  add column if not exists booking_enabled boolean not null default false,
  add column if not exists launch_enabled boolean not null default false;

comment on column public.markets.booking_enabled is
  'When true, customers may create quotes/bookings in this market (TEST or LIVE). Independent per market.';
comment on column public.markets.launch_enabled is
  'When true, market is open for customer acquisition / ads. Independent of booking_enabled.';

-- Fail closed for existing launch markets until founder explicitly enables.
update public.markets
set booking_enabled = false, launch_enabled = false
where id in ('TORONTO_GTA', 'SOUTH_FLORIDA');

-- Legacy seed service_areas (SF/LA) are outside launch regions — never treat as live coverage.
update public.service_areas
set is_active = false
where lower(coalesce(state, '')) in ('ca')
   or lower(coalesce(city, '')) in ('san francisco', 'los angeles');
