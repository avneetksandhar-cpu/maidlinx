-- Align booking_status with marketplace lifecycle:
-- draft → pending_payment → confirmed → awaiting_assignment → offered → assigned → accepted
--   → on_the_way → arrived → in_progress → completed | cancelled
-- Migrates: awaiting_cleaner → awaiting_assignment, cleaner_on_way → on_the_way, cleaner_arrived → arrived

create type public.booking_status_marketplace as enum (
  'draft',
  'pending_payment',
  'confirmed',
  'awaiting_assignment',
  'offered',
  'assigned',
  'accepted',
  'on_the_way',
  'arrived',
  'in_progress',
  'completed',
  'cancelled'
);

alter table public.bookings alter column status drop default;

alter table public.bookings
  alter column status type public.booking_status_marketplace
  using (
    case status::text
      when 'draft' then 'draft'
      when 'pending_payment' then 'pending_payment'
      when 'pending' then 'pending_payment'
      when 'confirmed' then 'confirmed'
      when 'awaiting_cleaner' then 'awaiting_assignment'
      when 'awaiting_assignment' then 'awaiting_assignment'
      when 'offered' then 'offered'
      when 'assigned' then 'assigned'
      when 'accepted' then 'accepted'
      when 'cleaner_on_way' then 'on_the_way'
      when 'on_the_way' then 'on_the_way'
      when 'cleaner_arrived' then 'arrived'
      when 'arrived' then 'arrived'
      when 'in_progress' then 'in_progress'
      when 'completed' then 'completed'
      when 'cancelled' then 'cancelled'
      when 'refunded' then 'cancelled'
      else 'pending_payment'
    end::public.booking_status_marketplace
  );

alter table public.job_status_history
  alter column from_status type public.booking_status_marketplace
  using (
    case from_status::text
      when 'draft' then 'draft'
      when 'pending_payment' then 'pending_payment'
      when 'pending' then 'pending_payment'
      when 'confirmed' then 'confirmed'
      when 'awaiting_cleaner' then 'awaiting_assignment'
      when 'awaiting_assignment' then 'awaiting_assignment'
      when 'offered' then 'offered'
      when 'assigned' then 'assigned'
      when 'accepted' then 'accepted'
      when 'cleaner_on_way' then 'on_the_way'
      when 'on_the_way' then 'on_the_way'
      when 'cleaner_arrived' then 'arrived'
      when 'arrived' then 'arrived'
      when 'in_progress' then 'in_progress'
      when 'completed' then 'completed'
      when 'cancelled' then 'cancelled'
      when 'refunded' then 'cancelled'
      else null
    end::public.booking_status_marketplace
  );

alter table public.job_status_history
  alter column to_status type public.booking_status_marketplace
  using (
    case to_status::text
      when 'draft' then 'draft'
      when 'pending_payment' then 'pending_payment'
      when 'pending' then 'pending_payment'
      when 'confirmed' then 'confirmed'
      when 'awaiting_cleaner' then 'awaiting_assignment'
      when 'awaiting_assignment' then 'awaiting_assignment'
      when 'offered' then 'offered'
      when 'assigned' then 'assigned'
      when 'accepted' then 'accepted'
      when 'cleaner_on_way' then 'on_the_way'
      when 'on_the_way' then 'on_the_way'
      when 'cleaner_arrived' then 'arrived'
      when 'arrived' then 'arrived'
      when 'in_progress' then 'in_progress'
      when 'completed' then 'completed'
      when 'cancelled' then 'cancelled'
      when 'refunded' then 'cancelled'
      else 'pending_payment'
    end::public.booking_status_marketplace
  );

drop type public.booking_status;
alter type public.booking_status_marketplace rename to booking_status;

alter table public.bookings
  alter column status set default 'pending_payment';

create or replace function public.generate_invoice_number()
returns trigger
language plpgsql
as $$
begin
  if new.invoice_number is null and new.status in (
    'confirmed',
    'awaiting_assignment',
    'offered',
    'assigned',
    'accepted',
    'on_the_way',
    'arrived',
    'in_progress',
    'completed'
  ) then
    new.invoice_number := 'MLX-' || upper(substr(replace(new.id::text, '-', ''), 1, 8));
  end if;
  return new;
end;
$$;
