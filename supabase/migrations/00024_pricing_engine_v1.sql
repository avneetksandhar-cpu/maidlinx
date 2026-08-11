-- Pricing Engine V1 (additive).
-- Dynamic demand/supply pricing is DISABLED by default until admin enables.
-- Never store secrets. RLS: service-role / admin only for writes.

-- ---------------------------------------------------------------------------
-- 1. pricing_rules — editable engine parameters (global + by market)
-- ---------------------------------------------------------------------------

create table if not exists public.pricing_rules (
  id uuid primary key default gen_random_uuid(),
  scope text not null default 'global'
    check (scope in ('global', 'market')),
  market_id text,
  -- Feature flags (dynamic OFF by default — protect launch)
  dynamic_pricing_enabled boolean not null default false,
  -- Bounded multipliers (applied only when dynamic_pricing_enabled)
  demand_mult_min numeric(6,4) not null default 0.9000
    check (demand_mult_min > 0 and demand_mult_min <= 2),
  demand_mult_max numeric(6,4) not null default 1.1500
    check (demand_mult_max >= 1 and demand_mult_max <= 2),
  supply_mult_min numeric(6,4) not null default 0.9500
    check (supply_mult_min > 0 and supply_mult_min <= 2),
  supply_mult_max numeric(6,4) not null default 1.1000
    check (supply_mult_max >= 1 and supply_mult_max <= 2),
  -- Absolute quote caps (cents); null = no absolute cap beyond multipliers
  min_total_cents integer check (min_total_cents is null or min_total_cents >= 0),
  max_total_cents integer check (max_total_cents is null or max_total_cents >= 0),
  -- Profit guardrail
  min_contribution_margin_cents integer not null default 1500
    check (min_contribution_margin_cents >= 0),
  min_contribution_margin_pct numeric(5,2) not null default 12.00
    check (min_contribution_margin_pct >= 0 and min_contribution_margin_pct <= 100),
  -- Labor / compensation model (cost side — not exposed to clients)
  cleaner_hourly_cents integer not null default 2800
    check (cleaner_hourly_cents >= 0),
  cleaners_default integer not null default 1
    check (cleaners_default >= 1 and cleaners_default <= 8),
  travel_base_cents integer not null default 500
    check (travel_base_cents >= 0),
  complexity_cents_per_point integer not null default 250
    check (complexity_cents_per_point >= 0),
  -- Recurring vs one-time customer price adjustments (static, always available)
  recurring_weekly_mult numeric(6,4) not null default 0.9000,
  recurring_biweekly_mult numeric(6,4) not null default 0.9300,
  recurring_monthly_mult numeric(6,4) not null default 0.9700,
  -- Lead time / day-part (only when dynamic enabled)
  lead_time_same_day_mult numeric(6,4) not null default 1.0800,
  lead_time_next_day_mult numeric(6,4) not null default 1.0400,
  weekend_mult numeric(6,4) not null default 1.0500,
  evening_mult numeric(6,4) not null default 1.0300,
  -- Smart discount stack cap (% of subtotal)
  max_discount_stack_pct numeric(5,2) not null default 25.00
    check (max_discount_stack_pct >= 0 and max_discount_stack_pct <= 100),
  -- Extra JSON knobs (service multipliers, etc.) — server only
  params jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pricing_rules_market_scope check (
    (scope = 'global' and market_id is null)
    or (scope = 'market' and market_id is not null)
  )
);

create unique index if not exists pricing_rules_global_unique
  on public.pricing_rules (scope)
  where scope = 'global' and is_active;

create unique index if not exists pricing_rules_market_unique
  on public.pricing_rules (market_id)
  where scope = 'market' and is_active and market_id is not null;

create trigger pricing_rules_set_updated_at
before update on public.pricing_rules
for each row execute function public.set_updated_at();

insert into public.pricing_rules (scope, market_id, dynamic_pricing_enabled)
select 'global', null, false
where not exists (
  select 1 from public.pricing_rules where scope = 'global' and is_active
);

-- ---------------------------------------------------------------------------
-- 2. pricing_quotes — full calculation audit per quote (server-only fields)
-- ---------------------------------------------------------------------------

