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

comment on view public.professionals is
  'Compat view over cleaners including Cleaner Platform V1 fields. Signup/application prefer cleaners table.';
