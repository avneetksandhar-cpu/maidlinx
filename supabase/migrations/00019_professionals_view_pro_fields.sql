-- Expose Cleaner Pro foundation columns through the legacy professionals view
-- so app code using .from("professionals") can read/write onboarding, presence,
-- and Stripe Connect status without duplicating tables.

create or replace view public.professionals as
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
    updated_at = now()
  where id = old.id;
  return new;
end;
$$;

drop trigger if exists professionals_view_insert on public.professionals;
create trigger professionals_view_insert
  instead of insert on public.professionals
  for each row execute function public.professionals_view_insert();

drop trigger if exists professionals_view_update on public.professionals;
create trigger professionals_view_update
  instead of update on public.professionals
  for each row execute function public.professionals_view_update();

comment on view public.professionals is
  'Compat view over cleaners. Includes Pro onboarding / presence / Connect fields.';
