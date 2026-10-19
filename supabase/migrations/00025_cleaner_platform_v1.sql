-- MaidLinx Cleaner Platform V1 — Verified Cleaner Network
-- Additive only. Does not rewrite booking/payment paths.
-- Identity + background stay PENDING_PROVIDER until real vendors are connected.
-- Never store raw government-ID images in normal DB tables.

-- ---------------------------------------------------------------------------
-- Pipeline + verification + trust columns on cleaners
-- ---------------------------------------------------------------------------

alter table public.cleaners
  add column if not exists platform_stage text not null default 'APPLICANT'
    check (platform_stage in (
      'APPLICANT',
      'IDENTITY_PENDING',
      'SCREENING',
      'TRAINING',
      'APPROVED',
      'ACTIVE',
      'TRUSTED',
      'ELITE',
      'SUSPENDED',
      'REJECTED'
    )),
  add column if not exists identity_status text not null default 'PENDING_PROVIDER'
    check (identity_status in (
      'not_started',
      'PENDING_PROVIDER',
      'pending',
      'verified',
      'failed',
      'manual_review'
    )),
  add column if not exists identity_provider text,
  add column if not exists identity_external_ref text,
  add column if not exists identity_reviewed_at timestamptz,
  add column if not exists identity_reviewed_by uuid references public.users(id) on delete set null,
  add column if not exists background_status text not null default 'PENDING_PROVIDER'
    check (background_status in (
      'not_started',
      'PENDING_PROVIDER',
      'pending',
      'clear',
      'consider',
      'failed',
      'manual_review'
    )),
  add column if not exists background_provider text,
  add column if not exists background_external_ref text,
  add column if not exists background_reviewed_at timestamptz,
  add column if not exists background_reviewed_by uuid references public.users(id) on delete set null,
  add column if not exists phone_verified_at timestamptz,
  add column if not exists email_verified_at timestamptz,
  add column if not exists training_completed_at timestamptz,
  add column if not exists assessment_passed_at timestamptz,
  add column if not exists activated_at timestamptz,
  add column if not exists trust_score numeric(5,2) not null default 0,
  add column if not exists reliability_score numeric(5,2) not null default 0,
  add column if not exists serious_flag_count integer not null default 0,
  add column if not exists requires_admin_review boolean not null default false,
  add column if not exists application jsonb not null default '{}'::jsonb,
  add column if not exists application_submitted_at timestamptz,
  add column if not exists maidlinx_verified boolean not null default false,
  add column if not exists verified_at timestamptz;

comment on column public.cleaners.identity_status is
  'Provider-agnostic identity state. PENDING_PROVIDER until a real ID vendor is connected. Never fabricate verified.';
comment on column public.cleaners.background_status is
  'Provider-agnostic screening state. PENDING_PROVIDER + admin review until a real vendor is connected. Never claim background-checked publicly until clear from a connected provider.';
comment on column public.cleaners.maidlinx_verified is
  'Internal ops flag that all V1 gates passed and admin approved. Customer badge uses truthful copy only.';
comment on column public.cleaners.application is
  'Non-sensitive application payload (experience, transport, market, attestations). No SSN/gov ID images.';

-- Grandfather existing ops-approved supply so BOOK→ASSIGN does not break.
-- identity/background are marked admin-cleared (provider columns stay null).
-- Customer copy must still omit vendor "background checked" until a provider is connected.
update public.cleaners
set
  identity_status = 'verified',
  identity_reviewed_at = coalesce(identity_reviewed_at, onboarding_reviewed_at, now()),
  background_status = 'clear',
  background_reviewed_at = coalesce(background_reviewed_at, onboarding_reviewed_at, now()),
  phone_verified_at = coalesce(phone_verified_at, now()),
  email_verified_at = coalesce(email_verified_at, now()),
  training_completed_at = coalesce(training_completed_at, now()),
  assessment_passed_at = coalesce(assessment_passed_at, now()),
  agreements_accepted_at = coalesce(agreements_accepted_at, now()),
  maidlinx_verified = true,
  verified_at = coalesce(verified_at, now()),
  activated_at = coalesce(activated_at, case when is_active then now() else null end),
  platform_stage = case
    when is_active then 'ACTIVE'
    else 'APPROVED'
  end
