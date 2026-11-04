-- B2B commercial first working release (South Florida).
-- Additive. Stripe LIVE stays OFF. RLS deny-all on new tables (service-role + app ACL).
-- Reuses addresses as sites and bookings as visits.

-- ---------------------------------------------------------------------------
-- 1. Business accounts + memberships (tenant ACL)
-- ---------------------------------------------------------------------------

create table if not exists public.business_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid not null references public.users(id) on delete restrict,
  status text not null default 'active'
    check (status in ('active', 'paused', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists business_accounts_owner_idx
  on public.business_accounts (owner_user_id);

create table if not exists public.business_memberships (
  id uuid primary key default gen_random_uuid(),
  business_account_id uuid not null references public.business_accounts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'manager'
    check (role in ('owner', 'manager', 'billing', 'viewer')),
  status text not null default 'active'
    check (status in ('active', 'invited', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_account_id, user_id)
);

create index if not exists business_memberships_user_idx
  on public.business_memberships (user_id, status);

-- ---------------------------------------------------------------------------
-- 2. Site extras on addresses (commercial property metadata)
-- ---------------------------------------------------------------------------

alter table public.addresses
  add column if not exists formatted_address text,
  add column if not exists google_place_id text,
  add column if not exists business_account_id uuid references public.business_accounts(id) on delete set null,
  add column if not exists property_type text
    check (property_type is null or property_type in (
      'office', 'medical', 'retail', 'industrial', 'other'
    )),
  add column if not exists square_footage integer
    check (square_footage is null or square_footage >= 0),
  add column if not exists site_contact text,
  add column if not exists access_notes text;

create index if not exists addresses_business_account_idx
  on public.addresses (business_account_id)
  where business_account_id is not null;

-- ---------------------------------------------------------------------------
-- 3. Server-persisted commercial site scopes
-- ---------------------------------------------------------------------------

create table if not exists public.commercial_site_scopes (
  id uuid primary key default gen_random_uuid(),
  site_address_id uuid not null references public.addresses(id) on delete cascade,
  business_account_id uuid not null references public.business_accounts(id) on delete cascade,
  areas text[] not null default '{}'::text[],
  frequency text not null default 'weekly'
    check (frequency in ('one_time', 'weekly', 'biweekly', 'monthly', 'custom')),
  service_days text[] not null default '{}'::text[],
  service_window text,
  start_date date,
  square_footage integer check (square_footage is null or square_footage >= 0),
  site_contact text,
  access_notes text,
  summary_plain text,
  version integer not null default 1 check (version >= 1),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_address_id)
);

create index if not exists commercial_site_scopes_business_idx
  on public.commercial_site_scopes (business_account_id);

-- ---------------------------------------------------------------------------
-- 4. Provider proposals → one service order on approval
-- ---------------------------------------------------------------------------

create table if not exists public.commercial_proposals (
  id uuid primary key default gen_random_uuid(),
  business_account_id uuid not null references public.business_accounts(id) on delete cascade,
  site_address_id uuid not null references public.addresses(id) on delete cascade,
  scope_id uuid references public.commercial_site_scopes(id) on delete set null,
  provider_cleaner_id uuid references public.cleaners(id) on delete set null,
  provider_user_id uuid references public.users(id) on delete set null,
  provider_name text,
  status text not null default 'sent'
    check (status in (
      'draft', 'sent', 'awaiting_approval', 'approved', 'rejected', 'superseded', 'withdrawn'
    )),
  inclusions text,
  exclusions text,
  client_price_cents integer not null check (client_price_cents >= 0),
  provider_payout_cents integer not null check (provider_payout_cents >= 0),
  frequency text not null default 'weekly'
    check (frequency in ('one_time', 'weekly', 'biweekly', 'monthly', 'custom')),
  billing_cadence text not null default 'monthly'
    check (billing_cadence in ('per_visit', 'monthly', 'net15', 'net30')),
  first_visit_date date,
  due_now_cents integer not null default 0 check (due_now_cents >= 0),
  payment_expected text not null default 'after_first_visit',
  scope_snapshot jsonb not null default '{}'::jsonb,
  walkthrough_requested boolean not null default false,
  idempotency_key text,
  approved_at timestamptz,
  approved_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint commercial_proposals_payout_lte_price
    check (provider_payout_cents <= client_price_cents)
);

create unique index if not exists commercial_proposals_idempotency_uidx
  on public.commercial_proposals (idempotency_key)
  where idempotency_key is not null;

create index if not exists commercial_proposals_buyer_status_idx
  on public.commercial_proposals (business_account_id, status, updated_at desc);

create index if not exists commercial_proposals_provider_idx
  on public.commercial_proposals (provider_cleaner_id, status);

create table if not exists public.service_orders (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null unique references public.commercial_proposals(id) on delete restrict,
  business_account_id uuid not null references public.business_accounts(id) on delete cascade,
  site_address_id uuid not null references public.addresses(id) on delete cascade,
  provider_cleaner_id uuid references public.cleaners(id) on delete set null,
  crew_lead_user_id uuid references public.users(id) on delete set null,
  status text not null default 'active'
    check (status in ('active', 'paused', 'cancelled', 'completed')),
  client_price_cents integer not null check (client_price_cents >= 0),
  provider_payout_cents integer not null check (provider_payout_cents >= 0),
  variable_cost_cents integer not null default 0 check (variable_cost_cents >= 0),
  frequency text not null,
  billing_cadence text not null,
  scope_snapshot jsonb not null default '{}'::jsonb,
  agreed_checklist jsonb not null default '[]'::jsonb,
  next_visit_at timestamptz,
  cancelled_at timestamptz,
  cancel_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists service_orders_business_idx
  on public.service_orders (business_account_id, status);

create index if not exists service_orders_provider_idx
  on public.service_orders (provider_cleaner_id, status);

-- ---------------------------------------------------------------------------
-- 5. Booking / visit money + order link
-- ---------------------------------------------------------------------------

alter table public.bookings
  add column if not exists service_order_id uuid references public.service_orders(id) on delete set null,
  add column if not exists client_price_cents integer check (client_price_cents is null or client_price_cents >= 0),
  add column if not exists provider_payout_cents integer check (provider_payout_cents is null or provider_payout_cents >= 0),
  add column if not exists variable_cost_cents integer default 0 check (variable_cost_cents is null or variable_cost_cents >= 0);

create index if not exists bookings_service_order_idx
  on public.bookings (service_order_id)
  where service_order_id is not null;

-- ---------------------------------------------------------------------------
-- 6. Visit report items (completed / missed + reason)
-- ---------------------------------------------------------------------------

create table if not exists public.visit_report_items (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  checklist_item_id text not null,
  label text not null,
  result text not null
    check (result in ('completed', 'missed', 'not_applicable')),
  miss_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (booking_id, checklist_item_id),
  constraint visit_report_miss_reason_required
    check (result <> 'missed' or (miss_reason is not null and length(trim(miss_reason)) > 0))
);

create index if not exists visit_report_items_booking_idx
  on public.visit_report_items (booking_id);

create index if not exists visit_report_items_missed_idx
  on public.visit_report_items (booking_id)
  where result = 'missed';

-- ---------------------------------------------------------------------------
-- 7. Operations desk cases
-- ---------------------------------------------------------------------------

create table if not exists public.commercial_ops_cases (
  id uuid primary key default gen_random_uuid(),
  case_type text not null
    check (case_type in (
      'unfilled_visit', 'cancellation', 'missed_work', 'unpaid_invoice', 'payout_issue'
    )),
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'resolved')),
  business_account_id uuid references public.business_accounts(id) on delete set null,
  service_order_id uuid references public.service_orders(id) on delete set null,
  booking_id uuid references public.bookings(id) on delete set null,
  follow_up_owner_user_id uuid references public.users(id) on delete set null,
  summary text not null,
  resolution_notes text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists commercial_ops_cases_status_idx
  on public.commercial_ops_cases (status, case_type, updated_at desc);

-- ---------------------------------------------------------------------------
-- 8. Provider commercial setup snapshot (service area / specialties / hours)
-- ---------------------------------------------------------------------------

create table if not exists public.commercial_provider_profiles (
  cleaner_id uuid primary key references public.cleaners(id) on delete cascade,
  service_area text,
  specialties text[] not null default '{}'::text[],
  available_hours text,
  onboarding_complete boolean not null default false,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 9. RLS — deny-all for anon/authenticated; app uses service role + membership ACL
-- ---------------------------------------------------------------------------

alter table public.business_accounts enable row level security;
alter table public.business_memberships enable row level security;
alter table public.commercial_site_scopes enable row level security;
alter table public.commercial_proposals enable row level security;
alter table public.service_orders enable row level security;
alter table public.visit_report_items enable row level security;
alter table public.commercial_ops_cases enable row level security;
alter table public.commercial_provider_profiles enable row level security;

comment on table public.business_accounts is
  'B2B buyer org for commercial ACL. Business A cannot see Business B.';
comment on table public.commercial_proposals is
  'Provider proposals for a site scope. Approval creates exactly one service_order.';
comment on table public.service_orders is
  'Approved commercial service order with agreed client price and provider payout.';
comment on table public.visit_report_items is
  'Per-visit checklist outcomes; missed items require a reason before submit.';
comment on table public.commercial_ops_cases is
  'Operations desk queue: unfilled, cancellations, missed work, unpaid, payouts.';
