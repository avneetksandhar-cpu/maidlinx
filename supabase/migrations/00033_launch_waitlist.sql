-- Launch email waitlist for markets that are geo-ready but booking_enabled=false,
-- and for out-of-area customers who want launch notifications.
-- Public may INSERT only; no public SELECT of others' emails. Admin/owner read via is_admin().

create table if not exists public.launch_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text,
  market_id text references public.markets(id) on delete set null,
  source text,
  page text,
  created_at timestamptz not null default now(),
  constraint launch_waitlist_email_len check (
    char_length(trim(email)) between 3 and 320
  ),
  constraint launch_waitlist_name_len check (
    name is null or char_length(name) <= 200
  ),
  constraint launch_waitlist_source_len check (
    source is null or char_length(source) <= 80
  ),
  constraint launch_waitlist_page_len check (
    page is null or char_length(page) <= 200
  )
);

comment on table public.launch_waitlist is
  'Customer launch-notification emails. Captured when booking is unavailable or out of area.';

create unique index if not exists launch_waitlist_email_lower_uidx
  on public.launch_waitlist (lower(trim(email)));

create index if not exists launch_waitlist_created_at_idx
  on public.launch_waitlist (created_at desc);

create index if not exists launch_waitlist_market_id_idx
  on public.launch_waitlist (market_id);

alter table public.launch_waitlist enable row level security;

-- Anonymous / authenticated visitors may join the waitlist (insert-only).
drop policy if exists launch_waitlist_public_insert on public.launch_waitlist;
create policy launch_waitlist_public_insert on public.launch_waitlist
  for insert
  to anon, authenticated
  with check (
    email is not null
    and char_length(trim(email)) between 3 and 320
  );

-- No public read — only admins (and service role used by server APIs).
drop policy if exists launch_waitlist_admin_select on public.launch_waitlist;
create policy launch_waitlist_admin_select on public.launch_waitlist
  for select
  using (public.is_admin());

-- Admins may delete spam / test rows; no public update/delete.
drop policy if exists launch_waitlist_admin_delete on public.launch_waitlist;
create policy launch_waitlist_admin_delete on public.launch_waitlist
  for delete
  using (public.is_admin());