where onboarding_status = 'APPROVED'
  and (coalesce(is_active, false) = true or coalesce(is_verified, false) = true or coalesce(approved, false) = true);

create index if not exists cleaners_platform_stage_idx
  on public.cleaners (platform_stage);

create index if not exists cleaners_identity_status_idx
  on public.cleaners (identity_status);

create index if not exists cleaners_background_status_idx
  on public.cleaners (background_status);

create index if not exists cleaners_requires_admin_review_idx
  on public.cleaners (requires_admin_review)
  where requires_admin_review = true;

-- ---------------------------------------------------------------------------
-- Configurable approval gates (server reads these; never auto-pass unverified)
-- ---------------------------------------------------------------------------

create table if not exists public.cleaner_approval_gates (
  gate_key text primary key,
  label text not null,
  description text,
  required boolean not null default true,
  enabled boolean not null default true,
  sort_order integer not null default 100,
  updated_at timestamptz not null default now()
);

insert into public.cleaner_approval_gates (gate_key, label, description, required, enabled, sort_order)
values
  ('identity', 'Identity verification', 'Identity must be verified or manually cleared by admin after review. Provider pending until connected.', true, true, 10),
  ('background', 'Background screening', 'Screening must be clear or manually reviewed by admin. Never auto-approve while provider pending.', true, true, 20),
  ('phone', 'Phone verified', 'Cleaner phone confirmed.', true, true, 30),
  ('email', 'Email verified', 'Cleaner email confirmed.', true, true, 40),
  ('agreements', 'Agreements accepted', 'Cleaner agreement + platform terms accepted.', true, true, 50),
  ('training', 'Academy training complete', 'All required MaidLinx Academy modules completed.', true, true, 60),
  ('assessment', 'Assessment passed', 'Short knowledge assessment passed.', true, true, 70),
  ('admin_approval', 'Admin approval', 'Ops reviewed and approved the application.', true, true, 80),
  ('active_status', 'Active status', 'Cleaner marked active for marketplace work.', true, true, 90)
on conflict (gate_key) do nothing;

alter table public.cleaner_approval_gates enable row level security;

drop policy if exists cleaner_approval_gates_admin_all on public.cleaner_approval_gates;
create policy cleaner_approval_gates_admin_all on public.cleaner_approval_gates
  for all using (is_admin()) with check (is_admin());

drop policy if exists cleaner_approval_gates_authenticated_select on public.cleaner_approval_gates;
create policy cleaner_approval_gates_authenticated_select on public.cleaner_approval_gates
  for select using (auth.uid() is not null);

-- ---------------------------------------------------------------------------
-- MaidLinx Academy modules + progress + assessment attempts
-- ---------------------------------------------------------------------------

