-- Miami beta marketplace: inventory, offers, request/quote/pay, support, audit.
-- Sprint 1 user_role enum is unchanged (member/partner/admin/owner).

DO $$ BEGIN
  CREATE TYPE event_discovery_status AS ENUM ('draft', 'discovery_ready', 'bookable', 'cancelled', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE offer_service_type AS ENUM ('guest_list', 'ticket', 'vip_table', 'concierge');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE spend_band AS ENUM ('band_500_1500', 'band_1500_5000', 'band_5000_plus');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE request_status AS ENUM (
    'submitted', 'under_review', 'routed', 'wingman_accepted', 'wingman_declined',
    'revised_terms', 'awaiting_customer', 'accepted', 'payment_pending', 'paid',
    'confirmed', 'completed', 'cancelled', 'refunded', 'disputed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE wingman_verification_status AS ENUM ('pending', 'verified', 'paused', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE application_status AS ENUM ('not_contacted', 'contacted', 'in_review', 'rejected', 'approved');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION app_is_operator() RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT app_role() IN ('admin', 'owner');
$$;

CREATE OR REPLACE FUNCTION app_is_product_admin() RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT app_role() = 'owner';
$$;

CREATE OR REPLACE FUNCTION app_is_wingman() RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT app_role() IN ('partner', 'admin', 'owner');
$$;

CREATE TABLE IF NOT EXISTS marketplace_settings (
  id text PRIMARY KEY DEFAULT 'default',
  min_booking_cents integer NOT NULL DEFAULT 50000,
  customer_fee_bps integer NOT NULL DEFAULT 0,
  supplier_commission_bps integer NOT NULL DEFAULT 0,
  stripe_mode text NOT NULL DEFAULT 'test',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT marketplace_settings_stripe_test CHECK (stripe_mode = 'test'),
  CONSTRAINT marketplace_settings_fees_nonneg CHECK (customer_fee_bps >= 0 AND supplier_commission_bps >= 0)
);

INSERT INTO marketplace_settings (id)
VALUES ('default')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS feature_flags (
  key text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  area text NOT NULL,
  official_url text,
  city text NOT NULL DEFAULT 'Miami',
  timezone text NOT NULL DEFAULT 'America/New_York',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id text NOT NULL UNIQUE,
  name text NOT NULL,
  venue_id uuid NOT NULL REFERENCES venues(id),
  starts_at timestamptz NOT NULL,
  local_date date NOT NULL,
  local_time_text text NOT NULL,
  timezone text NOT NULL DEFAULT 'America/New_York',
  area text NOT NULL,
  category text NOT NULL,
  age_requirement text NOT NULL,
  official_source_url text NOT NULL,
  source_verified_at timestamptz NOT NULL,
  discovery_status event_discovery_status NOT NULL DEFAULT 'draft',
  available_services text[] NOT NULL DEFAULT '{}',
  wingman_coverage text NOT NULL DEFAULT 'Unassigned',
  booking_status_note text NOT NULL DEFAULT 'Awaiting Wingman inventory',
  internal_notes text,
  cancelled_at timestamptz,
  expired_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS events_status_date_idx ON events (discovery_status, local_date);
CREATE INDEX IF NOT EXISTS events_venue_id_idx ON events (venue_id);

CREATE TABLE IF NOT EXISTS wingman_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_external_id text UNIQUE,
  user_id uuid REFERENCES auth_users(id) ON DELETE SET NULL,
  organization_name text NOT NULL,
  lead_type text,
  public_source text,
  public_contact text,
  likely_coverage text,
  verification_status application_status NOT NULL DEFAULT 'not_contacted',
  production_visible boolean NOT NULL DEFAULT false,
  owner_name text,
  next_action text,
  internal_notes text,
  consent_at timestamptz,
  identity_verified_at timestamptz,
  phone_verified_at timestamptz,
  email_verified_at timestamptz,
  inventory_authority_at timestamptz,
  agreement_signed_at timestamptz,
  payout_approved_at timestamptz,
  media_cleared_at timestamptz,
  policy_accepted_at timestamptz,
  test_booking_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT applications_never_public_by_default CHECK (production_visible = false OR verification_status = 'approved')
);

CREATE TABLE IF NOT EXISTS wingmen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth_users(id) ON DELETE SET NULL,
  application_id uuid REFERENCES wingman_applications(id) ON DELETE SET NULL,
  display_name text NOT NULL,
  photo_url text,
  areas text[] NOT NULL DEFAULT '{}',
  specialties text[] NOT NULL DEFAULT '{}',
  languages text[] NOT NULL DEFAULT '{}',
  response_window_minutes integer,
  biography text,
  verification_status wingman_verification_status NOT NULL DEFAULT 'pending',
  legal_name text,
  payout_details jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wingman_event_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  wingman_id uuid NOT NULL REFERENCES wingmen(id) ON DELETE CASCADE,
  service_type offer_service_type NOT NULL,
  table_package_name text,
  max_group_size integer,
  minimum_spend_cents integer,
  service_fee_cents integer NOT NULL,
  taxes_and_fees_cents integer NOT NULL DEFAULT 0,
  arrival_window text,
  dress_requirement text,
  age_requirement text,
  cancellation_terms text NOT NULL,
  inventory_quantity integer NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  operator_approved boolean NOT NULL DEFAULT false,
  bookable boolean NOT NULL DEFAULT false,
  terms text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS offers_event_bookable_idx ON wingman_event_offers (event_id, bookable);

CREATE TABLE IF NOT EXISTS booking_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  event_id uuid REFERENCES events(id) ON DELETE SET NULL,
  requested_wingman_id uuid REFERENCES wingmen(id) ON DELETE SET NULL,
  assigned_wingman_id uuid REFERENCES wingmen(id) ON DELETE SET NULL,
  source text NOT NULL,
  occasion text NOT NULL,
  atmosphere text NOT NULL,
  area text NOT NULL,
  starts_at timestamptz NOT NULL,
  group_size integer NOT NULL,
  spend_band spend_band NOT NULL,
  special_requests text,
  status request_status NOT NULL DEFAULT 'submitted',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS booking_requests_status_idx ON booking_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS booking_requests_customer_idx ON booking_requests (customer_id);

CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES booking_requests(id) ON DELETE CASCADE,
  wingman_id uuid REFERENCES wingmen(id) ON DELETE SET NULL,
  offer_id uuid REFERENCES wingman_event_offers(id) ON DELETE SET NULL,
  subtotal_cents integer NOT NULL,
  service_fee_cents integer NOT NULL,
  taxes_cents integer NOT NULL DEFAULT 0,
  customer_fee_cents integer NOT NULL DEFAULT 0,
  total_cents integer NOT NULL,
  terms text NOT NULL,
  status text NOT NULL DEFAULT 'proposed',
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT quotes_min_total CHECK (total_cents >= 50000)
);

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL UNIQUE REFERENCES booking_requests(id) ON DELETE CASCADE,
  quote_id uuid NOT NULL REFERENCES quotes(id),
  customer_id uuid NOT NULL REFERENCES auth_users(id),
  wingman_id uuid REFERENCES wingmen(id),
  event_id uuid REFERENCES events(id),
  status text NOT NULL DEFAULT 'pending',
  night_pass_code text UNIQUE,
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  quote_id uuid NOT NULL REFERENCES quotes(id),
  request_id uuid NOT NULL REFERENCES booking_requests(id),
  stripe_checkout_session_id text UNIQUE,
  stripe_payment_intent_id text,
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL DEFAULT 'created',
  refunded_cents integer NOT NULL DEFAULT 0,
  dispute_status text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES booking_requests(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  sender_id uuid NOT NULL REFERENCES auth_users(id),
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS support_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES booking_requests(id) ON DELETE SET NULL,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  opened_by uuid NOT NULL REFERENCES auth_users(id),
  status text NOT NULL DEFAULT 'open',
  subject text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth_users(id) ON DELETE SET NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  action text NOT NULL,
  from_state text,
  to_state text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_events_entity_idx ON audit_events (entity_type, entity_id, created_at DESC);

CREATE OR REPLACE FUNCTION offer_passes_bookable_gates(p_offer wingman_event_offers)
RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT
    p_offer.operator_approved
    AND p_offer.expires_at > now()
    AND p_offer.inventory_quantity > 0
    AND length(trim(p_offer.terms)) > 0
    AND p_offer.service_fee_cents >= 0
    AND EXISTS (
      SELECT 1 FROM wingmen w
      WHERE w.id = p_offer.wingman_id
        AND w.verification_status = 'verified'
    );
$$;

CREATE OR REPLACE FUNCTION refresh_offer_bookable() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.bookable := offer_passes_bookable_gates(NEW);
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS offers_refresh_bookable ON wingman_event_offers;
CREATE TRIGGER offers_refresh_bookable
  BEFORE INSERT OR UPDATE ON wingman_event_offers
  FOR EACH ROW
  EXECUTE FUNCTION refresh_offer_bookable();

CREATE OR REPLACE FUNCTION sync_event_bookable_status() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  has_offer boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM wingman_event_offers o
    WHERE o.event_id = COALESCE(NEW.event_id, OLD.event_id)
      AND o.bookable = true
  ) INTO has_offer;

  UPDATE events
  SET discovery_status = CASE
        WHEN discovery_status IN ('cancelled', 'expired', 'draft') THEN discovery_status
        WHEN has_offer THEN 'bookable'::event_discovery_status
        ELSE 'discovery_ready'::event_discovery_status
      END,
      updated_at = now()
  WHERE id = COALESCE(NEW.event_id, OLD.event_id);

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS offers_sync_event_status ON wingman_event_offers;
CREATE TRIGGER offers_sync_event_status
  AFTER INSERT OR UPDATE OR DELETE ON wingman_event_offers
  FOR EACH ROW
  EXECUTE FUNCTION sync_event_bookable_status();

ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues FORCE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE events FORCE ROW LEVEL SECURITY;
ALTER TABLE wingman_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE wingman_applications FORCE ROW LEVEL SECURITY;
ALTER TABLE wingmen ENABLE ROW LEVEL SECURITY;
ALTER TABLE wingmen FORCE ROW LEVEL SECURITY;
ALTER TABLE wingman_event_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE wingman_event_offers FORCE ROW LEVEL SECURITY;
ALTER TABLE booking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_requests FORCE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes FORCE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings FORCE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments FORCE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages FORCE ROW LEVEL SECURITY;
ALTER TABLE support_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_cases FORCE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events FORCE ROW LEVEL SECURITY;
ALTER TABLE marketplace_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_settings FORCE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS venues_select ON venues;
CREATE POLICY venues_select ON venues FOR SELECT USING (true);
DROP POLICY IF EXISTS venues_write ON venues;
CREATE POLICY venues_write ON venues FOR ALL USING (app_is_operator()) WITH CHECK (app_is_operator());

DROP POLICY IF EXISTS events_select ON events;
CREATE POLICY events_select ON events FOR SELECT
  USING (app_is_operator() OR discovery_status IN ('discovery_ready', 'bookable'));
DROP POLICY IF EXISTS events_write ON events;
CREATE POLICY events_write ON events FOR ALL USING (app_is_operator()) WITH CHECK (app_is_operator());

DROP POLICY IF EXISTS applications_staff ON wingman_applications;
CREATE POLICY applications_staff ON wingman_applications FOR ALL
  USING (app_is_operator()) WITH CHECK (app_is_operator());

DROP POLICY IF EXISTS wingmen_select ON wingmen;
CREATE POLICY wingmen_select ON wingmen FOR SELECT
  USING (verification_status = 'verified' OR app_is_operator() OR user_id = app_user_id());
DROP POLICY IF EXISTS wingmen_write ON wingmen;
CREATE POLICY wingmen_write ON wingmen FOR ALL
  USING (app_is_operator() OR user_id = app_user_id())
  WITH CHECK (app_is_operator() OR user_id = app_user_id());

DROP POLICY IF EXISTS offers_select ON wingman_event_offers;
CREATE POLICY offers_select ON wingman_event_offers FOR SELECT
  USING (bookable = true OR app_is_operator() OR EXISTS (
    SELECT 1 FROM wingmen w WHERE w.id = wingman_id AND w.user_id = app_user_id()
  ));
DROP POLICY IF EXISTS offers_write ON wingman_event_offers;
CREATE POLICY offers_write ON wingman_event_offers FOR ALL
  USING (app_is_operator()) WITH CHECK (app_is_operator());

DROP POLICY IF EXISTS requests_select ON booking_requests;
CREATE POLICY requests_select ON booking_requests FOR SELECT
  USING (
    customer_id = app_user_id()
    OR app_is_operator()
    OR EXISTS (SELECT 1 FROM wingmen w WHERE w.id = assigned_wingman_id AND w.user_id = app_user_id())
  );
DROP POLICY IF EXISTS requests_insert ON booking_requests;
CREATE POLICY requests_insert ON booking_requests FOR INSERT
  WITH CHECK (customer_id = app_user_id() OR app_is_operator());
DROP POLICY IF EXISTS requests_update ON booking_requests;
CREATE POLICY requests_update ON booking_requests FOR UPDATE
  USING (
    customer_id = app_user_id()
    OR app_is_operator()
    OR EXISTS (SELECT 1 FROM wingmen w WHERE w.id = assigned_wingman_id AND w.user_id = app_user_id())
  );

DROP POLICY IF EXISTS quotes_access ON quotes;
CREATE POLICY quotes_access ON quotes FOR ALL
  USING (
    app_is_operator()
    OR EXISTS (SELECT 1 FROM booking_requests r WHERE r.id = request_id AND r.customer_id = app_user_id())
    OR EXISTS (SELECT 1 FROM wingmen w WHERE w.id = wingman_id AND w.user_id = app_user_id())
  )
  WITH CHECK (
    app_is_operator()
    OR EXISTS (SELECT 1 FROM wingmen w WHERE w.id = wingman_id AND w.user_id = app_user_id())
  );

DROP POLICY IF EXISTS bookings_access ON bookings;
CREATE POLICY bookings_access ON bookings FOR ALL
  USING (customer_id = app_user_id() OR app_is_operator())
  WITH CHECK (customer_id = app_user_id() OR app_is_operator());

DROP POLICY IF EXISTS payments_access ON payments;
CREATE POLICY payments_access ON payments FOR SELECT
  USING (
    app_is_operator()
    OR EXISTS (SELECT 1 FROM booking_requests r WHERE r.id = request_id AND r.customer_id = app_user_id())
  );

DROP POLICY IF EXISTS messages_access ON messages;
CREATE POLICY messages_access ON messages FOR ALL
  USING (
    sender_id = app_user_id()
    OR app_is_operator()
    OR EXISTS (SELECT 1 FROM booking_requests r WHERE r.id = request_id AND r.customer_id = app_user_id())
  )
  WITH CHECK (sender_id = app_user_id() OR app_is_operator());

DROP POLICY IF EXISTS support_access ON support_cases;
CREATE POLICY support_access ON support_cases FOR ALL
  USING (opened_by = app_user_id() OR app_is_operator())
  WITH CHECK (opened_by = app_user_id() OR app_is_operator());

DROP POLICY IF EXISTS audit_staff ON audit_events;
CREATE POLICY audit_staff ON audit_events FOR SELECT USING (app_is_operator());
DROP POLICY IF EXISTS audit_insert ON audit_events;
CREATE POLICY audit_insert ON audit_events FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS settings_select ON marketplace_settings;
CREATE POLICY settings_select ON marketplace_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS settings_write ON marketplace_settings;
CREATE POLICY settings_write ON marketplace_settings FOR UPDATE
  USING (app_is_product_admin()) WITH CHECK (app_is_product_admin());

DROP POLICY IF EXISTS flags_select ON feature_flags;
CREATE POLICY flags_select ON feature_flags FOR SELECT USING (true);
DROP POLICY IF EXISTS flags_write ON feature_flags;
CREATE POLICY flags_write ON feature_flags FOR ALL
  USING (app_is_operator()) WITH CHECK (app_is_operator());

GRANT SELECT, INSERT, UPDATE, DELETE ON
  venues, events, wingman_applications, wingmen, wingman_event_offers,
  booking_requests, quotes, bookings, payments, stripe_webhook_events,
  messages, support_cases, audit_events, marketplace_settings, feature_flags
TO wingman_rls;

INSERT INTO feature_flags (key, enabled, notes) VALUES
  ('verified_matching', true, 'Launch service'),
  ('vip_table_bottle', true, 'Launch service'),
  ('guest_list_access', true, 'Launch service'),
  ('plan_my_night', true, 'Launch service'),
  ('private_chat', true, 'Launch service'),
  ('night_pass', true, 'Launch service'),
  ('live_support', true, 'Launch service'),
  ('miami_trip_pass', false, 'Placeholder — not MVP'),
  ('wingman_black', false, 'Placeholder — not MVP'),
  ('preference_passport', false, 'Placeholder — not MVP'),
  ('crew_split', false, 'Placeholder — not MVP'),
  ('dining_transport_addons', false, 'Placeholder — not MVP'),
  ('corporate_hosts', false, 'Placeholder — not MVP'),
  ('hotel_referral', false, 'Placeholder — not MVP'),
  ('wingman_pro', false, 'Placeholder — not MVP'),
  ('venue_partner_dashboard', false, 'Placeholder — not MVP'),
  ('multi_city', false, 'Placeholder — not MVP')
ON CONFLICT (key) DO NOTHING;

INSERT INTO schema_migrations (id)
VALUES ('003_miami_beta_marketplace')
ON CONFLICT (id) DO NOTHING;
