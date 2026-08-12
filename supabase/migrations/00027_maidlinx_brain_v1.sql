-- MaidLinx Brain V1 — marketplace intelligence (NOT a chatbot).
-- Additive. Does not change checkout hot path.
-- LLMs must never write prices, approvals, refunds, or payouts from these tables.

-- ---------------------------------------------------------------------------
-- Durable event pipeline (aggregations only; no PII payloads)
-- ---------------------------------------------------------------------------

create table if not exists public.brain_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  market_id text,
  zone_id text,
  booking_id uuid references public.bookings(id) on delete set null,
  cleaner_id uuid references public.cleaners(id) on delete set null,
  -- Opaque session / funnel correlation — never store email/phone/address here.
  session_key text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists brain_events_type_created_idx
  on public.brain_events (event_type, created_at desc);

create index if not exists brain_events_market_created_idx
  on public.brain_events (market_id, created_at desc)
  where market_id is not null;

alter table public.brain_events enable row level security;

drop policy if exists brain_events_admin_select on public.brain_events;
create policy brain_events_admin_select on public.brain_events
  for select using (is_admin());

-- Inserts via service role only.

-- ---------------------------------------------------------------------------
-- Forecast snapshots (deterministic; INSUFFICIENT_DATA when sample too small)
-- ---------------------------------------------------------------------------

create table if not exists public.brain_forecast_snapshots (
  id uuid primary key default gen_random_uuid(),
  market_id text not null,
  horizon text not null check (horizon in ('next_24h', 'next_7d', 'next_30d')),
  kind text not null check (kind in ('demand', 'supply', 'capacity')),
  status text not null check (status in ('ok', 'INSUFFICIENT_DATA')),
  sample_size integer not null default 0,
  confidence numeric(5,4) not null default 0,
  value_json jsonb not null default '{}'::jsonb,
  computed_at timestamptz not null default now(),
  unique (market_id, horizon, kind, computed_at)
);

create index if not exists brain_forecast_latest_idx
  on public.brain_forecast_snapshots (market_id, kind, horizon, computed_at desc);

alter table public.brain_forecast_snapshots enable row level security;

drop policy if exists brain_forecast_admin_select on public.brain_forecast_snapshots;
create policy brain_forecast_admin_select on public.brain_forecast_snapshots
  for select using (is_admin());

-- ---------------------------------------------------------------------------
-- Capacity alerts (ops review — never auto-punish / auto-expand)
-- ---------------------------------------------------------------------------

create table if not exists public.brain_capacity_alerts (
  id uuid primary key default gen_random_uuid(),
  market_id text not null,
  severity text not null check (severity in ('info', 'watch', 'critical')),
  alert_code text not null,
  message text not null,
  metrics jsonb not null default '{}'::jsonb,
  status text not null default 'open'
    check (status in ('open', 'acknowledged', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  acknowledged_by uuid references public.users(id) on delete set null,
  acknowledged_at timestamptz
);

create index if not exists brain_capacity_alerts_open_idx
  on public.brain_capacity_alerts (status, severity, created_at desc)
  where status = 'open';

alter table public.brain_capacity_alerts enable row level security;

drop policy if exists brain_capacity_alerts_admin on public.brain_capacity_alerts;
create policy brain_capacity_alerts_admin on public.brain_capacity_alerts
  for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------------
-- Dispatch outcome tracking (auditable; feeds ranking improvements offline)
-- ---------------------------------------------------------------------------

create table if not exists public.brain_dispatch_outcomes (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  offer_id uuid,
  cleaner_id uuid references public.cleaners(id) on delete set null,
  outcome text not null check (outcome in (
    'offered', 'accepted', 'declined', 'expired', 'admin_assigned', 'cancelled'
  )),
  match_score numeric(5,2),
  factors jsonb not null default '[]'::jsonb,
  latency_seconds integer,
  created_at timestamptz not null default now()
);

create index if not exists brain_dispatch_outcomes_booking_idx
  on public.brain_dispatch_outcomes (booking_id, created_at desc);

alter table public.brain_dispatch_outcomes enable row level security;

drop policy if exists brain_dispatch_outcomes_admin on public.brain_dispatch_outcomes;
create policy brain_dispatch_outcomes_admin on public.brain_dispatch_outcomes
  for select using (is_admin());

-- ---------------------------------------------------------------------------
-- Job profitability snapshots (est vs actual; admin only)
-- ---------------------------------------------------------------------------

create table if not exists public.brain_job_profit (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade unique,
  market_id text,
  estimated_revenue_cents integer not null default 0,
  estimated_cost_cents integer not null default 0,
  estimated_margin_cents integer not null default 0,
  actual_revenue_cents integer,
  actual_cost_cents integer,
  actual_margin_cents integer,
  status text not null default 'estimated'
    check (status in ('estimated', 'actualized', 'void')),
  notes text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

drop trigger if exists brain_job_profit_set_updated_at on public.brain_job_profit;
create trigger brain_job_profit_set_updated_at
before update on public.brain_job_profit
for each row execute function public.set_updated_at();

alter table public.brain_job_profit enable row level security;

drop policy if exists brain_job_profit_admin on public.brain_job_profit;
create policy brain_job_profit_admin on public.brain_job_profit
  for select using (is_admin());

-- ---------------------------------------------------------------------------
-- Quality REVIEW_SIGNALS (never auto-fire discipline)
-- ---------------------------------------------------------------------------

create table if not exists public.brain_quality_signals (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete set null,
  cleaner_id uuid references public.cleaners(id) on delete set null,
  signal_code text not null,
  severity text not null default 'low'
    check (severity in ('low', 'medium', 'high', 'critical')),
  status text not null default 'REVIEW_SIGNAL'
    check (status in ('REVIEW_SIGNAL', 'under_review', 'resolved', 'dismissed')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists brain_quality_signals_open_idx
  on public.brain_quality_signals (status, severity, created_at desc)
  where status = 'REVIEW_SIGNAL';

alter table public.brain_quality_signals enable row level security;

drop policy if exists brain_quality_signals_admin on public.brain_quality_signals;
create policy brain_quality_signals_admin on public.brain_quality_signals
  for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------------
-- Market expansion scores (advisory; never auto-expand)
-- ---------------------------------------------------------------------------

create table if not exists public.brain_market_expansion_scores (
  id uuid primary key default gen_random_uuid(),
  market_id text not null,
  status text not null check (status in ('ok', 'INSUFFICIENT_DATA')),
  sample_size integer not null default 0,
  confidence numeric(5,4) not null default 0,
  score numeric(5,2),
  factors jsonb not null default '{}'::jsonb,
  computed_at timestamptz not null default now()
);

create index if not exists brain_market_expansion_latest_idx
  on public.brain_market_expansion_scores (market_id, computed_at desc);

alter table public.brain_market_expansion_scores enable row level security;

drop policy if exists brain_market_expansion_admin on public.brain_market_expansion_scores;
create policy brain_market_expansion_admin on public.brain_market_expansion_scores
  for select using (is_admin());

-- ---------------------------------------------------------------------------
-- Daily ops brief cache (generated server-side; zeros when empty)
-- ---------------------------------------------------------------------------

create table if not exists public.brain_daily_briefs (
  id uuid primary key default gen_random_uuid(),
  brief_date date not null unique,
  status text not null default 'ok' check (status in ('ok', 'INSUFFICIENT_DATA')),
  body jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.brain_daily_briefs enable row level security;

drop policy if exists brain_daily_briefs_admin on public.brain_daily_briefs;
create policy brain_daily_briefs_admin on public.brain_daily_briefs
  for select using (is_admin());
