-- Match Engine V1: offers + concurrency guards
-- Booking events table is owned by 00012_booking_events.sql (Phase 1).

-- ---------------------------------------------------------------------------
-- Assignment source extensions
-- ---------------------------------------------------------------------------

alter type public.cleaner_assignment_source add value if not exists 'offer_accept';
alter type public.cleaner_assignment_source add value if not exists 'admin_reassign';

-- One active assignment per booking (prevents double-accept races).
create unique index if not exists cleaner_assignments_one_active_per_booking
  on public.cleaner_assignments (booking_id)
  where status = 'active';

-- ---------------------------------------------------------------------------
-- Extend booking_events for Phase 2 column aliases (non-breaking)
-- ---------------------------------------------------------------------------

alter table public.booking_events
  add column if not exists actor_type text,
  add column if not exists payload jsonb;

-- ---------------------------------------------------------------------------
-- Booking offers (ranked candidate → offer → accept)
-- ---------------------------------------------------------------------------

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
          or exists (
            select 1 from public.users u
            where u.id = auth.uid() and u.role = 'admin'
          )
        )
    )
  );
