-- Persist checkout Terms/Privacy consent on bookings (Launch Gate P0).
alter table public.bookings
  add column if not exists legal_consent_accepted_at timestamptz,
  add column if not exists legal_consent_policy_version text;

comment on column public.bookings.legal_consent_accepted_at is
  'When the customer accepted Terms/Privacy (and linked policies) at checkout.';
comment on column public.bookings.legal_consent_policy_version is
  'Policy version identifier accepted at checkout (see LEGAL_CONSENT_POLICY_VERSION).';
