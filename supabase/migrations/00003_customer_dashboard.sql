-- Customer dashboard support tables

create table if not exists public.customer_favorite_cleaners (
  id uuid primary key default gen_random_uuid(),
  customer_profile_id uuid not null references public.profiles(id) on delete cascade,
  professional_profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (customer_profile_id, professional_profile_id)
);

create table if not exists public.notification_preferences (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  email_booking_updates boolean not null default true,
  email_promotions boolean not null default false,
  sms_reminders boolean not null default true,
  push_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bookings
  add column if not exists professional_profile_id uuid references public.profiles(id) on delete set null,
  add column if not exists invoice_number text unique,
  add column if not exists stripe_receipt_url text,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancellation_reason text;

create index if not exists bookings_customer_email_idx on public.bookings (customer_email);
create index if not exists customer_favorite_cleaners_customer_idx
  on public.customer_favorite_cleaners (customer_profile_id);

create trigger notification_preferences_set_updated_at
before update on public.notification_preferences
for each row execute function public.set_updated_at();

create or replace function public.generate_invoice_number()
returns trigger
language plpgsql
as $$
begin
  if new.invoice_number is null and new.status in ('confirmed', 'completed', 'assigned', 'in_progress') then
    new.invoice_number := 'MLX-' || upper(substr(replace(new.id::text, '-', ''), 1, 8));
  end if;
  return new;
end;
$$;

drop trigger if exists bookings_generate_invoice_number on public.bookings;
create trigger bookings_generate_invoice_number
before insert or update on public.bookings
for each row execute function public.generate_invoice_number();
