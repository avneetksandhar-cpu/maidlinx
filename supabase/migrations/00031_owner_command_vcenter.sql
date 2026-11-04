-- Owner Command vCenter (additive). Extends 00029/00030 — does not replace them.
-- Targets, B2B sales CRM, founder interventions, business_events correlation.
-- No Stripe LIVE. No auto outbound. RLS deny-all for new tables (service-role).

-- ---------------------------------------------------------------------------
-- 1. Revenue targets (editable; defaults $100K/mo + $1M/yr)
-- ---------------------------------------------------------------------------

create table if not exists public.owner_revenue_targets (
  id text primary key default 'default',
  monthly_target_cents bigint not null default 10000000
    check (monthly_target_cents >= 0),
  annual_target_cents bigint not null default 100000000
    check (annual_target_cents >= 0),
  currency text not null default 'usd',
  notes text,
  updated_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.owner_revenue_targets is
  'Owner-editable revenue targets for /owner dashboards. Defaults 100k/mo and 1M/yr.';

insert into public.owner_revenue_targets (id, monthly_target_cents, annual_target_cents)
values ('default', 10000000, 100000000)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 2. B2B / commercial sales CRM (internal; not fake production customers)
-- ---------------------------------------------------------------------------

create table if not exists public.owner_sales_leads (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text,
  contact_email text,
  contact_phone text,
  segment text not null default 'commercial'
    check (segment in ('commercial', 'property_manager', 'office', 'airbnb', 'other')),
  stage text not null default 'lead'
    check (stage in (
      'lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'nurture'
    )),
  estimated_monthly_cents bigint,
  estimated_annual_cents bigint,
  next_follow_up_at timestamptz,
  last_contacted_at timestamptz,
  owner_notes text,
  source text,
  status text not null default 'open'
    check (status in ('open', 'won', 'lost', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists owner_sales_leads_stage_idx
  on public.owner_sales_leads (stage, status, updated_at desc);

create index if not exists owner_sales_leads_followup_idx
  on public.owner_sales_leads (next_follow_up_at)
  where status = 'open' and next_follow_up_at is not null;

comment on table public.owner_sales_leads is
  'Internal B2B/commercial CRM for /owner/sales. Manual entries only — never invent pipeline.';

-- ---------------------------------------------------------------------------
-- 3. Founder intervention tracking
-- ---------------------------------------------------------------------------

create table if not exists public.founder_interventions (
  id uuid primary key default gen_random_uuid(),
  intervention_type text not null,
  severity text not null default 'info'
    check (severity in ('info', 'warning', 'critical')),
  summary text not null,
  entity_type text,
  entity_id text,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  related_exception_id uuid,
  related_recommendation_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists founder_interventions_created_idx
  on public.founder_interventions (created_at desc);

create index if not exists founder_interventions_type_idx
  on public.founder_interventions (intervention_type, created_at desc);

comment on table public.founder_interventions is
  'Manual founder/ops interventions for weekly trend + owner dashboard.';

-- ---------------------------------------------------------------------------
-- 4. business_events — correlation + source index (non-breaking)
-- ---------------------------------------------------------------------------

alter table public.business_events
  add column if not exists correlation_id text;

create index if not exists business_events_correlation_idx
  on public.business_events (correlation_id, created_at desc)
  where correlation_id is not null;

-- Dedup helper for open recommendations (aggregate opportunity keys)
create unique index if not exists ai_recommendations_open_dedupe_idx
  on public.ai_recommendations (
    agent_id,
    recommendation_type,
    (coalesce(entity_type, '')),
    (coalesce(entity_id, ''))
  )
  where status = 'open';

-- ---------------------------------------------------------------------------
-- 5. Feature flags for vCenter engines
-- ---------------------------------------------------------------------------

insert into public.ai_feature_flags (key, enabled, description) values
  ('AI_OPPORTUNITY_ENGINE', true, 'Deterministic revenue opportunity hunter (no LLM, no auto-send).'),
  ('AI_OWNER_SNAPSHOT', true, 'Owner command center real-data snapshot.')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- 6. RLS — deny direct client access
-- ---------------------------------------------------------------------------

alter table public.owner_revenue_targets enable row level security;
alter table public.owner_sales_leads enable row level security;
alter table public.founder_interventions enable row level security;

-- No public policies: clients cannot read/write. Service role bypasses RLS.
