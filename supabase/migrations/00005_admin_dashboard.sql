-- Enterprise admin dashboard tables

create table if not exists public.pricing_config (
  id uuid primary key default gen_random_uuid(),
  service_type text not null unique,
  base_cents integer not null check (base_cents >= 0),
  bedroom_cents integer not null default 2500 check (bedroom_cents >= 0),
  bathroom_cents integer not null default 1500 check (bathroom_cents >= 0),
  platform_fee_percent numeric(5,2) not null default 15 check (platform_fee_percent >= 0),
  is_active boolean not null default true,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_type text not null check (discount_type in ('percent', 'fixed')),
  discount_value integer not null check (discount_value > 0),
  min_order_cents integer not null default 0,
  max_uses integer,
  used_count integer not null default 0 check (used_count >= 0),
  valid_from timestamptz,
  valid_until timestamptz,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_areas (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  state char(2) not null,
  postal_codes text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  raised_by uuid references public.profiles(id) on delete set null,
  subject text not null,
  description text,
  status text not null default 'open' check (status in ('open', 'investigating', 'resolved', 'closed')),
  resolution text,
  assigned_admin_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.refunds (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  reason text,
  status text not null default 'pending' check (status in ('pending', 'processed', 'failed')),
  stripe_refund_id text,
  processed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_profile_id uuid not null references public.profiles(id) on delete cascade,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_permissions (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  role_label text not null default 'operator',
  permissions text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.system_logs (
  id uuid primary key default gen_random_uuid(),
  level text not null check (level in ('info', 'warn', 'error', 'debug')),
  source text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_created_idx on public.admin_audit_log (created_at desc);
create index if not exists admin_audit_log_entity_idx on public.admin_audit_log (entity_type, entity_id);
create index if not exists system_logs_created_idx on public.system_logs (created_at desc);
create index if not exists disputes_status_idx on public.disputes (status);
create index if not exists refunds_status_idx on public.refunds (status);
create index if not exists coupons_code_idx on public.coupons (code);

create trigger pricing_config_set_updated_at
before update on public.pricing_config
for each row execute function public.set_updated_at();

create trigger coupons_set_updated_at
before update on public.coupons
for each row execute function public.set_updated_at();

create trigger service_areas_set_updated_at
before update on public.service_areas
for each row execute function public.set_updated_at();

create trigger disputes_set_updated_at
before update on public.disputes
for each row execute function public.set_updated_at();

create trigger refunds_set_updated_at
before update on public.refunds
for each row execute function public.set_updated_at();

insert into public.pricing_config (service_type, base_cents, bedroom_cents, bathroom_cents, platform_fee_percent)
values
  ('standard', 12000, 2500, 1500, 15),
  ('deep', 20000, 2500, 1500, 15),
  ('move_in', 25000, 2500, 1500, 15),
  ('move_out', 25000, 2500, 1500, 15),
  ('office', 18000, 2500, 1500, 15),
  ('airbnb_turnover', 15000, 2500, 1500, 15)
on conflict (service_type) do nothing;

insert into public.service_areas (name, city, state, postal_codes)
select 'San Francisco Bay', 'San Francisco', 'CA', ARRAY['94102','94103','94107','94110']
where not exists (select 1 from public.service_areas where name = 'San Francisco Bay');

insert into public.service_areas (name, city, state, postal_codes)
select 'Los Angeles Metro', 'Los Angeles', 'CA', ARRAY['90001','90012','90015','90210']
where not exists (select 1 from public.service_areas where name = 'Los Angeles Metro');
