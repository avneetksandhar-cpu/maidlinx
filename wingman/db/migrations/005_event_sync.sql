-- Daily Miami event sync + product reposition (events, trust, marks, services).
-- Preserves existing discovery events. Does not create bookable inventory.

DO $$ BEGIN
  CREATE TYPE event_booking_status AS ENUM ('DISCOVERY_ONLY', 'VERIFIED_AVAILABLE', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE event_import_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE sync_run_status AS ENUM ('running', 'success', 'failed', 'skipped');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE wingman_event_mark_type AS ENUM (
    'interested', 'recommended', 'available_virtually', 'available_in_person', 'experienced_venue'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS event_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  adapter_key text NOT NULL,
  requires_api_key boolean NOT NULL DEFAULT false,
  last_synced_at timestamptz,
  consecutive_failures integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO event_sources (slug, name, enabled, adapter_key, requires_api_key, notes) VALUES
  ('ticketmaster', 'Ticketmaster Discovery', true, 'ticketmaster', true, 'Authorized Discovery API only. Skip if TICKETMASTER_API_KEY is missing.'),
  ('predicthq', 'PredictHQ', true, 'predicthq', true, 'Optional. Skip if PREDICTHQ_TOKEN is missing.'),
  ('approved_venues', 'Approved venue calendars', true, 'approved_venues', false, 'E11EVEN, LIV, Club Space, Factory Town, M2 — admin/CSV/seed listings. No scrape.'),
  ('admin', 'Admin-created listings', true, 'admin', false, 'Manual operator entries.'),
  ('csv', 'CSV / XLSX import', true, 'csv', false, 'Imported files. Pending until an operator approves.'),
  ('partner_feed', 'Partner feed (Tabler — disabled)', false, 'partner_feed', true, 'Disabled stub. Future Tabler requires an approved API. No scrape.')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  adapter_key = EXCLUDED.adapter_key,
  requires_api_key = EXCLUDED.requires_api_key,
  notes = EXCLUDED.notes,
  enabled = CASE WHEN event_sources.slug = 'partner_feed' THEN false ELSE event_sources.enabled END,
  updated_at = now();

ALTER TABLE events ADD COLUMN IF NOT EXISTS primary_source_id uuid REFERENCES event_sources(id);
ALTER TABLE events ADD COLUMN IF NOT EXISTS performer text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS neighborhood text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS music_genre text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_type text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS atmosphere text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS dress_code text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS estimated_spend_text text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS price_min_cents integer;
ALTER TABLE events ADD COLUMN IF NOT EXISTS price_max_cents integer;
ALTER TABLE events ADD COLUMN IF NOT EXISTS price_text text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS image_usage_verified boolean NOT NULL DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS booking_status event_booking_status NOT NULL DEFAULT 'DISCOVERY_ONLY';
ALTER TABLE events ADD COLUMN IF NOT EXISTS import_status event_import_status NOT NULL DEFAULT 'approved';
ALTER TABLE events ADD COLUMN IF NOT EXISTS merge_key text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;
ALTER TABLE events ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;
ALTER TABLE events ADD COLUMN IF NOT EXISTS missed_sync_count integer NOT NULL DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS stale boolean NOT NULL DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS hidden_at timestamptz;
ALTER TABLE events ADD COLUMN IF NOT EXISTS admin_locked_fields jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE events ADD COLUMN IF NOT EXISTS merged_into_id uuid REFERENCES events(id);
ALTER TABLE events ADD COLUMN IF NOT EXISTS ends_at timestamptz;
ALTER TABLE events ADD COLUMN IF NOT EXISTS report_count integer NOT NULL DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS cancelled_reason text;

UPDATE events SET
  neighborhood = COALESCE(neighborhood, area),
  event_type = COALESCE(event_type, category),
  booking_status = CASE
    WHEN discovery_status = 'cancelled' THEN 'CANCELLED'::event_booking_status
    WHEN booking_status = 'VERIFIED_AVAILABLE' THEN booking_status
    ELSE 'DISCOVERY_ONLY'::event_booking_status
  END,
  import_status = COALESCE(import_status, 'approved'),
  last_seen_at = COALESCE(last_seen_at, source_verified_at, now()),
  last_synced_at = COALESCE(last_synced_at, source_verified_at),
  image_usage_verified = false,
  image_url = CASE WHEN image_usage_verified THEN image_url ELSE NULL END
WHERE true;

UPDATE events e
SET primary_source_id = s.id
FROM event_sources s
WHERE e.primary_source_id IS NULL
  AND s.slug = 'approved_venues';

UPDATE events e
SET merge_key = lower(regexp_replace(v.name, '[^a-zA-Z0-9]+', '', 'g'))
  || '|' || lower(regexp_replace(e.name, '[^a-zA-Z0-9]+', '', 'g'))
  || '|' || e.local_date::text
  || '|' || COALESCE(e.local_time_text, '')
FROM venues v
WHERE v.id = e.venue_id
  AND (e.merge_key IS NULL OR e.merge_key = '');

INSERT INTO venues (name, area, official_url, city, timezone)
SELECT 'Club Space', 'Downtown Miami', 'https://www.clubspace.com', 'Miami', 'America/New_York'
WHERE NOT EXISTS (SELECT 1 FROM venues WHERE name = 'Club Space');

CREATE TABLE IF NOT EXISTS event_source_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES event_sources(id) ON DELETE CASCADE,
  external_id text NOT NULL,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  missed_sync_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_id, external_id)
);

