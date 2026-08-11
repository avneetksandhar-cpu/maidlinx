-- Append-only booking event log (no sensitive payment payloads).

create table if not exists public.booking_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  actor_id uuid references public.users(id) on delete set null,
  actor_role text,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists booking_events_booking_id_idx
  on public.booking_events (booking_id, created_at desc);

create index if not exists booking_events_type_idx
  on public.booking_events (event_type);

-- No UPDATE/DELETE for app roles — append-only via service role inserts.
alter table public.booking_events enable row level security;

drop policy if exists booking_events_admin_read on public.booking_events;
create policy booking_events_admin_read on public.booking_events
  for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

drop policy if exists booking_events_customer_read on public.booking_events;
create policy booking_events_customer_read on public.booking_events
  for select
  using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id and b.customer_id = auth.uid()
    )
  );

comment on table public.booking_events is
  'Append-only booking lifecycle events. Never store card numbers, full PI secrets, or raw Stripe payloads.';
