-- Ensure cleaner signup metadata is honored (Uber-driver-style applicant bootstrap).
-- Admin remains bootstrap-email only. Cleaner applicants stay inactive/unverified.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  bootstrap_email text := current_setting('app.admin_bootstrap_email', true);
  meta_role text := lower(coalesce(new.raw_user_meta_data ->> 'role', ''));
  assigned_role public.user_role := 'customer';
begin
  if bootstrap_email is not null
     and new.email is not null
     and lower(new.email) = lower(bootstrap_email) then
    assigned_role := 'admin';
  elsif meta_role in ('cleaner', 'professional') then
    assigned_role := 'cleaner';
  else
    assigned_role := 'customer';
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
        first_name = coalesce(public.users.first_name, excluded.first_name),
        last_name = coalesce(public.users.last_name, excluded.last_name),
        role = case
          when public.users.role = 'admin' then public.users.role
          when assigned_role = 'admin' then 'admin'::public.user_role
          when assigned_role = 'cleaner' and public.users.role = 'customer' then 'cleaner'::public.user_role
          else public.users.role
        end,
        updated_at = now();

  if assigned_role = 'customer' or assigned_role = 'admin' then
    insert into public.customers (user_id)
    values (new.id)
    on conflict (user_id) do nothing;
  end if;

  if assigned_role = 'cleaner' then
    insert into public.cleaners (user_id, is_active, is_verified)
    values (new.id, false, false)
    on conflict (user_id) do nothing;
  end if;

  insert into public.notification_preferences (profile_id)
  values (new.id)
  on conflict (profile_id) do nothing;

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Creates public.users (+ customers/cleaners). Admin only via app.admin_bootstrap_email; cleaner via signup metadata. Applicants are never auto-verified.';

-- Refresh professionals compat view so platform columns are visible (fixes stale schema cache).
-- App signup/application paths write public.cleaners directly; this keeps /professionals callers working.
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

-- CASCADE drops INSTEAD OF triggers; recreate so .from("professionals") writes still work.
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
  'Compat view over cleaners including Cleaner Platform V1 fields. Signup/application prefer cleaners table.';
