-- Repeat revenue foundation (additive only).
-- Referrals: codes + attributions; credits NOT live until Product + accounting approve.
-- Promo: per-customer usage limit.
-- Bookings: soft preferred cleaner + recurring preference (no Stripe auto-charge).
-- Retention: event queue architecture (providers may be log-only).

-- ---------------------------------------------------------------------------
-- 1. Promo: max uses per customer
-- ---------------------------------------------------------------------------

alter table public.coupons
  add column if not exists max_uses_per_customer integer
    check (max_uses_per_customer is null or max_uses_per_customer > 0);

-- ---------------------------------------------------------------------------
-- 2. Booking soft preference + recurring cadence (UI/architecture)
-- ---------------------------------------------------------------------------

alter table public.bookings
  add column if not exists preferred_cleaner_id uuid
    references public.cleaners(id) on delete set null,
  add column if not exists recurring_preference text
    check (
      recurring_preference is null
      or recurring_preference in ('one_time', 'weekly', 'biweekly', 'monthly')
    );

create index if not exists bookings_preferred_cleaner_idx
  on public.bookings (preferred_cleaner_id)
  where preferred_cleaner_id is not null;

comment on column public.bookings.preferred_cleaner_id is
  'Soft preference only — never a guarantee of assignment.';
comment on column public.bookings.recurring_preference is
  'Customer cadence preference. Auto-charge / occurrence generation is NOT implemented.';

-- Allow one_time on recurring_plans for explicit single-booking plans (optional).
-- Existing check is weekly|biweekly|monthly — leave as-is; one_time stays on bookings only.

-- ---------------------------------------------------------------------------
-- 3. Referral foundation (credits disabled by default)
-- ---------------------------------------------------------------------------

create table if not exists public.referral_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  owner_profile_id uuid not null references public.users(id) on delete cascade,
  give_cents integer not null default 0 check (give_cents >= 0),
  get_cents integer not null default 0 check (get_cents >= 0),
  is_active boolean not null default true,
  -- Credits must stay false until Product approves accounting.
  credits_live boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_profile_id)
);

create table if not exists public.referral_attributions (
  id uuid primary key default gen_random_uuid(),
  referral_code_id uuid not null references public.referral_codes(id) on delete cascade,
  referrer_profile_id uuid not null references public.users(id) on delete cascade,
  referee_profile_id uuid references public.users(id) on delete set null,
  referee_email text,
  booking_id uuid references public.bookings(id) on delete set null,
  status text not null default 'captured'
    check (status in ('captured', 'qualified', 'credited', 'rejected')),
  reject_reason text,
  -- Never auto-credit while credits_live is false on the code.
  credited_at timestamptz,
  created_at timestamptz not null default now(),
  unique (booking_id)
);

create unique index if not exists referral_attributions_referee_email_unique
  on public.referral_attributions (lower(referee_email))
  where referee_email is not null and status <> 'rejected';

create index if not exists referral_codes_owner_idx
  on public.referral_codes (owner_profile_id);

create trigger referral_codes_set_updated_at
before update on public.referral_codes
for each row execute function public.set_updated_at();

alter table public.referral_codes enable row level security;
alter table public.referral_attributions enable row level security;

drop policy if exists referral_codes_select_own on public.referral_codes;
create policy referral_codes_select_own on public.referral_codes
  for select using (owner_profile_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 4. Retention event queue (architecture — providers may be unset)
-- ---------------------------------------------------------------------------

create table if not exists public.retention_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null
    check (event_type in (
      'completed_thank_you',
      'review_request',
      'rebook_nudge',
      'upcoming_reminder',
      'abandoned_booking'
    )),
  booking_id uuid references public.bookings(id) on delete set null,
  profile_id uuid references public.users(id) on delete set null,
  recipient text,
  channel text not null default 'email'
    check (channel in ('email', 'sms', 'push', 'in_app')),
  status text not null default 'pending'
    check (status in ('pending', 'queued', 'sent', 'skipped', 'failed')),
  scheduled_for timestamptz not null default now(),
  sent_at timestamptz,
  skip_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists retention_events_pending_idx
  on public.retention_events (status, scheduled_for)
  where status in ('pending', 'failed');

alter table public.retention_events enable row level security;
