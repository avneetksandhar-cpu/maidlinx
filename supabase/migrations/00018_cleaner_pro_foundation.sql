-- Cleaner / MaidLinx Pro foundation:
-- onboarding status machine, online presence, Stripe Connect status,
-- documents metadata, unavailable dates, weekly start/end times.
-- Additive only — does not rewrite booking_status or drop legacy columns.

-- ---------------------------------------------------------------------------
-- Cleaner onboarding + presence + Connect
-- ---------------------------------------------------------------------------

alter table public.cleaners
  add column if not exists onboarding_status text not null default 'NOT_STARTED'
    check (onboarding_status in (
      'NOT_STARTED',
      'IN_PROGRESS',
      'SUBMITTED',
      'UNDER_REVIEW',
      'APPROVED',
      'REJECTED',
      'SUSPENDED'
    )),
  add column if not exists onboarding_checklist jsonb not null default '{}'::jsonb,
  add column if not exists is_online boolean not null default false,
  add column if not exists last_online_at timestamptz,
  add column if not exists stripe_connect_status text not null default 'NOT_STARTED'
    check (stripe_connect_status in (
      'NOT_STARTED',
      'PENDING',
      'ENABLED',
      'RESTRICTED'
    )),
  add column if not exists market_id text references public.markets(id) on delete set null,
  add column if not exists languages text[] not null default '{}',
  add column if not exists transportation text,
  add column if not exists agreements_accepted_at timestamptz,
  add column if not exists onboarding_submitted_at timestamptz,
  add column if not exists onboarding_reviewed_at timestamptz,
  add column if not exists rejection_reason text;

-- Align existing verified/approved cleaners without inventing background checks.
update public.cleaners
set onboarding_status = 'APPROVED'
where onboarding_status = 'NOT_STARTED'
  and (coalesce(approved, false) = true or is_verified = true);

create index if not exists cleaners_onboarding_status_idx
  on public.cleaners (onboarding_status);

create index if not exists cleaners_online_market_idx
  on public.cleaners (is_online, market_id)
  where is_online = true and onboarding_status = 'APPROVED';

-- ---------------------------------------------------------------------------
-- Document metadata (file bytes live in storage; never expose privately to public)
-- ---------------------------------------------------------------------------

create table if not exists public.cleaner_documents (
  id uuid primary key default gen_random_uuid(),
  cleaner_id uuid not null references public.cleaners(id) on delete cascade,
  doc_type text not null check (doc_type in (
    'id_front',
    'id_back',
    'selfie',
    'work_auth',
    'insurance',
    'other'
  )),
  storage_path text not null,
  file_name text,
  mime_type text,
  status text not null default 'uploaded'
    check (status in ('uploaded', 'under_review', 'accepted', 'rejected')),
  rejection_reason text,
  reviewed_by uuid references public.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cleaner_documents_cleaner_idx
  on public.cleaner_documents (cleaner_id, doc_type);

create trigger cleaner_documents_set_updated_at
before update on public.cleaner_documents
for each row execute function public.set_updated_at();

alter table public.cleaner_documents enable row level security;

drop policy if exists cleaner_documents_owner_select on public.cleaner_documents;
create policy cleaner_documents_owner_select on public.cleaner_documents
  for select using (
    exists (
      select 1 from public.cleaners c
      where c.id = cleaner_documents.cleaner_id
        and (
          c.user_id = auth.uid()
          or exists (
            select 1 from public.users u
            where u.id = auth.uid() and u.role = 'admin'
          )
        )
    )
  );

-- ---------------------------------------------------------------------------
-- Unavailable dates (blocks matching on specific calendar days)
-- ---------------------------------------------------------------------------

create table if not exists public.cleaner_unavailable_dates (
  id uuid primary key default gen_random_uuid(),
  cleaner_id uuid not null references public.cleaners(id) on delete cascade,
  unavailable_date date not null,
  reason text,
  created_at timestamptz not null default now(),
  unique (cleaner_id, unavailable_date)
);

create index if not exists cleaner_unavailable_dates_cleaner_idx
  on public.cleaner_unavailable_dates (cleaner_id, unavailable_date);

alter table public.cleaner_unavailable_dates enable row level security;

drop policy if exists cleaner_unavailable_owner_all on public.cleaner_unavailable_dates;
create policy cleaner_unavailable_owner_select on public.cleaner_unavailable_dates
  for select using (
    exists (
      select 1 from public.cleaners c
      where c.id = cleaner_unavailable_dates.cleaner_id
        and (
          c.user_id = auth.uid()
          or exists (
            select 1 from public.users u
            where u.id = auth.uid() and u.role = 'admin'
          )
        )
    )
  );

-- ---------------------------------------------------------------------------
-- Optional clock times on weekly availability windows (additive)
-- ---------------------------------------------------------------------------

alter table public.professional_availability
  add column if not exists start_time time,
  add column if not exists end_time time;

comment on column public.cleaners.onboarding_status is
  'Pro application lifecycle. APPROVED is ops approval — not a background-check claim.';

comment on column public.cleaners.is_verified is
  'Legacy ops flag. Do not surface as background-checked without a real vendor integration.';

comment on column public.cleaners.stripe_connect_status is
  'Stripe Connect Express/Custom account state. Bank details never collected in-app.';