INSERT INTO event_source_records (source_id, external_id, event_id, last_seen_at, status)
SELECT e.primary_source_id, e.external_id, e.id, COALESCE(e.source_verified_at, now()), 'active'
FROM events e
WHERE e.primary_source_id IS NOT NULL
ON CONFLICT (source_id, external_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES event_sources(id) ON DELETE SET NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status sync_run_status NOT NULL DEFAULT 'running',
  fetched_count integer NOT NULL DEFAULT 0,
  upserted_count integer NOT NULL DEFAULT 0,
  merged_count integer NOT NULL DEFAULT 0,
  stale_count integer NOT NULL DEFAULT 0,
  cancelled_count integer NOT NULL DEFAULT 0,
  error_message text,
  logs jsonb NOT NULL DEFAULT '[]'::jsonb,
  triggered_by text NOT NULL DEFAULT 'cron',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  message text NOT NULL,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  message text NOT NULL,
  source_id uuid REFERENCES event_sources(id) ON DELETE SET NULL,
  sync_run_id uuid REFERENCES sync_runs(id) ON DELETE SET NULL,
  acknowledged_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS events_merge_key_idx ON events (merge_key);
CREATE INDEX IF NOT EXISTS events_booking_status_idx ON events (booking_status, local_date);
CREATE INDEX IF NOT EXISTS events_hidden_idx ON events (hidden_at, stale, import_status);
CREATE INDEX IF NOT EXISTS sync_runs_started_idx ON sync_runs (started_at DESC);
CREATE INDEX IF NOT EXISTS event_source_records_event_idx ON event_source_records (event_id);

CREATE OR REPLACE FUNCTION sync_event_bookable_status() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  has_offer boolean;
  target uuid;
BEGIN
  target := COALESCE(NEW.event_id, OLD.event_id);
  SELECT EXISTS (
    SELECT 1 FROM wingman_event_offers o
    WHERE o.event_id = target AND o.bookable = true
  ) INTO has_offer;

  UPDATE events
  SET discovery_status = CASE
        WHEN discovery_status IN ('cancelled', 'expired', 'draft') THEN discovery_status
        WHEN has_offer THEN 'bookable'::event_discovery_status
        ELSE 'discovery_ready'::event_discovery_status
      END,
      booking_status = CASE
        WHEN discovery_status = 'cancelled' OR cancelled_at IS NOT NULL THEN 'CANCELLED'::event_booking_status
        WHEN has_offer THEN 'VERIFIED_AVAILABLE'::event_booking_status
        ELSE 'DISCOVERY_ONLY'::event_booking_status
      END,
      updated_at = now()
  WHERE id = target;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS offers_sync_event_status ON wingman_event_offers;
CREATE TRIGGER offers_sync_event_status
  AFTER INSERT OR UPDATE OR DELETE ON wingman_event_offers
  FOR EACH ROW
  EXECUTE FUNCTION sync_event_bookable_status();

ALTER TABLE wingman_applications ADD COLUMN IF NOT EXISTS gov_id_at timestamptz;
ALTER TABLE wingman_applications ADD COLUMN IF NOT EXISTS selfie_liveness_at timestamptz;
ALTER TABLE wingman_applications ADD COLUMN IF NOT EXISTS screening_manual_at timestamptz;
ALTER TABLE wingman_applications ADD COLUMN IF NOT EXISTS code_of_conduct_at timestamptz;
ALTER TABLE wingman_applications ADD COLUMN IF NOT EXISTS emergency_contact_at timestamptz;
ALTER TABLE wingman_applications ADD COLUMN IF NOT EXISTS emergency_contact_name text;
ALTER TABLE wingman_applications ADD COLUMN IF NOT EXISTS emergency_contact_phone text;
ALTER TABLE wingman_applications ADD COLUMN IF NOT EXISTS id_vendor_status text NOT NULL DEFAULT 'not_configured';

ALTER TABLE wingmen ADD COLUMN IF NOT EXISTS suspended_at timestamptz;
ALTER TABLE wingmen ADD COLUMN IF NOT EXISTS suspend_reason text;
ALTER TABLE wingmen ADD COLUMN IF NOT EXISTS emergency_contact_name text;
ALTER TABLE wingmen ADD COLUMN IF NOT EXISTS emergency_contact_phone text;
ALTER TABLE wingmen ADD COLUMN IF NOT EXISTS languages_public text[];
ALTER TABLE wingmen ADD COLUMN IF NOT EXISTS profile_template jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS requested_services text[] NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS wingman_event_marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wingman_id uuid NOT NULL REFERENCES wingmen(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  mark_type wingman_event_mark_type NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (wingman_id, event_id, mark_type)
);

CREATE TABLE IF NOT EXISTS booking_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  kind text NOT NULL,
  recorded_by uuid REFERENCES auth_users(id) ON DELETE SET NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  CONSTRAINT booking_checkins_kind CHECK (kind IN ('check_in', 'check_out'))
);

