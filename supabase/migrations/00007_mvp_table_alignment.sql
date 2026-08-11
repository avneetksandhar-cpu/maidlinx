-- MVP table alignment: users, customers, cleaners, booking_extras, cleaner_assignments
-- Evolves profiles/professionals into MVP names while preserving backward-compat views.

-- ---------------------------------------------------------------------------
-- 1. profiles → users (canonical MVP table)
-- ---------------------------------------------------------------------------

alter table public.profiles rename to users;

alter index if exists profiles_clerk_user_id_idx rename to users_clerk_user_id_idx;
alter index if exists profiles_role_idx rename to users_role_idx;
alter index if exists profiles_email_lower_idx rename to users_email_lower_idx;

alter trigger profiles_set_updated_at on public.users rename to users_set_updated_at;

-- Backward-compat view (existing app code queries `profiles`)
create or replace view public.profiles as
  select * from public.users;

create or replace function public.profiles_view_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (
    id, clerk_user_id, role, first_name, last_name, phone, avatar_url, email,
    stripe_customer_id, stripe_connect_id, onboarding_complete, created_at, updated_at
  ) values (
    coalesce(new.id, gen_random_uuid()),
    new.clerk_user_id,
    coalesce(new.role, 'customer'::public.user_role),
    new.first_name, new.last_name, new.phone, new.avatar_url, new.email,
    new.stripe_customer_id, new.stripe_connect_id,
    coalesce(new.onboarding_complete, false),
    coalesce(new.created_at, now()),
    coalesce(new.updated_at, now())
  );
  return new;
end;
$$;

create or replace function public.profiles_view_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users set
    clerk_user_id = new.clerk_user_id,
    role = new.role,
    first_name = new.first_name,
    last_name = new.last_name,
    phone = new.phone,
    avatar_url = new.avatar_url,
    email = new.email,
    stripe_customer_id = new.stripe_customer_id,
    stripe_connect_id = new.stripe_connect_id,
    onboarding_complete = new.onboarding_complete,
    updated_at = now()
  where id = old.id;
  return new;
end;
$$;

create or replace function public.profiles_view_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.users where id = old.id;
  return old;
end;
$$;

drop trigger if exists profiles_view_insert on public.profiles;
create trigger profiles_view_insert
  instead of insert on public.profiles
  for each row execute function public.profiles_view_insert();

drop trigger if exists profiles_view_update on public.profiles;
create trigger profiles_view_update
  instead of update on public.profiles
  for each row execute function public.profiles_view_update();

drop trigger if exists profiles_view_delete on public.profiles;
create trigger profiles_view_delete
  instead of delete on public.profiles
  for each row execute function public.profiles_view_delete();

