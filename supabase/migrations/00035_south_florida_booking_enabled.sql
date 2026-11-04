-- Founder 2026-11-04: South Florida covered addresses must be bookable.
-- Does NOT invent cleaners. Paid bookings enter awaiting_assignment ("Finding your cleaner").
-- launch_enabled stays false (ads closed). TORONTO_GTA stays booking_enabled=false.
-- Stripe LIVE remains OFF.

update public.markets
set booking_enabled = true
where id = 'SOUTH_FLORIDA';

-- Explicit: keep GTA + ads closed
update public.markets
set booking_enabled = false, launch_enabled = false
where id = 'TORONTO_GTA';

update public.markets
set launch_enabled = false
where id = 'SOUTH_FLORIDA';
