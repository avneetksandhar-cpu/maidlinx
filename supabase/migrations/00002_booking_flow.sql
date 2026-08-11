-- Extend service types and booking fields for full booking flow

alter type public.service_type add value if not exists 'move_in';
alter type public.service_type add value if not exists 'move_out';
alter type public.service_type add value if not exists 'office';

alter table public.bookings
  alter column customer_id drop not null;

alter table public.bookings
  add column if not exists square_footage integer check (square_footage > 0),
  add column if not exists extras jsonb not null default '[]'::jsonb,
  add column if not exists arrival_window_start timestamptz,
  add column if not exists arrival_window_end timestamptz,
  add column if not exists customer_email text,
  add column if not exists customer_first_name text,
  add column if not exists customer_last_name text,
  add column if not exists customer_phone text,
  add column if not exists address_line1 text,
  add column if not exists address_line2 text,
  add column if not exists address_city text,
  add column if not exists address_state text,
  add column if not exists address_postal_code text,
  add column if not exists address_country char(2) default 'US',
  add column if not exists address_latitude double precision,
  add column if not exists address_longitude double precision,
  add column if not exists google_place_id text,
  add column if not exists pricing_snapshot jsonb;

alter table public.addresses
  alter column profile_id drop not null;

create index if not exists bookings_customer_email_idx on public.bookings (customer_email);
create index if not exists bookings_stripe_payment_intent_idx on public.bookings (stripe_payment_intent_id);