-- ---------------------------------------------------------------------------
-- 2. customers (customer-specific data linked to users)
-- ---------------------------------------------------------------------------

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  stripe_customer_id text unique,
  default_address_id uuid references public.addresses(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customers_user_id_idx on public.customers (user_id);

create trigger customers_set_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

insert into public.customers (user_id, stripe_customer_id)
select id, stripe_customer_id
from public.users
where role in ('customer', 'admin')
   or stripe_customer_id is not null
on conflict (user_id) do update
  set stripe_customer_id = coalesce(excluded.stripe_customer_id, public.customers.stripe_customer_id);

-- ---------------------------------------------------------------------------
-- 3. professionals → cleaners (canonical MVP table)
-- ---------------------------------------------------------------------------

alter table public.professionals rename to cleaners;
alter table public.cleaners rename column profile_id to user_id;

alter index if exists professionals_active_idx rename to cleaners_active_idx;

alter trigger professionals_set_updated_at on public.cleaners rename to cleaners_set_updated_at;

create or replace view public.professionals as
select
  id,
  user_id as profile_id,
  bio,
  years_experience,
  service_radius_km,
  is_verified,
  is_active,
  rating_average,
  rating_count,
  created_at,
  updated_at
from public.cleaners;

create or replace function public.professionals_view_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.cleaners (
    id, user_id, bio, years_experience, service_radius_km,
    is_verified, is_active, rating_average, rating_count, created_at, updated_at
  ) values (
    coalesce(new.id, gen_random_uuid()),
    new.profile_id,
    new.bio, new.years_experience,
    coalesce(new.service_radius_km, 25),
    coalesce(new.is_verified, false),
    coalesce(new.is_active, false),
    coalesce(new.rating_average, 0),
    coalesce(new.rating_count, 0),
    coalesce(new.created_at, now()),
    coalesce(new.updated_at, now())
  );
  return new;
end;
$$;

create or replace function public.professionals_view_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.cleaners set
    bio = new.bio,
    years_experience = new.years_experience,
    service_radius_km = new.service_radius_km,
    is_verified = new.is_verified,
    is_active = new.is_active,
    rating_average = new.rating_average,
    rating_count = new.rating_count,
    updated_at = now()
  where id = old.id;
  return new;
end;
$$;

drop trigger if exists professionals_view_insert on public.professionals;
create trigger professionals_view_insert
  instead of insert on public.professionals
  for each row execute function public.professionals_view_insert();

drop trigger if exists professionals_view_update on public.professionals;
create trigger professionals_view_update
  instead of update on public.professionals
  for each row execute function public.professionals_view_update();

-- Auto-create cleaner row when user role is cleaner/professional
insert into public.cleaners (user_id, is_active)
select u.id, true
from public.users u
where u.role in ('cleaner', 'professional')
  and not exists (select 1 from public.cleaners c where c.user_id = u.id)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 4. addresses — add user_id (canonical); keep profile_id as alias
-- ---------------------------------------------------------------------------

alter table public.addresses
  add column if not exists user_id uuid references public.users(id) on delete cascade;

update public.addresses
set user_id = profile_id
where user_id is null and profile_id is not null;

create or replace function public.addresses_sync_user_id()
returns trigger
language plpgsql
as $$
begin
  if new.user_id is null and new.profile_id is not null then
    new.user_id := new.profile_id;
  elsif new.profile_id is null and new.user_id is not null then
    new.profile_id := new.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists addresses_sync_user_id on public.addresses;
create trigger addresses_sync_user_id
before insert or update on public.addresses
for each row execute function public.addresses_sync_user_id();

create index if not exists addresses_user_id_idx on public.addresses (user_id);

-- ---------------------------------------------------------------------------
-- 5. bookings — add cleaner_id FK; keep legacy columns for compat
-- ---------------------------------------------------------------------------

alter table public.bookings
  add column if not exists cleaner_id uuid references public.cleaners(id) on delete set null;

update public.bookings b
set cleaner_id = c.id
from public.cleaners c
where b.professional_profile_id = c.user_id
  and b.cleaner_id is null;

create index if not exists bookings_cleaner_id_idx on public.bookings (cleaner_id);

-- ---------------------------------------------------------------------------
-- 6. booking_extras (line items for add-ons)
-- ---------------------------------------------------------------------------

create table if not exists public.booking_extras (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  extra_key text not null,
  label text,
  unit_price_cents integer not null default 0 check (unit_price_cents >= 0),
  quantity integer not null default 1 check (quantity > 0),
  total_cents integer not null default 0 check (total_cents >= 0),
  created_at timestamptz not null default now(),
  unique (booking_id, extra_key)
);

create index if not exists booking_extras_booking_id_idx
  on public.booking_extras (booking_id);

-- Migrate legacy jsonb extras array on bookings
insert into public.booking_extras (booking_id, extra_key, quantity, unit_price_cents, total_cents)
select
  b.id,
  elem.value #>> '{}',
  1,
  0,
  0
from public.bookings b
cross join lateral jsonb_array_elements(b.extras) as elem(value)
where jsonb_typeof(b.extras) = 'array'
  and jsonb_array_length(b.extras) > 0
on conflict (booking_id, extra_key) do nothing;

-- ---------------------------------------------------------------------------
-- 7. cleaner_assignments (explicit assignment history)
-- ---------------------------------------------------------------------------

create type public.cleaner_assignment_source as enum ('self_accept', 'admin_manual');
create type public.cleaner_assignment_status as enum (
  'pending', 'active', 'completed', 'cancelled', 'declined'
);

create table if not exists public.cleaner_assignments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  cleaner_id uuid not null references public.cleaners(id) on delete restrict,
  assigned_by uuid references public.users(id) on delete set null,
  source public.cleaner_assignment_source not null,
  status public.cleaner_assignment_status not null default 'active',
  note text,
  created_at timestamptz not null default now(),
  ended_at timestamptz
);

create index if not exists cleaner_assignments_booking_idx
  on public.cleaner_assignments (booking_id, created_at desc);
create index if not exists cleaner_assignments_cleaner_idx
  on public.cleaner_assignments (cleaner_id);