create table if not exists public.pricing_quotes (
  id uuid primary key default gen_random_uuid(),
  booking_quote_id uuid references public.booking_quotes(id) on delete set null,
  quote_token text not null,
  market_id text,
  currency text not null check (currency in ('USD', 'CAD')),
  service_type text not null,
  input_snapshot jsonb not null default '{}'::jsonb,
  -- Public-safe breakdown (same shape as PriceBreakdown)
  public_breakdown jsonb not null default '{}'::jsonb,
  -- Full audit — never return to browser
  calculation_audit jsonb not null default '{}'::jsonb,
  cost_estimate_cents integer not null default 0 check (cost_estimate_cents >= 0),
  contribution_margin_cents integer not null default 0,
  guardrail_applied boolean not null default false,
  dynamic_pricing_applied boolean not null default false,
  demand_multiplier numeric(8,4) not null default 1,
  supply_multiplier numeric(8,4) not null default 1,
  experiment_id uuid,
  experiment_variant text,
  discount_stack jsonb not null default '[]'::jsonb,
  subtotal_cents integer not null check (subtotal_cents >= 0),
  platform_fee_cents integer not null check (platform_fee_cents >= 0),
  discount_cents integer not null default 0 check (discount_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  expires_at timestamptz not null,
  consumed_by_booking_id uuid references public.bookings(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists pricing_quotes_created_idx
  on public.pricing_quotes (created_at desc);
create index if not exists pricing_quotes_market_idx
  on public.pricing_quotes (market_id, created_at desc);
create index if not exists pricing_quotes_token_idx
  on public.pricing_quotes (quote_token);

-- ---------------------------------------------------------------------------
-- 3. pricing_experiments — A/B framework (NO auto-deploy of winners)
-- ---------------------------------------------------------------------------

create table if not exists public.pricing_experiments (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  status text not null default 'draft'
    check (status in ('draft', 'running', 'paused', 'completed', 'archived')),
  -- variants: [{ "id": "control", "weight": 50, "params": {...} }, ...]
  variants jsonb not null default '[]'::jsonb,
  market_id text,
  -- Metrics are computed from assignments + funnel/bookings — never invented
  started_at timestamptz,
  ended_at timestamptz,
  -- Explicit: winners are NEVER auto-applied to live pricing_rules
  auto_deploy_winner boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pricing_experiment_assignments (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid not null references public.pricing_experiments(id) on delete cascade,
  anonymous_session_id text not null,
  variant_id text not null,
  pricing_quote_id uuid references public.pricing_quotes(id) on delete set null,
  booking_id uuid references public.bookings(id) on delete set null,
  converted boolean not null default false,
  revenue_cents integer,
  created_at timestamptz not null default now(),
  unique (experiment_id, anonymous_session_id)
);

create index if not exists pricing_experiment_assignments_exp_idx
  on public.pricing_experiment_assignments (experiment_id, created_at desc);

create trigger pricing_experiments_set_updated_at
before update on public.pricing_experiments
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. funnel_events — conversion analytics (privacy-safe)
-- ---------------------------------------------------------------------------

create table if not exists public.funnel_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  anonymous_session_id text,
  profile_id uuid references public.users(id) on delete set null,
  booking_id uuid references public.bookings(id) on delete set null,
  market_id text,
  -- UTM (acquisition only — not used for price discrimination)
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  -- Device/browser category for UX/tech analytics ONLY — never for pricing
  device_category text
    check (device_category is null or device_category in ('mobile', 'tablet', 'desktop', 'unknown')),
  browser_category text
    check (browser_category is null or browser_category in (
      'chrome', 'safari', 'firefox', 'edge', 'other', 'unknown'
    )),
  -- Non-PII props only (server strips emails/phones/addresses)
  props jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists funnel_events_created_idx
  on public.funnel_events (created_at desc);
create index if not exists funnel_events_name_idx
  on public.funnel_events (event_name, created_at desc);
create index if not exists funnel_events_session_idx
  on public.funnel_events (anonymous_session_id, created_at desc)
  where anonymous_session_id is not null;

-- ---------------------------------------------------------------------------
-- 5. market_demand + cleaner_supply — signals for bounded multipliers
-- ---------------------------------------------------------------------------

create table if not exists public.market_demand (
  id uuid primary key default gen_random_uuid(),
  market_id text not null,
  bucket_start timestamptz not null,
  bucket_end timestamptz not null,
  -- Observed / estimated demand intensity (0–1+); never auto-writes customer prices alone
  demand_index numeric(8,4) not null default 1.0000 check (demand_index >= 0),
  booking_requests integer not null default 0 check (booking_requests >= 0),
  paid_bookings integer not null default 0 check (paid_bookings >= 0),
  source text not null default 'manual'
    check (source in ('manual', 'computed', 'import')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (market_id, bucket_start, bucket_end)
);

create table if not exists public.cleaner_supply (
  id uuid primary key default gen_random_uuid(),
  market_id text not null,
  bucket_start timestamptz not null,
  bucket_end timestamptz not null,
  -- Supply index (~1 = balanced); active cleaner count for ops visibility
  supply_index numeric(8,4) not null default 1.0000 check (supply_index >= 0),
  active_cleaners integer not null default 0 check (active_cleaners >= 0),
  available_cleaners integer not null default 0 check (available_cleaners >= 0),
  source text not null default 'manual'
    check (source in ('manual', 'computed', 'import')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (market_id, bucket_start, bucket_end)
);

create index if not exists market_demand_lookup_idx
  on public.market_demand (market_id, bucket_start desc);
create index if not exists cleaner_supply_lookup_idx
  on public.cleaner_supply (market_id, bucket_start desc);

create trigger market_demand_set_updated_at
before update on public.market_demand
for each row execute function public.set_updated_at();

create trigger cleaner_supply_set_updated_at
before update on public.cleaner_supply
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 6. RLS — deny anon/authenticated direct access; service role bypasses
-- ---------------------------------------------------------------------------

alter table public.pricing_rules enable row level security;
alter table public.pricing_quotes enable row level security;
alter table public.pricing_experiments enable row level security;
alter table public.pricing_experiment_assignments enable row level security;
alter table public.funnel_events enable row level security;
alter table public.market_demand enable row level security;
alter table public.cleaner_supply enable row level security;

comment on table public.pricing_rules is
  'Pricing Engine V1 parameters. dynamic_pricing_enabled defaults false.';
comment on table public.pricing_quotes is
  'Full quote audit including cost/margin. calculation_audit must never ship to clients.';
comment on table public.pricing_experiments is
  'Pricing A/B experiments. auto_deploy_winner must remain false — no auto winner deploy.';
comment on table public.funnel_events is
  'Conversion funnel events. device_category is UX analytics only — never price discrimination.';