create table if not exists public.academy_modules (
  id text primary key,
  title text not null,
  summary text not null,
  content_md text not null,
  sort_order integer not null default 100,
  required boolean not null default true,
  estimated_minutes integer not null default 5,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.academy_modules (id, title, summary, content_md, sort_order, required, estimated_minutes)
values
  (
    'academy_standards',
    'MaidLinx service standards',
    'How we show up for customers: reliability, respect, and quality.',
    E'# MaidLinx service standards\n\n- Arrive on time or communicate early.\n- Protect customer privacy and property.\n- Complete the checklist and photo requirements.\n- Never share access codes outside the job.',
    10, true, 6
  ),
  (
    'academy_safety',
    'Safety and access',
    'Safe entry, chemicals, and incident reporting.',
    E'# Safety and access\n\n- Follow access instructions exactly.\n- Do not force entry or leave doors unsecured.\n- Report hazards and incidents immediately in-app.\n- Use only approved cleaning products when required.',
    20, true, 6
  ),
  (
    'academy_privacy',
    'Privacy and professionalism',
    'What cleaners may see and what must never leave the job.',
    E'# Privacy and professionalism\n\n- Street addresses and access codes appear only after authorized assignment.\n- Do not photograph people, mail, or documents.\n- Do not post job details on social media.\n- Treat every home as private.',
    30, true, 5
  ),
  (
    'academy_jobs',
    'Jobs, status updates, and payouts',
    'EN_ROUTE → ARRIVED → IN_PROGRESS → COMPLETED and how pay works.',
    E'# Jobs and payouts\n\n- Update status honestly as you move through the job.\n- Complete checklist + before/after photos before marking complete.\n- Payouts are handled via Stripe Connect — MaidLinx never stores bank passwords in-app.\n- Cancellations and no-shows affect reliability scoring.',
    40, true, 7
  )
on conflict (id) do nothing;

create table if not exists public.cleaner_training_progress (
  id uuid primary key default gen_random_uuid(),
  cleaner_id uuid not null references public.cleaners(id) on delete cascade,
  module_id text not null references public.academy_modules(id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (cleaner_id, module_id)
);

create index if not exists cleaner_training_progress_cleaner_idx
  on public.cleaner_training_progress (cleaner_id);

create table if not exists public.cleaner_assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  cleaner_id uuid not null references public.cleaners(id) on delete cascade,
  score integer not null check (score between 0 and 100),
  passed boolean not null,
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists cleaner_assessment_attempts_cleaner_idx
  on public.cleaner_assessment_attempts (cleaner_id, created_at desc);

alter table public.academy_modules enable row level security;
alter table public.cleaner_training_progress enable row level security;
alter table public.cleaner_assessment_attempts enable row level security;

drop policy if exists academy_modules_select on public.academy_modules;
create policy academy_modules_select on public.academy_modules
  for select using (auth.uid() is not null and is_active = true);

drop policy if exists academy_modules_admin on public.academy_modules;
create policy academy_modules_admin on public.academy_modules
  for all using (is_admin()) with check (is_admin());

drop policy if exists cleaner_training_owner_select on public.cleaner_training_progress;
create policy cleaner_training_owner_select on public.cleaner_training_progress
  for select using (
    is_admin()
    or exists (
      select 1 from public.cleaners c
      where c.id = cleaner_training_progress.cleaner_id and c.user_id = auth.uid()
    )
  );

drop policy if exists cleaner_training_owner_insert on public.cleaner_training_progress;
create policy cleaner_training_owner_insert on public.cleaner_training_progress
  for insert with check (
    is_admin()
    or exists (
      select 1 from public.cleaners c
      where c.id = cleaner_training_progress.cleaner_id and c.user_id = auth.uid()
    )
  );

drop policy if exists cleaner_assessment_owner_select on public.cleaner_assessment_attempts;
create policy cleaner_assessment_owner_select on public.cleaner_assessment_attempts
  for select using (
    is_admin()
    or exists (
      select 1 from public.cleaners c
      where c.id = cleaner_assessment_attempts.cleaner_id and c.user_id = auth.uid()
    )
  );

drop policy if exists cleaner_assessment_owner_insert on public.cleaner_assessment_attempts;
create policy cleaner_assessment_owner_insert on public.cleaner_assessment_attempts
  for insert with check (
    is_admin()
    or exists (
      select 1 from public.cleaners c
      where c.id = cleaner_assessment_attempts.cleaner_id and c.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Trust flags (serious → admin review; never auto-fire)
-- ---------------------------------------------------------------------------

create table if not exists public.cleaner_trust_flags (
  id uuid primary key default gen_random_uuid(),
  cleaner_id uuid not null references public.cleaners(id) on delete cascade,
  flag_type text not null check (flag_type in (
    'no_show',
    'late',
    'quality',
    'customer_complaint',
    'safety',
    'policy',
    'fraud_signal',
    'other'
  )),
  severity text not null default 'low'
    check (severity in ('low', 'medium', 'high', 'critical')),
  status text not null default 'open'
    check (status in ('open', 'under_review', 'resolved', 'dismissed')),
  notes text,
  created_by uuid references public.users(id) on delete set null,
  reviewed_by uuid references public.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cleaner_trust_flags_cleaner_idx
  on public.cleaner_trust_flags (cleaner_id, status);

create index if not exists cleaner_trust_flags_open_idx
  on public.cleaner_trust_flags (status, severity)
  where status in ('open', 'under_review');

create trigger cleaner_trust_flags_set_updated_at
before update on public.cleaner_trust_flags
for each row execute function public.set_updated_at();

alter table public.cleaner_trust_flags enable row level security;

drop policy if exists cleaner_trust_flags_admin on public.cleaner_trust_flags;
create policy cleaner_trust_flags_admin on public.cleaner_trust_flags
  for all using (is_admin()) with check (is_admin());

drop policy if exists cleaner_trust_flags_owner_select on public.cleaner_trust_flags;
create policy cleaner_trust_flags_owner_select on public.cleaner_trust_flags
  for select using (
    exists (
      select 1 from public.cleaners c
      where c.id = cleaner_trust_flags.cleaner_id and c.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Cleaner platform audit log (important actions; admin + system)
-- ---------------------------------------------------------------------------

create table if not exists public.cleaner_platform_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.users(id) on delete set null,
  actor_role text,
  action text not null,
  cleaner_id uuid references public.cleaners(id) on delete set null,
  entity_type text not null default 'cleaner',
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists cleaner_platform_audit_log_cleaner_idx
  on public.cleaner_platform_audit_log (cleaner_id, created_at desc);

create index if not exists cleaner_platform_audit_log_action_idx
  on public.cleaner_platform_audit_log (action, created_at desc);

alter table public.cleaner_platform_audit_log enable row level security;

drop policy if exists cleaner_platform_audit_admin on public.cleaner_platform_audit_log;
create policy cleaner_platform_audit_admin on public.cleaner_platform_audit_log
  for select using (is_admin());

-- Inserts go through service role / server only (no authenticated insert policy).

-- ---------------------------------------------------------------------------
-- Refresh professionals compat view with V1 columns
-- ---------------------------------------------------------------------------

create or replace view public.professionals
with (security_invoker = true)
as
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
  onboarding_status,
  onboarding_checklist,
  is_online,
  last_online_at,
  stripe_connect_status,
  stripe_connect_id,
  market_id,
  languages,
  transportation,
  agreements_accepted_at,
  onboarding_submitted_at,
  onboarding_reviewed_at,
  rejection_reason,
  platform_stage,
  identity_status,
  identity_provider,
  identity_external_ref,
  identity_reviewed_at,
  identity_reviewed_by,
  background_status,
  background_provider,
  background_external_ref,
  background_reviewed_at,
  background_reviewed_by,
  phone_verified_at,
  email_verified_at,
  training_completed_at,
  assessment_passed_at,
  activated_at,
  trust_score,
  reliability_score,
  serious_flag_count,
  requires_admin_review,
  application,
  application_submitted_at,
  maidlinx_verified,
  verified_at,
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
    id,
    user_id,
    bio,
    years_experience,
    service_radius_km,
    is_verified,
    is_active,
    rating_average,
    rating_count,
    onboarding_status,
    onboarding_checklist,
    is_online,
    last_online_at,
    stripe_connect_status,
    stripe_connect_id,
    market_id,
    languages,
    transportation,
    agreements_accepted_at,
    onboarding_submitted_at,
    onboarding_reviewed_at,
    rejection_reason,
    platform_stage,
    identity_status,
    background_status,
    phone_verified_at,
    email_verified_at,
    training_completed_at,
    assessment_passed_at,
    activated_at,
    trust_score,
    reliability_score,
    serious_flag_count,
    requires_admin_review,
    application,
    application_submitted_at,
    maidlinx_verified,
    verified_at,
    created_at,
    updated_at
  ) values (
    coalesce(new.id, gen_random_uuid()),
    new.profile_id,
    new.bio,
    new.years_experience,
    coalesce(new.service_radius_km, 25),
    coalesce(new.is_verified, false),
    coalesce(new.is_active, false),
    coalesce(new.rating_average, 0),
    coalesce(new.rating_count, 0),
    coalesce(new.onboarding_status, 'NOT_STARTED'),
    coalesce(new.onboarding_checklist, '{}'::jsonb),
    coalesce(new.is_online, false),
    new.last_online_at,
    coalesce(new.stripe_connect_status, 'NOT_STARTED'),
    new.stripe_connect_id,
    new.market_id,
    coalesce(new.languages, '{}'),
    new.transportation,
    new.agreements_accepted_at,
    new.onboarding_submitted_at,
    new.onboarding_reviewed_at,
    new.rejection_reason,
    coalesce(new.platform_stage, 'APPLICANT'),
    coalesce(new.identity_status, 'PENDING_PROVIDER'),
    coalesce(new.background_status, 'PENDING_PROVIDER'),
    new.phone_verified_at,
    new.email_verified_at,
    new.training_completed_at,
    new.assessment_passed_at,
    new.activated_at,
    coalesce(new.trust_score, 0),
    coalesce(new.reliability_score, 0),
    coalesce(new.serious_flag_count, 0),
    coalesce(new.requires_admin_review, false),
    coalesce(new.application, '{}'::jsonb),
    new.application_submitted_at,
    coalesce(new.maidlinx_verified, false),
    new.verified_at,
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
    onboarding_status = coalesce(new.onboarding_status, onboarding_status),
    onboarding_checklist = coalesce(new.onboarding_checklist, onboarding_checklist),
    is_online = coalesce(new.is_online, is_online),
    last_online_at = case
      when new.is_online is true then coalesce(new.last_online_at, now())
      else new.last_online_at
    end,
    stripe_connect_status = coalesce(new.stripe_connect_status, stripe_connect_status),
    stripe_connect_id = coalesce(new.stripe_connect_id, stripe_connect_id),
    market_id = new.market_id,
    languages = coalesce(new.languages, languages),
    transportation = new.transportation,
    agreements_accepted_at = coalesce(new.agreements_accepted_at, agreements_accepted_at),
    onboarding_submitted_at = coalesce(new.onboarding_submitted_at, onboarding_submitted_at),
    onboarding_reviewed_at = coalesce(new.onboarding_reviewed_at, onboarding_reviewed_at),
    rejection_reason = new.rejection_reason,
    platform_stage = coalesce(new.platform_stage, platform_stage),
    identity_status = coalesce(new.identity_status, identity_status),
    identity_provider = coalesce(new.identity_provider, identity_provider),
    identity_external_ref = coalesce(new.identity_external_ref, identity_external_ref),
    identity_reviewed_at = coalesce(new.identity_reviewed_at, identity_reviewed_at),
    identity_reviewed_by = coalesce(new.identity_reviewed_by, identity_reviewed_by),
    background_status = coalesce(new.background_status, background_status),
    background_provider = coalesce(new.background_provider, background_provider),
    background_external_ref = coalesce(new.background_external_ref, background_external_ref),
    background_reviewed_at = coalesce(new.background_reviewed_at, background_reviewed_at),
    background_reviewed_by = coalesce(new.background_reviewed_by, background_reviewed_by),
    phone_verified_at = coalesce(new.phone_verified_at, phone_verified_at),
    email_verified_at = coalesce(new.email_verified_at, email_verified_at),
    training_completed_at = coalesce(new.training_completed_at, training_completed_at),
    assessment_passed_at = coalesce(new.assessment_passed_at, assessment_passed_at),
    activated_at = coalesce(new.activated_at, activated_at),
    trust_score = coalesce(new.trust_score, trust_score),
    reliability_score = coalesce(new.reliability_score, reliability_score),
    serious_flag_count = coalesce(new.serious_flag_count, serious_flag_count),
    requires_admin_review = coalesce(new.requires_admin_review, requires_admin_review),
    application = coalesce(new.application, application),
    application_submitted_at = coalesce(new.application_submitted_at, application_submitted_at),
    maidlinx_verified = coalesce(new.maidlinx_verified, maidlinx_verified),
    verified_at = coalesce(new.verified_at, verified_at),
    updated_at = now()
  where id = old.id;
  return new;
end;
$$;

comment on view public.professionals is
  'Compat view over cleaners. Includes Pro onboarding + Cleaner Platform V1 trust/verification fields.';