-- Backfill from existing assigned bookings
insert into public.cleaner_assignments (booking_id, cleaner_id, source, status, created_at)
select
  b.id,
  c.id,
  case
    when b.status = 'assigned' then 'admin_manual'::public.cleaner_assignment_source
    else 'self_accept'::public.cleaner_assignment_source
  end,
  case
    when b.status in ('cancelled', 'refunded') then 'cancelled'::public.cleaner_assignment_status
    when b.status = 'completed' then 'completed'::public.cleaner_assignment_status
    else 'active'::public.cleaner_assignment_status
  end,
  coalesce(b.updated_at, b.created_at)
from public.bookings b
join public.cleaners c on c.user_id = b.professional_profile_id
where b.professional_profile_id is not null
  and not exists (
    select 1 from public.cleaner_assignments ca
    where ca.booking_id = b.id and ca.cleaner_id = c.id
  );

-- ---------------------------------------------------------------------------
-- 8. payments — add user_id alias; keep profile_id
-- ---------------------------------------------------------------------------

alter table public.payments
  add column if not exists user_id uuid references public.users(id) on delete set null;

update public.payments
set user_id = profile_id
where user_id is null and profile_id is not null;

create or replace function public.payments_sync_user_id()
returns trigger
language plpgsql
as $$
begin
  if new.user_id is null and new.profile_id is not null then
    new.user_id := new.profile_id;
  elsif new.profile_id is null and new.user_id is not null then
    new.profile_id := new.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists payments_sync_user_id on public.payments;
create trigger payments_sync_user_id
before insert or update on public.payments
for each row execute function public.payments_sync_user_id();

-- ---------------------------------------------------------------------------
-- 9. Auth bootstrap — create customer row on signup
-- ---------------------------------------------------------------------------

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

  insert into public.users (
    id, clerk_user_id, email, role, first_name, last_name, onboarding_complete
  ) values (
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

  insert into public.customers (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.notification_preferences (profile_id)
  values (new.id)
  on conflict (profile_id) do nothing;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 10. Helper: is_admin() uses users table
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- 11. Row Level Security for MVP tables
-- ---------------------------------------------------------------------------

alter table public.users enable row level security;
alter table public.customers enable row level security;
alter table public.cleaners enable row level security;
alter table public.booking_extras enable row level security;
alter table public.cleaner_assignments enable row level security;
alter table public.reviews enable row level security;

-- users (renamed from profiles; policies may already exist under old names)
drop policy if exists profiles_select_own on public.users;
drop policy if exists profiles_update_own on public.users;

create policy users_select_own on public.users
  for select using (auth.uid() = id or public.is_admin());

create policy users_update_own on public.users
  for update using (auth.uid() = id or public.is_admin());

create policy customers_select_own on public.customers
  for select using (user_id = auth.uid() or public.is_admin());

create policy customers_update_own on public.customers
  for update using (user_id = auth.uid() or public.is_admin());

create policy cleaners_select_public on public.cleaners
  for select using (is_active = true or public.is_admin());

create policy cleaners_update_own on public.cleaners
  for update using (user_id = auth.uid() or public.is_admin());

create policy booking_extras_select_participant on public.booking_extras
  for select using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_extras.booking_id
        and (b.customer_id = auth.uid() or b.professional_profile_id = auth.uid())
    )
    or public.is_admin()
  );

create policy cleaner_assignments_select_participant on public.cleaner_assignments
  for select using (
    exists (
      select 1 from public.bookings b
      join public.cleaners c on c.id = cleaner_assignments.cleaner_id
      where b.id = cleaner_assignments.booking_id
        and (b.customer_id = auth.uid() or c.user_id = auth.uid())
    )
    or public.is_admin()
  );

create policy reviews_select_public on public.reviews
  for select using (true);

create policy reviews_insert_participant on public.reviews
  for insert with check (
    reviewer_id = auth.uid()
    and exists (
      select 1 from public.bookings b
      where b.id = reviews.booking_id
        and b.status = 'completed'
        and (b.customer_id = auth.uid() or b.professional_profile_id = auth.uid())
    )
  );

-- Refresh addresses RLS to accept user_id
drop policy if exists addresses_select_own on public.addresses;
drop policy if exists addresses_insert_own on public.addresses;
drop policy if exists addresses_update_own on public.addresses;

create policy addresses_select_own on public.addresses
  for select using (
    user_id = auth.uid() or profile_id = auth.uid() or public.is_admin()
  );

create policy addresses_insert_own on public.addresses
  for insert with check (
    user_id = auth.uid() or profile_id = auth.uid() or public.is_admin()
  );

create policy addresses_update_own on public.addresses
  for update using (
    user_id = auth.uid() or profile_id = auth.uid() or public.is_admin()
  );
