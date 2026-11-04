-- AI executive team foundation (additive only).
-- Permissions + audit for founder /owner command center.
-- Does NOT enable Stripe LIVE, outbound campaigns, or auto money moves.

-- ---------------------------------------------------------------------------
-- 1. AI audit log (every AI action / recommendation read)
-- ---------------------------------------------------------------------------

create table if not exists public.ai_audit_log (
  id uuid primary key default gen_random_uuid(),
  agent_id text not null,
  action text not null,
  permission_level text not null
    check (permission_level in ('green', 'yellow', 'red')),
  actor_profile_id uuid references public.profiles(id) on delete set null,
  entity_type text,
  entity_id text,
  summary text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ai_audit_log_created_idx
  on public.ai_audit_log (created_at desc);

create index if not exists ai_audit_log_agent_idx
  on public.ai_audit_log (agent_id, created_at desc);

comment on table public.ai_audit_log is
  'Append-only audit of AI executive actions/recommendations. Service-role writes; admins read via server.';

-- ---------------------------------------------------------------------------
-- 2. Founder approval queue for RED actions (scaffold — no auto-exec)
-- ---------------------------------------------------------------------------

create table if not exists public.ai_action_approvals (
  id uuid primary key default gen_random_uuid(),
  agent_id text not null,
  action text not null,
  permission_level text not null default 'red'
    check (permission_level in ('yellow', 'red')),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'expired')),
  requested_by_profile_id uuid references public.profiles(id) on delete set null,
  decided_by_profile_id uuid references public.profiles(id) on delete set null,
  entity_type text,
  entity_id text,
  summary text not null,
  payload jsonb not null default '{}'::jsonb,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists ai_action_approvals_pending_idx
  on public.ai_action_approvals (status, created_at desc)
  where status = 'pending';

comment on table public.ai_action_approvals is
  'RED/YELLOW AI actions requiring founder approval. V0: queue only — no auto-execution.';

-- ---------------------------------------------------------------------------
-- 3. RLS — deny direct client access; server uses service role
-- ---------------------------------------------------------------------------

alter table public.ai_audit_log enable row level security;
alter table public.ai_action_approvals enable row level security;

-- No public policies: clients cannot read/write. Service role bypasses RLS.
-- Owner UI loads via createAdminClient() after admin session gate.