CREATE TABLE IF NOT EXISTS customer_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  wingman_id uuid REFERENCES wingmen(id) ON DELETE SET NULL,
  rating integer NOT NULL,
  body text,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT customer_reviews_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT customer_reviews_no_fake_publish CHECK (published = false OR booking_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS incident_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  event_id uuid REFERENCES events(id) ON DELETE SET NULL,
  reported_by uuid NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  details text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE interest_signups DROP CONSTRAINT IF EXISTS interest_source_check;
ALTER TABLE interest_signups ADD CONSTRAINT interest_source_check CHECK (
  source IN ('wingmen_directory', 'event', 'home', 'plan', 'other', 'wingman_apply')
);

ALTER TABLE event_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_sources FORCE ROW LEVEL SECURITY;
ALTER TABLE event_source_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_source_records FORCE ROW LEVEL SECURITY;
ALTER TABLE sync_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_runs FORCE ROW LEVEL SECURITY;
ALTER TABLE event_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_reports FORCE ROW LEVEL SECURITY;
ALTER TABLE admin_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_alerts FORCE ROW LEVEL SECURITY;
ALTER TABLE wingman_event_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE wingman_event_marks FORCE ROW LEVEL SECURITY;
ALTER TABLE booking_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_checkins FORCE ROW LEVEL SECURITY;
ALTER TABLE customer_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_reviews FORCE ROW LEVEL SECURITY;
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_reports FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS event_sources_select ON event_sources;
CREATE POLICY event_sources_select ON event_sources FOR SELECT USING (true);
DROP POLICY IF EXISTS event_sources_write ON event_sources;
CREATE POLICY event_sources_write ON event_sources FOR ALL USING (app_is_operator()) WITH CHECK (app_is_operator());

DROP POLICY IF EXISTS event_source_records_staff ON event_source_records;
CREATE POLICY event_source_records_staff ON event_source_records FOR ALL
  USING (app_is_operator()) WITH CHECK (app_is_operator());

DROP POLICY IF EXISTS sync_runs_staff ON sync_runs;
CREATE POLICY sync_runs_staff ON sync_runs FOR ALL
  USING (app_is_operator()) WITH CHECK (app_is_operator());

DROP POLICY IF EXISTS event_reports_insert ON event_reports;
CREATE POLICY event_reports_insert ON event_reports FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS event_reports_staff ON event_reports;
CREATE POLICY event_reports_staff ON event_reports FOR SELECT USING (app_is_operator());

DROP POLICY IF EXISTS admin_alerts_staff ON admin_alerts;
CREATE POLICY admin_alerts_staff ON admin_alerts FOR ALL
  USING (app_is_operator()) WITH CHECK (app_is_operator());

DROP POLICY IF EXISTS marks_select ON wingman_event_marks;
CREATE POLICY marks_select ON wingman_event_marks FOR SELECT
  USING (
    app_is_operator()
    OR EXISTS (SELECT 1 FROM wingmen w WHERE w.id = wingman_id AND w.user_id = app_user_id())
    OR EXISTS (
      SELECT 1 FROM wingmen w
      WHERE w.id = wingman_id AND w.verification_status = 'verified' AND w.suspended_at IS NULL
    )
  );
DROP POLICY IF EXISTS marks_write ON wingman_event_marks;
CREATE POLICY marks_write ON wingman_event_marks FOR ALL
  USING (
    app_is_operator()
    OR EXISTS (
      SELECT 1 FROM wingmen w
      WHERE w.id = wingman_id
        AND w.user_id = app_user_id()
        AND w.verification_status = 'verified'
        AND w.suspended_at IS NULL
    )
  )
  WITH CHECK (
    app_is_operator()
    OR EXISTS (
      SELECT 1 FROM wingmen w
      WHERE w.id = wingman_id
        AND w.user_id = app_user_id()
        AND w.verification_status = 'verified'
        AND w.suspended_at IS NULL
    )
  );

DROP POLICY IF EXISTS checkins_access ON booking_checkins;
CREATE POLICY checkins_access ON booking_checkins FOR ALL
  USING (
    app_is_operator()
    OR EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_id AND (b.customer_id = app_user_id() OR app_is_wingman())
    )
  )
  WITH CHECK (app_is_operator() OR app_is_wingman() OR EXISTS (
    SELECT 1 FROM bookings b WHERE b.id = booking_id AND b.customer_id = app_user_id()
  ));

DROP POLICY IF EXISTS reviews_select ON customer_reviews;
CREATE POLICY reviews_select ON customer_reviews FOR SELECT
  USING (published = true OR app_is_operator() OR customer_id = app_user_id());
DROP POLICY IF EXISTS reviews_insert ON customer_reviews;
CREATE POLICY reviews_insert ON customer_reviews FOR INSERT
  WITH CHECK (customer_id = app_user_id() AND published = false);

DROP POLICY IF EXISTS incidents_access ON incident_reports;
CREATE POLICY incidents_access ON incident_reports FOR ALL
  USING (reported_by = app_user_id() OR app_is_operator())
  WITH CHECK (reported_by = app_user_id() OR app_is_operator());

GRANT SELECT, INSERT, UPDATE, DELETE ON
  event_sources, event_source_records, sync_runs, event_reports, admin_alerts,
  wingman_event_marks, booking_checkins, customer_reviews, incident_reports
TO wingman_rls;

INSERT INTO schema_migrations (id)
VALUES ('005_event_sync')
ON CONFLICT (id) DO NOTHING;
