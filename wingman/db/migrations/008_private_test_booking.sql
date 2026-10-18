-- Private TEST booking fixtures + check-in lifecycle.
-- TEST rows are labelled and flagged. Public queries must exclude is_test_fixture.
-- Remove with ENABLE_TEST_FIXTURES=false (seed) or DELETE WHERE is_test_fixture.

ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'draft';
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'in_progress';

ALTER TABLE events ADD COLUMN IF NOT EXISTS is_test_fixture boolean NOT NULL DEFAULT false;
ALTER TABLE wingmen ADD COLUMN IF NOT EXISTS is_test_fixture boolean NOT NULL DEFAULT false;
ALTER TABLE wingman_applications ADD COLUMN IF NOT EXISTS is_test_fixture boolean NOT NULL DEFAULT false;
ALTER TABLE wingman_event_offers ADD COLUMN IF NOT EXISTS is_test_fixture boolean NOT NULL DEFAULT false;
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS is_test_fixture boolean NOT NULL DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_test_fixture boolean NOT NULL DEFAULT false;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS is_test_fixture boolean NOT NULL DEFAULT false;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS is_test_fixture boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_test_fixture boolean NOT NULL DEFAULT false;

ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS offer_id uuid REFERENCES wingman_event_offers(id) ON DELETE SET NULL;
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS service_scope_ack_at timestamptz;
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS code_of_conduct_ack_at timestamptz;
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS no_guarantees_ack_at timestamptz;
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS emergency_contact_name text;
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS emergency_contact_phone text;

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS checked_in_at timestamptz;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS checked_out_at timestamptz;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS completed_at timestamptz;

ALTER TABLE booking_checkins ADD COLUMN IF NOT EXISTS is_test_fixture boolean NOT NULL DEFAULT false;
ALTER TABLE customer_reviews ADD COLUMN IF NOT EXISTS is_test_fixture boolean NOT NULL DEFAULT false;
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS is_test_fixture boolean NOT NULL DEFAULT false;
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS request_id uuid REFERENCES booking_requests(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS test_fixture_registry (
  key text PRIMARY KEY,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS events_test_fixture_idx ON events (is_test_fixture);
CREATE INDEX IF NOT EXISTS wingmen_test_fixture_idx ON wingmen (is_test_fixture);
CREATE INDEX IF NOT EXISTS offers_test_fixture_idx ON wingman_event_offers (is_test_fixture);

CREATE OR REPLACE FUNCTION sync_event_bookable_status() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  has_offer boolean;
  target_event uuid;
BEGIN
  target_event := COALESCE(NEW.event_id, OLD.event_id);
  SELECT EXISTS (
    SELECT 1 FROM wingman_event_offers o
    WHERE o.event_id = target_event
      AND o.bookable = true
      AND COALESCE(o.is_test_fixture, false) = false
  ) INTO has_offer;

  UPDATE events
  SET discovery_status = CASE
        WHEN COALESCE(is_test_fixture, false) THEN discovery_status
        WHEN discovery_status IN ('cancelled', 'expired', 'draft') THEN discovery_status
        WHEN has_offer THEN 'bookable'::event_discovery_status
        ELSE 'discovery_ready'::event_discovery_status
      END,
      updated_at = now()
  WHERE id = target_event
    AND COALESCE(is_test_fixture, false) = false;

  RETURN NULL;
END;
$$;

ALTER TABLE test_fixture_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_fixture_registry FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fixtures_staff ON test_fixture_registry;
CREATE POLICY fixtures_staff ON test_fixture_registry FOR ALL
  USING (app_is_operator()) WITH CHECK (app_is_operator());

GRANT SELECT, INSERT, UPDATE, DELETE ON test_fixture_registry TO wingman_rls;

INSERT INTO feature_flags (key, enabled, notes) VALUES
  ('enable_test_fixtures', false, 'Private TEST booking fixtures. Never public. Remove before production.')
ON CONFLICT (key) DO NOTHING;

INSERT INTO schema_migrations (id)
VALUES ('008_private_test_booking')
ON CONFLICT (id) DO NOTHING;
