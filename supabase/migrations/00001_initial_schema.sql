-- MaidLinx marketplace schema
-- PostgreSQL / Supabase

create extension if not exists "pgcrypto";

create type public.user_role as enum ('customer', 'professional', 'admin');

create type public.booking_status as enum (
  'draft',
  'pending',
  'confirmed',
  'assigned',
  'in_progress',
  'completed',
  'cancelled',
  'refunded'
);

create type public.service_type as enum (
  'standard',
  'deep',
  'move_in_out',
  'commercial',
  'airbnb_turnover'
);

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique,
  role public.user_role not null default 'customer',
  first_name text,
  last_name text,
  phone text,
  avatar_url text,
  stripe_customer_id text unique,
  stripe_connect_id text unique,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  label text,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  country char(2) not null default 'US',
  latitude double precision,
  longitude double precision,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.professionals (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  bio text,
  years_experience integer check (years_experience >= 0),
  service_radius_km numeric(6,2) not null default 25,
  is_verified boolean not null default false,
  is_active boolean not null default false,
  rating_average numeric(3,2) not null default 0 check (rating_average >= 0 and rating_average <= 5),
  rating_count integer not null default 0 check (rating_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete restrict,
  professional_id uuid references public.profiles(id) on delete set null,
  address_id uuid not null references public.addresses(id) on delete restrict,
  service_type public.service_type not null,
  status public.booking_status not null default 'draft',
  scheduled_at timestamptz not null,
  notes text,
  bedrooms integer not null default 0 check (bedrooms >= 0),
  bathrooms integer not null default 1 check (bathrooms >= 1),
  subtotal_cents integer not null default 0 check (subtotal_cents >= 0),
  platform_fee_cents integer not null default 0 check (platform_fee_cents >= 0),
  total_cents integer not null default 0 check (total_cents >= 0),
  currency char(3) not null default 'USD',
  stripe_payment_intent_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewee_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz not null default now()
);

create index profiles_clerk_user_id_idx on public.profiles (clerk_user_id);
create index profiles_role_idx on public.profiles (role);
create index addresses_profile_id_idx on public.addresses (profile_id);
create index professionals_active_idx on public.professionals (is_active, is_verified);
create index bookings_customer_id_idx on public.bookings (customer_id);
create index bookings_professional_id_idx on public.bookings (professional_id);
create index bookings_status_scheduled_idx on public.bookings (status, scheduled_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger addresses_set_updated_at
before update on public.addresses
for each row execute function public.set_updated_at();

create trigger professionals_set_updated_at
before update on public.professionals
for each row execute function public.set_updated_at();

create trigger bookings_set_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.professionals enable row level security;
alter table public.bookings enable row level security;
alter table public.reviews enable row level security;
