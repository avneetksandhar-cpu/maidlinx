-- Phase 5: Support issues for ops queues (customer issue, re-clean, etc.)

create table if not exists public.support_issues (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete set null,
  customer_profile_id uuid references public.profiles(id) on delete set null,
  cleaner_profile_id uuid references public.profiles(id) on delete set null,
  issue_type text not null check (
    issue_type in (
      'customer_issue',
      're_clean_request',
      'payment_issue',
      'cancellation',
      'cleaner_late',
      'other'
    )
  ),
  subject text not null,
  description text,
  status text not null default 'open' check (
    status in ('open', 'investigating', 'resolved', 'closed')
  ),
  priority text not null default 'normal' check (
    priority in ('low', 'normal', 'high', 'urgent')
  ),
  assigned_admin_id uuid references public.profiles(id) on delete set null,
  resolution text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_issues_status_idx on public.support_issues (status);
create index if not exists support_issues_type_idx on public.support_issues (issue_type);
create index if not exists support_issues_booking_id_idx on public.support_issues (booking_id);

drop trigger if exists support_issues_set_updated_at on public.support_issues;
create trigger support_issues_set_updated_at
before update on public.support_issues
for each row execute function public.set_updated_at();

alter table public.support_issues enable row level security;

drop policy if exists support_issues_admin_read on public.support_issues;
create policy support_issues_admin_read on public.support_issues
  for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );
