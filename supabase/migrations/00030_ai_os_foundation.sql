-- AI OS Foundation (additive). Extends 00029 — does not replace it.
-- business_events + durable AI recommendation/decision/action/exception tables
-- + feature flags (pause / simulation). No auto-execution. No Stripe LIVE.

-- ---------------------------------------------------------------------------
-- 1. Cross-domain business events (idempotent mirror of critical signals)
-- ---------------------------------------------------------------------------

create table if not exists public.business_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  entity_type text not null,
  entity_id text not null,
  idempotency_key text not null,
  actor_type text,
  actor_id text,
  source text not null default 'system',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint business_events_idempotency_key_unique unique (idempotency_key)
);

create index if not exists business_events_created_idx
  on public.business_events (created_at desc);

create index if not exists business_events_type_idx
  on public.business_events (event_type, created_at desc);

create index if not exists business_events_entity_idx
  on public.business_events (entity_type, entity_id, created_at desc);

comment on table public.business_events is
  'Cross-domain business event bus for AI OS. Soft-fail emitters; never block booking/payment.';

-- ---------------------------------------------------------------------------
-- 2. Durable AI recommendations / decisions / actions / exceptions
-- ---------------------------------------------------------------------------

create table if not exists public.ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  agent_id text not null,
  recommendation_type text not null,
  permission_level text not null
    check (permission_level in ('green', 'yellow', 'red')),
  status text not null default 'open'
    check (status in ('open', 'accepted', 'dismissed', 'expired', 'converted')),
  title text not null,
  summary text,
  entity_type text,
  entity_id text,
  potential_cents_estimate bigint,
  confidence numeric(5,4),
  evidence text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_recommendations_agent_idx
  on public.ai_recommendations (agent_id, created_at desc);

create index if not exists ai_recommendations_status_idx
  on public.ai_recommendations (status, created_at desc)
  where status = 'open';

create table if not exists public.ai_decisions (
  id uuid primary key default gen_random_uuid(),
  agent_id text not null,
  decision_type text not null,
  permission_level text not null
    check (permission_level in ('green', 'yellow', 'red')),
  recommendation_id uuid references public.ai_recommendations(id) on delete set null,
  decided_by text not null default 'system'
    check (decided_by in ('system', 'founder', 'admin', 'agent')),
  decided_by_profile_id uuid references public.profiles(id) on delete set null,
  outcome text not null default 'recorded'
    check (outcome in ('recorded', 'approved', 'rejected', 'deferred', 'simulated')),
  summary text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ai_decisions_agent_idx
  on public.ai_decisions (agent_id, created_at desc);

create table if not exists public.ai_actions (
  id uuid primary key default gen_random_uuid(),
  agent_id text not null,
  action text not null,
  permission_level text not null
    check (permission_level in ('green', 'yellow', 'red')),
  status text not null default 'planned'
    check (status in ('planned', 'simulated', 'awaiting_approval', 'approved', 'rejected', 'executed', 'failed', 'cancelled')),
  decision_id uuid references public.ai_decisions(id) on delete set null,
  approval_id uuid references public.ai_action_approvals(id) on delete set null,
  entity_type text,
  entity_id text,
  summary text not null,
  simulation boolean not null default true,
  payload jsonb not null default '{}'::jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_actions_agent_idx
  on public.ai_actions (agent_id, created_at desc);

create index if not exists ai_actions_status_idx
  on public.ai_actions (status, created_at desc);

create table if not exists public.ai_exceptions (
  id uuid primary key default gen_random_uuid(),
  agent_id text,
  exception_type text not null,
  severity text not null default 'warning'
    check (severity in ('info', 'warning', 'critical')),
  status text not null default 'open'
    check (status in ('open', 'acknowledged', 'resolved', 'ignored')),
  entity_type text,
  entity_id text,
  summary text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists ai_exceptions_open_idx
  on public.ai_exceptions (status, created_at desc)
  where status = 'open';

comment on table public.ai_recommendations is
  'Persisted AI recommendations. V0: store/read only — no auto outbound.';
comment on table public.ai_decisions is
  'Recorded AI/founder decisions. No RED auto-exec.';
comment on table public.ai_actions is
  'Planned/simulated AI actions. Default simulation=true; no autonomous RED.';
comment on table public.ai_exceptions is
  'AI OS exceptions / kill-switch incidents for founder review.';

-- ---------------------------------------------------------------------------
-- 3. Feature flags (AI_* + pause / simulation) — mutable without redeploy
-- ---------------------------------------------------------------------------

create table if not exists public.ai_feature_flags (
  key text primary key,
  enabled boolean not null default false,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  updated_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.ai_feature_flags is
  'AI OS feature flags and pause switches. Service-role writes after owner gate.';

insert into public.ai_feature_flags (key, enabled, description) values
  ('AI_GLOBAL_PAUSE', false, 'When true, all AI agents are paused (no briefs/actions).'),
  ('AI_SIMULATION_MODE', true, 'When true, AI actions stay simulated (no side effects).'),
  ('AI_BUSINESS_EVENTS', true, 'Emit business_events mirrors from critical booking signals.'),
  ('AI_REVENUE_DIRECTOR', true, 'Revenue Director agent enabled (still respects global pause).'),
  ('AI_OPS_DIRECTOR', false, 'Ops Director agent — off until built.'),
  ('AI_RETENTION_DIRECTOR', false, 'Retention Director agent — off until built.'),
  ('AI_B2B_SALES_DIRECTOR', false, 'B2B Sales Director — off until built.'),
  ('AI_GROWTH_DIRECTOR', false, 'Growth Director — off until built.'),
  ('AI_CHIEF_OF_STAFF', false, 'Chief of Staff — off until built.'),
  ('AI_OUTBOUND_AUTO_SEND', false, 'Hard off: never auto-send customer campaigns in foundation.')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- 4. RLS — deny direct client access; server uses service role
-- ---------------------------------------------------------------------------

alter table public.business_events enable row level security;
alter table public.ai_recommendations enable row level security;
alter table public.ai_decisions enable row level security;
alter table public.ai_actions enable row level security;
alter table public.ai_exceptions enable row level security;
alter table public.ai_feature_flags enable row level security;

-- No public policies: clients cannot read/write. Service role bypasses RLS.
