-- MVP foundation: Supabase Auth alignment, services, payments, job status history

-- ---------------------------------------------------------------------------
-- Roles & booking statuses (MVP terminology)
-- ---------------------------------------------------------------------------

alter type public.user_role add value if not exists 'cleaner';

alter type public.booking_status add value if not exists 'on_the_way';

-- ---------------------------------------------------------------------------
-- Profiles aligned with Supabase Auth (profiles.id = auth.users.id)
-- ---------------------------------------------------------------------------

alter table public.profiles
  alter column clerk_user_id drop not null,
  add column if not exists email text;

create unique index if not exists profiles_email_lower_idx
  on public.profiles (lower(email))
  where email is not null;

-- Link profile id to auth user when possible (no-op if already present)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_auth_user_fkey'
  ) then
    alter table public.profiles
      add constraint profiles_auth_user_fkey
      foreign key (id) references auth.users (id) on delete cascade;
  end if;
exception
  when others then null;
end $$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  bootstrap_email text := current_setting('app.admin_bootstrap_email', true);
  assigned_role public.user_role := 'customer';
begin
  if bootstrap_email is not null
     and lower(new.email) = lower(bootstrap_email) then
    assigned_role := 'admin';
  end if;

  insert into public.profiles (
    id,
    clerk_user_id,
    email,
    role,
    first_name,
    last_name,
    onboarding_complete
  )
  values (
    new.id,
    new.id::text,
    new.email,
    assigned_role,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    false
  )
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();

  insert into public.notification_preferences (profile_id)
  values (new.id)
  on conflict (profile_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Legacy `professional` rows are mapped to `cleaner` in application code.

-- ---------------------------------------------------------------------------
-- Services catalog (admin-configurable; seeded from booking constants)
-- ---------------------------------------------------------------------------

create table if not exists public.services (
  id text primary key,
  label text not null,
  description text,
  base_cents integer not null check (base_cents >= 0),
  bedroom_cents integer not null default 2500 check (bedroom_cents >= 0),
  bathroom_cents integer not null default 1500 check (bathroom_cents >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger services_set_updated_at
before update on public.services
for each row execute function public.set_updated_at();

insert into public.services (id, label, description, base_cents, sort_order)
values
  ('standard', 'Standard', 'Regular maintenance clean for occupied homes.', 12000, 1),
  ('deep', 'Deep', 'Detailed top-to-bottom clean with extra attention.', 20000, 2),
  ('move_in', 'Move In', 'Fresh start before you unpack.', 25000, 3),
  ('move_out', 'Move Out', 'Leave the space spotless for turnover.', 25000, 4),
  ('office', 'Office', 'Professional cleaning for workspaces.', 18000, 5),
  ('airbnb_turnover', 'Airbnb', 'Fast turnovers between guest stays.', 15000, 6)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Payments (Stripe deposit + balance tracking)
-- ---------------------------------------------------------------------------

create type public.payment_status as enum (
  'pending',
  'processing',
  'succeeded',
  'failed',
  'refunded',
  'cancelled'
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  amount_cents integer not null check (amount_cents > 0),
  currency char(3) not null default 'USD',
  status public.payment_status not null default 'pending',
  payment_type text not null default 'deposit'
    check (payment_type in ('deposit', 'balance', 'full', 'refund')),
  stripe_payment_intent_id text unique,
  stripe_charge_id text,
  stripe_receipt_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_booking_id_idx on public.payments (booking_id);
create index if not exists payments_stripe_pi_idx on public.payments (stripe_payment_intent_id);

create trigger payments_set_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Job status history (cleaner + admin audit trail)
-- ---------------------------------------------------------------------------

create table if not exists public.job_status_history (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  from_status public.booking_status,
  to_status public.booking_status not null,
  changed_by uuid references public.profiles(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists job_status_history_booking_idx
  on public.job_status_history (booking_id, created_at desc);

create or replace function public.log_booking_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and old.status is distinct from new.status then
    insert into public.job_status_history (booking_id, from_status, to_status)
    values (new.id, old.status, new.status);
  end if;
  return new;
end;
$$;

drop trigger if exists bookings_log_status_change on public.bookings;
create trigger bookings_log_status_change
after update of status on public.bookings
for each row execute function public.log_booking_status_change();

-- ---------------------------------------------------------------------------
-- Row Level Security (baseline policies for MVP)
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id or public.is_admin());

create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id or public.is_admin());

create policy addresses_select_own on public.addresses
  for select using (profile_id = auth.uid() or public.is_admin());

create policy addresses_insert_own on public.addresses
  for insert with check (profile_id = auth.uid() or public.is_admin());

create policy addresses_update_own on public.addresses
  for update using (profile_id = auth.uid() or public.is_admin());

create policy bookings_select_participant on public.bookings
  for select using (
    customer_id = auth.uid()
    or professional_profile_id = auth.uid()
    or public.is_admin()
  );

create policy payments_select_participant on public.payments
  for select using (
    profile_id = auth.uid()
    or exists (
      select 1 from public.bookings b
      where b.id = payments.booking_id
        and (b.customer_id = auth.uid() or b.professional_profile_id = auth.uid())
    )
    or public.is_admin()
  );

create policy job_status_history_select_participant on public.job_status_history
  for select using (
    exists (
      select 1 from public.bookings b
      where b.id = job_status_history.booking_id
        and (b.customer_id = auth.uid() or b.professional_profile_id = auth.uid())
    )
    or public.is_admin()
  );

create policy services_select_public on public.services
  for select using (is_active = true or public.is_admin());

alter table public.services enable row level security;
alter table public.payments enable row level security;
alter table public.job_status_history enable row level security;
