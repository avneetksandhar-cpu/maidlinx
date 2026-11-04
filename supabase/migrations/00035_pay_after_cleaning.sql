-- Pay-after-cleaning (Stripe TEST): save card at request, charge agreed total on complete.
-- Stripe LIVE remains OFF by product gate; columns support SetupIntent + off-session charge.

alter table public.bookings
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_setup_intent_id text,
  add column if not exists stripe_payment_method_id text,
  add column if not exists card_brand text,
  add column if not exists card_last4 text;

comment on column public.bookings.stripe_customer_id is
  'Stripe Customer created at request checkout (SetupIntent).';
comment on column public.bookings.stripe_setup_intent_id is
  'Stripe SetupIntent used to save the payment method without charging.';
comment on column public.bookings.stripe_payment_method_id is
  'Saved PaymentMethod charged once when the clean completes.';
comment on column public.bookings.card_brand is
  'Display-only card brand from the saved PaymentMethod (e.g. visa).';
comment on column public.bookings.card_last4 is
  'Display-only last4 from the saved PaymentMethod.';

create index if not exists bookings_stripe_setup_intent_idx
  on public.bookings (stripe_setup_intent_id)
  where stripe_setup_intent_id is not null;

create index if not exists bookings_stripe_payment_method_idx
  on public.bookings (stripe_payment_method_id)
  where stripe_payment_method_id is not null;
