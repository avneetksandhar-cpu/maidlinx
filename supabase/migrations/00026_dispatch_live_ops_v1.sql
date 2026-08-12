-- MaidLinx Dispatch & Live Operations V1
-- Additive. Preserves booking/payment paths. Respects Cleaner Platform gates.
-- Never fabricates SMS/email delivery or ID/BG verification.

-- ---------------------------------------------------------------------------
-- Match Engine offer table (may be missing on partially-migrated remotes)
-- ---------------------------------------------------------------------------

create unique index if not exists cleaner_assignments_one_active_per_booking
  on public.cleaner_assignments (booking_id)
  where status = 'active';

alter table public.booking_events
  add column if not exists actor_type text,
  add column if not exists payload jsonb;

create table if not exists public.booking_offers (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  cleaner_id uuid not null references public.cleaners(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
  match_score numeric(5,2),
  score_breakdown jsonb not null default '[]'::jsonb,
  offered_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  expires_at timestamptz
);

create index if not exists booking_offers_booking_idx
  on public.booking_offers (booking_id, created_at desc);

create index if not exists booking_offers_cleaner_idx
  on public.booking_offers (cleaner_id, status);

create unique index if not exists booking_offers_pending_unique
  on public.booking_offers (booking_id, cleaner_id)
  where status = 'pending';

create unique index if not exists booking_offers_one_accepted_per_booking
  on public.booking_offers (booking_id)
  where status = 'accepted';

alter table public.booking_offers enable row level security;

drop policy if exists booking_offers_select_participant on public.booking_offers;
create policy booking_offers_select_participant on public.booking_offers
  for select using (
    exists (
      select 1
      from public.bookings b
      join public.cleaners c on c.id = booking_offers.cleaner_id
      where b.id = booking_offers.booking_id
        and (
          b.customer_id = auth.uid()
          or c.user_id = auth.uid()
          or is_admin()
        )
    )
  );

-- No authenticated insert/update/delete — service role / server APIs only.

-- ---------------------------------------------------------------------------
-- Dispatch mode by market (DIRECT | BATCH | ADMIN)
-- ---------------------------------------------------------------------------

create table if not exists public.dispatch_market_config (
  market_id text primary key,
  mode text not null default 'ADMIN'
    check (mode in ('DIRECT', 'BATCH', 'ADMIN')),
  batch_size integer not null default 3 check (batch_size between 1 and 20),
  offer_expiry_minutes integer not null default 30 check (offer_expiry_minutes between 5 and 1440),
  fair_dispatch_enabled boolean not null default true,
  max_pending_offers_per_cleaner integer not null default 5 check (max_pending_offers_per_cleaner between 1 and 50),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.users(id) on delete set null
);

alter table public.dispatch_market_config enable row level security;

drop policy if exists dispatch_market_config_admin on public.dispatch_market_config;
create policy dispatch_market_config_admin on public.dispatch_market_config
  for all using (is_admin()) with check (is_admin());

drop policy if exists dispatch_market_config_auth_select on public.dispatch_market_config;
create policy dispatch_market_config_auth_select on public.dispatch_market_config
  for select using (auth.uid() is not null);

-- ---------------------------------------------------------------------------
-- Job lifecycle timestamps on bookings (additive)
-- ---------------------------------------------------------------------------

alter table public.bookings
  add column if not exists offered_at timestamptz,
  add column if not exists assigned_at timestamptz,
  add column if not exists accepted_at timestamptz,
  add column if not exists en_route_at timestamptz,
  add column if not exists arrived_at timestamptz,
  add column if not exists started_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists dispatch_mode text
    check (dispatch_mode is null or dispatch_mode in ('DIRECT', 'BATCH', 'ADMIN'));

-- ---------------------------------------------------------------------------
-- Dispatch exceptions → admin review (never auto-punish)
-- ---------------------------------------------------------------------------

create table if not exists public.dispatch_exceptions (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete set null,
  cleaner_id uuid references public.cleaners(id) on delete set null,
  exception_type text not null check (exception_type in (
    'no_show',
    'late',
    'cancel_late',
    'offer_timeout',
    'double_accept_race',
    'location_anomaly',
    'customer_complaint',
    'safety',
    'other'
  )),
  severity text not null default 'medium'
    check (severity in ('low', 'medium', 'high', 'critical')),
  status text not null default 'open'
    check (status in ('open', 'under_review', 'resolved', 'dismissed')),
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.users(id) on delete set null,
  reviewed_by uuid references public.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dispatch_exceptions_open_idx
  on public.dispatch_exceptions (status, severity, created_at desc)
  where status in ('open', 'under_review');

create index if not exists dispatch_exceptions_booking_idx
  on public.dispatch_exceptions (booking_id, created_at desc);

drop trigger if exists dispatch_exceptions_set_updated_at on public.dispatch_exceptions;
create trigger dispatch_exceptions_set_updated_at
before update on public.dispatch_exceptions
for each row execute function public.set_updated_at();

alter table public.dispatch_exceptions enable row level security;

drop policy if exists dispatch_exceptions_admin on public.dispatch_exceptions;
create policy dispatch_exceptions_admin on public.dispatch_exceptions
  for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------------
-- Fraud / abuse flags for manual review (no auto-ban)
-- ---------------------------------------------------------------------------

create table if not exists public.fraud_review_flags (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null check (subject_type in ('user', 'cleaner', 'booking', 'payment')),
  subject_id text not null,
  flag_code text not null,
  severity text not null default 'medium'
    check (severity in ('low', 'medium', 'high', 'critical')),
  status text not null default 'open'
    check (status in ('open', 'under_review', 'resolved', 'dismissed')),
  decision text check (decision is null or decision in ('allow', 'review', 'block')),
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.users(id) on delete set null,
  reviewed_by uuid references public.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists fraud_review_flags_open_idx
  on public.fraud_review_flags (status, severity, created_at desc)
  where status in ('open', 'under_review');

drop trigger if exists fraud_review_flags_set_updated_at on public.fraud_review_flags;
create trigger fraud_review_flags_set_updated_at
before update on public.fraud_review_flags
for each row execute function public.set_updated_at();

alter table public.fraud_review_flags enable row level security;

drop policy if exists fraud_review_flags_admin on public.fraud_review_flags;
create policy fraud_review_flags_admin on public.fraud_review_flags
  for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------------
-- One review per booking (abuse prevention)
-- ---------------------------------------------------------------------------

create unique index if not exists reviews_one_per_booking
  on public.reviews (booking_id);

-- ---------------------------------------------------------------------------
-- Refresh professionals view with Cleaner Platform V1 columns
-- (DROP required — CREATE OR REPLACE cannot reorder/rename view columns)
-- ---------------------------------------------------------------------------

drop view if exists public.professionals cascade;

create view public.professionals
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
    id, user_id, bio, years_experience, service_radius_km,
    is_verified, is_active, rating_average, rating_count,
    onboarding_status, onboarding_checklist, is_online, last_online_at,
    stripe_connect_status, stripe_connect_id, market_id, languages, transportation,
    agreements_accepted_at, onboarding_submitted_at, onboarding_reviewed_at, rejection_reason,
    platform_stage, identity_status, background_status,
    phone_verified_at, email_verified_at, training_completed_at, assessment_passed_at,
    activated_at, trust_score, reliability_score, serious_flag_count, requires_admin_review,
    application, application_submitted_at, maidlinx_verified, verified_at,
    created_at, updated_at
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

create trigger professionals_view_insert
instead of insert on public.professionals
for each row execute function public.professionals_view_insert();

create trigger professionals_view_update
instead of update on public.professionals
for each row execute function public.professionals_view_update();

comment on view public.professionals is
  'Compat view over cleaners. Includes Pro onboarding + Cleaner Platform V1 trust/verification fields.';
