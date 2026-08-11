-- MVP booking_status alignment: exact lifecycle values + data migration

-- ---------------------------------------------------------------------------
-- Replace booking_status enum with MVP values
-- ---------------------------------------------------------------------------

create type public.booking_status_new as enum (
  'pending_payment',
  'confirmed',
  'awaiting_cleaner',
  'assigned',
  'cleaner_on_way',
  'cleaner_arrived',
  'in_progress',
  'completed',
  'cancelled'
);

alter table public.bookings alter column status drop default;

alter table public.bookings
  alter column status type public.booking_status_new
  using (
    case status::text
      when 'draft' then 'pending_payment'
      when 'pending' then 'pending_payment'
      when 'confirmed' then
        case
          when professional_profile_id is not null then 'assigned'
          else 'awaiting_cleaner'
        end
      when 'assigned' then 'assigned'
      when 'on_the_way' then 'cleaner_on_way'
      when 'in_progress' then 'in_progress'
      when 'completed' then 'completed'
      when 'cancelled' then 'cancelled'
      when 'refunded' then 'cancelled'
      else 'pending_payment'
    end::public.booking_status_new
  );

alter table public.job_status_history
  alter column from_status type public.booking_status_new
  using (
    case from_status::text
      when 'draft' then 'pending_payment'
      when 'pending' then 'pending_payment'
      when 'confirmed' then 'awaiting_cleaner'
      when 'assigned' then 'assigned'
      when 'on_the_way' then 'cleaner_on_way'
      when 'in_progress' then 'in_progress'
      when 'completed' then 'completed'
      when 'cancelled' then 'cancelled'
      when 'refunded' then 'cancelled'
      else null
    end::public.booking_status_new
  );

alter table public.job_status_history
  alter column to_status type public.booking_status_new
  using (
    case to_status::text
      when 'draft' then 'pending_payment'
      when 'pending' then 'pending_payment'
      when 'confirmed' then 'awaiting_cleaner'
      when 'assigned' then 'assigned'
      when 'on_the_way' then 'cleaner_on_way'
      when 'in_progress' then 'in_progress'
      when 'completed' then 'completed'
      when 'cancelled' then 'cancelled'
      when 'refunded' then 'cancelled'
      else 'pending_payment'
    end::public.booking_status_new
  );

drop type public.booking_status;
alter type public.booking_status_new rename to booking_status;

alter table public.bookings
  alter column status set default 'pending_payment';

-- ---------------------------------------------------------------------------
-- Invoice generation: paid / active lifecycle statuses
-- ---------------------------------------------------------------------------

create or replace function public.generate_invoice_number()
returns trigger
language plpgsql
as $$
begin
  if new.invoice_number is null and new.status in (
    'confirmed',
    'awaiting_cleaner',
    'assigned',
    'cleaner_on_way',
    'cleaner_arrived',
    'in_progress',
    'completed'
  ) then
    new.invoice_number := 'MLX-' || upper(substr(replace(new.id::text, '-', ''), 1, 8));
  end if;
  return new;
end;
$$;
