-- Production backend hardening:
-- stripe webhook idempotency, authoritative quotes, notification outbox,
-- recurring stubs, payouts ledger, service addons, booking idempotency,
-- cleaner role signup, guest claim support columns.

-- ---------------------------------------------------------------------------
-- 1. Stripe webhook event dedup (never process same event twice)
-- ---------------------------------------------------------------------------

create table if not exists public.stripe_webhook_events (
  id text primary key, -- Stripe event.id
  event_type text not null,
  booking_id uuid references public.bookings(id) on delete set null,
  processed_at timestamptz not null default now(),
  payload_summary jsonb not null default '{}'::jsonb
);

create index if not exists stripe_webhook_events_type_idx
  on public.stripe_webhook_events (event_type, processed_at desc);

-- ---------------------------------------------------------------------------
-- 2. Authoritative quotes (server-issued, expire, optional promo)
-- ---------------------------------------------------------------------------

create table if not exists public.booking_quotes (
  id uuid primary key default gen_random_uuid(),
  quote_token text not null unique,
  market_id text,
  currency text not null check (currency in ('USD', 'CAD')),
  service_type text not null,
  input_snapshot jsonb not null default '{}'::jsonb,
  breakdown jsonb not null default '{}'::jsonb,
  subtotal_cents integer not null check (subtotal_cents >= 0),
  platform_fee_cents integer not null check (platform_fee_cents >= 0),
  discount_cents integer not null default 0 check (discount_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  coupon_code text,
  estimated_duration_minutes integer,
  expires_at timestamptz not null,
  consumed_by_booking_id uuid references public.bookings(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists booking_quotes_expires_idx
  on public.booking_quotes (expires_at);

alter table public.bookings
  add column if not exists quote_id uuid references public.booking_quotes(id) on delete set null,
  add column if not exists coupon_code text,
  add column if not exists idempotency_key text;

create unique index if not exists bookings_idempotency_key_unique
  on public.bookings (idempotency_key)
  where idempotency_key is not null;

-- ---------------------------------------------------------------------------
-- 3. Notification outbox (queue — providers may be log-only)
-- ---------------------------------------------------------------------------

create table if not exists public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('email', 'sms', 'push', 'in_app')),
  recipient text not null,
  subject text,
  body text not null,
  template_key text,
  booking_id uuid references public.bookings(id) on delete set null,
  profile_id uuid references public.users(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'sent', 'failed', 'skipped')),
  provider text,
  provider_message_id text,
  attempts integer not null default 0 check (attempts >= 0),
  last_error text,
  scheduled_for timestamptz not null default now(),
  sent_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notification_outbox_pending_idx
  on public.notification_outbox (status, scheduled_for)
  where status in ('pending', 'failed');

create trigger notification_outbox_set_updated_at
before update on public.notification_outbox
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. Service addons catalog (booking_extras rows reference these)
-- ---------------------------------------------------------------------------

create table if not exists public.service_addons (
  id text primary key,
  label text not null,
  description text,
  price_cents integer not null check (price_cents >= 0),
  duration_minutes integer not null default 0 check (duration_minutes >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger service_addons_set_updated_at
before update on public.service_addons
for each row execute function public.set_updated_at();

insert into public.service_addons (id, label, description, price_cents, duration_minutes, sort_order)
values
  ('inside_fridge', 'Inside fridge', 'Clean interior of refrigerator', 2500, 20, 1),
  ('inside_oven', 'Inside oven', 'Clean interior of oven', 2500, 20, 2),
  ('inside_cabinets', 'Inside cabinets', 'Wipe cabinet interiors', 3000, 25, 3),
  ('laundry', 'Laundry', 'Wash and fold one load', 3500, 45, 4),
  ('windows', 'Interior windows', 'Interior window cleaning', 4000, 30, 5),
  ('garage', 'Garage', 'Sweep and tidy garage', 4500, 40, 6),
  ('patio', 'Patio', 'Sweep patio / balcony', 3000, 25, 7)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 5. Payouts ledger (cleaner earnings ≠ customer total)
-- ---------------------------------------------------------------------------

create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  cleaner_id uuid not null references public.cleaners(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null check (currency in ('USD', 'CAD')),
  platform_fee_cents integer not null default 0 check (platform_fee_cents >= 0),
  customer_total_cents integer,
  status text not null default 'pending'
    check (status in ('pending', 'scheduled', 'paid', 'failed', 'cancelled')),
  stripe_transfer_id text,
  stripe_payout_id text,
  period_start timestamptz,
  period_end timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payouts_cleaner_idx on public.payouts (cleaner_id, status);
create index if not exists payouts_booking_idx on public.payouts (booking_id);

create trigger payouts_set_updated_at
before update on public.payouts
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 6. Recurring architecture (stubs — generation deferred)
-- ---------------------------------------------------------------------------

create table if not exists public.recurring_plans (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.users(id) on delete set null,
  customer_email text,
  address_snapshot jsonb not null default '{}'::jsonb,
  service_type text not null,
  extras text[] not null default '{}',
  frequency text not null check (frequency in ('weekly', 'biweekly', 'monthly')),
  preferred_arrival_window text,
  preferred_day_of_week integer check (preferred_day_of_week between 0 and 6),
  market_id text,
  currency text not null default 'USD' check (currency in ('USD', 'CAD')),
  status text not null default 'active'
    check (status in ('active', 'paused', 'cancelled')),
  next_occurrence_date date,
  source_booking_id uuid references public.bookings(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recurring_occurrences (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.recurring_plans(id) on delete cascade,
  occurrence_date date not null,
  booking_id uuid references public.bookings(id) on delete set null,
  status text not null default 'planned'
    check (status in ('planned', 'generated', 'skipped', 'failed', 'cancelled')),
  generated_at timestamptz,
  error text,
  created_at timestamptz not null default now(),
  unique (plan_id, occurrence_date)
);

create index if not exists recurring_plans_customer_idx
  on public.recurring_plans (customer_id, status);

create trigger recurring_plans_set_updated_at
before update on public.recurring_plans
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 7. Guest claim audit + coupon redemption tracking
-- ---------------------------------------------------------------------------

alter table public.coupons
  add column if not exists market_id text,
  add column if not exists currency text;

create table if not exists public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  customer_id uuid references public.users(id) on delete set null,
  discount_cents integer not null check (discount_cents >= 0),
  created_at timestamptz not null default now(),
  unique (booking_id)
);

create table if not exists public.guest_booking_claims (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  claimed_by uuid not null references public.users(id) on delete cascade,
  guest_email text not null,
  created_at timestamptz not null default now(),
  unique (booking_id)
);

-- ---------------------------------------------------------------------------
-- 8. handle_new_user: respect cleaner role metadata + create cleaner row
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  bootstrap_email text := current_setting('app.admin_bootstrap_email', true);
  meta_role text := lower(coalesce(new.raw_user_meta_data ->> 'role', 'customer'));
  assigned_role public.user_role := 'customer';
begin
  if bootstrap_email is not null
     and lower(new.email) = lower(bootstrap_email) then
    assigned_role := 'admin';
  elsif meta_role in ('cleaner', 'professional') then
    assigned_role := 'cleaner';
  elsif meta_role = 'admin' then
    -- Never self-elevate to admin via metadata; only bootstrap email.
    assigned_role := 'customer';
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

  -- Safe guest association: claim prior guest bookings matching verified email.
  if new.email is not null and assigned_role in ('customer', 'admin') then
    update public.bookings
    set customer_id = new.id
    where customer_id is null
      and lower(customer_email) = lower(new.email);

    insert into public.guest_booking_claims (booking_id, claimed_by, guest_email)
    select b.id, new.id, lower(new.email)
    from public.bookings b
    where b.customer_id = new.id
      and lower(b.customer_email) = lower(new.email)
      and not exists (
        select 1 from public.guest_booking_claims g where g.booking_id = b.id
      )
    on conflict (booking_id) do nothing;
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 9. RLS for new tables (service role / admin APIs use service key)
-- ---------------------------------------------------------------------------

alter table public.stripe_webhook_events enable row level security;
alter table public.booking_quotes enable row level security;
alter table public.notification_outbox enable row level security;
alter table public.service_addons enable row level security;
alter table public.payouts enable row level security;
alter table public.recurring_plans enable row level security;
alter table public.recurring_occurrences enable row level security;
alter table public.coupon_redemptions enable row level security;
alter table public.guest_booking_claims enable row level security;

drop policy if exists service_addons_public_read on public.service_addons;
create policy service_addons_public_read on public.service_addons
  for select using (is_active = true);

drop policy if exists reviews_select_participant on public.reviews;
create policy reviews_select_participant on public.reviews
  for select using (
    reviewer_id = auth.uid()
    or reviewee_id = auth.uid()
    or exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );
