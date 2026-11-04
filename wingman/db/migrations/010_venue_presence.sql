-- First-class venue presence. Discovery venues stay unclaimed.
-- Ticketmaster / sync rows are never overwritten by a venue profile.

ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS neighborhood text,
  ADD COLUMN IF NOT EXISTS atmosphere text,
  ADD COLUMN IF NOT EXISTS dress_code text,
  ADD COLUMN IF NOT EXISTS music text,
  ADD COLUMN IF NOT EXISTS hours_text text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS instagram text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS contact_name text,
  ADD COLUMN IF NOT EXISTS business_email text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS hero_photo_url text,
  ADD COLUMN IF NOT EXISTS reservation_url text,
  ADD COLUMN IF NOT EXISTS ticket_url text,
  ADD COLUMN IF NOT EXISTS table_minimum_text text,
  ADD COLUMN IF NOT EXISTS guest_profile text,
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'unclaimed',
  ADD COLUMN IF NOT EXISTS source_kind text NOT NULL DEFAULT 'discovery',
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS promoted_until timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

UPDATE venues
SET slug = lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'), '(^-+|-+$)', '', 'g'))
WHERE slug IS NULL OR slug = '';

CREATE UNIQUE INDEX IF NOT EXISTS venues_slug_uidx ON venues (slug) WHERE slug IS NOT NULL;

ALTER TABLE venues DROP CONSTRAINT IF EXISTS venues_verification_status_check;
ALTER TABLE venues ADD CONSTRAINT venues_verification_status_check
  CHECK (verification_status IN ('unclaimed', 'pending', 'verified', 'paused', 'rejected'));

ALTER TABLE venues DROP CONSTRAINT IF EXISTS venues_source_kind_check;
ALTER TABLE venues ADD CONSTRAINT venues_source_kind_check
  CHECK (source_kind IN ('discovery', 'partner'));

CREATE TABLE IF NOT EXISTS venue_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES venues(id),
  applicant_user_id uuid REFERENCES auth_users(id),
  venue_name text NOT NULL,
  venue_type text NOT NULL,
  address text NOT NULL,
  website text,
  instagram text,
  contact_name text NOT NULL,
  business_email text NOT NULL,
  phone text NOT NULL,
  hours_text text,
  description text,
  music_genres text,
  dress_code text,
  guest_profile text,
  reservation_url text,
  ticket_url text,
  table_minimums text,
  upcoming_events text,
  logo_url text,
  photo_urls text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'submitted',
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT venue_applications_status_check CHECK (status IN ('submitted', 'in_review', 'approved', 'rejected'))
);

CREATE TABLE IF NOT EXISTS venue_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  member_role text NOT NULL DEFAULT 'manager',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (venue_id, user_id),
  CONSTRAINT venue_members_role_check CHECK (member_role IN ('owner', 'manager'))
);

CREATE TABLE IF NOT EXISTS venue_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES auth_users(id),
  kind text NOT NULL DEFAULT 'access',
  party_size integer,
  date_text text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'requested',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT venue_inquiries_kind_check CHECK (kind IN ('access', 'reserve', 'guest_list', 'ask_wingman', 'plan')),
  CONSTRAINT venue_inquiries_status_check CHECK (status IN ('requested', 'being_arranged', 'replied', 'closed'))
);

CREATE TABLE IF NOT EXISTS venue_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  src text NOT NULL,
  alt text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS venue_event_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  claimed_by uuid REFERENCES auth_users(id),
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (venue_id, event_id),
  CONSTRAINT venue_event_claims_status_check CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Claiming a venue does not rewrite Ticketmaster / sync event rows.
COMMENT ON TABLE venue_event_claims IS
  'Partner claim of an existing discovery event. Does not overwrite third-party event fields.';

ALTER TABLE venue_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_applications FORCE ROW LEVEL SECURITY;
ALTER TABLE venue_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_members FORCE ROW LEVEL SECURITY;
ALTER TABLE venue_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_inquiries FORCE ROW LEVEL SECURITY;
ALTER TABLE venue_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_photos FORCE ROW LEVEL SECURITY;
ALTER TABLE venue_event_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_event_claims FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS venue_applications_select ON venue_applications;
CREATE POLICY venue_applications_select ON venue_applications FOR SELECT
  USING (app_is_operator() OR applicant_user_id = app_user_id());
DROP POLICY IF EXISTS venue_applications_insert ON venue_applications;
CREATE POLICY venue_applications_insert ON venue_applications FOR INSERT
  WITH CHECK (applicant_user_id IS NULL OR applicant_user_id = app_user_id() OR app_is_operator());
DROP POLICY IF EXISTS venue_applications_write ON venue_applications;
CREATE POLICY venue_applications_write ON venue_applications FOR UPDATE
  USING (app_is_operator()) WITH CHECK (app_is_operator());

DROP POLICY IF EXISTS venue_members_select ON venue_members;
CREATE POLICY venue_members_select ON venue_members FOR SELECT
  USING (app_is_operator() OR user_id = app_user_id());
DROP POLICY IF EXISTS venue_members_write ON venue_members;
CREATE POLICY venue_members_write ON venue_members FOR ALL
  USING (app_is_operator()) WITH CHECK (app_is_operator());

DROP POLICY IF EXISTS venue_inquiries_select ON venue_inquiries;
CREATE POLICY venue_inquiries_select ON venue_inquiries FOR SELECT
  USING (
    app_is_operator()
    OR customer_id = app_user_id()
    OR EXISTS (SELECT 1 FROM venue_members m WHERE m.venue_id = venue_inquiries.venue_id AND m.user_id = app_user_id())
  );
DROP POLICY IF EXISTS venue_inquiries_insert ON venue_inquiries;
CREATE POLICY venue_inquiries_insert ON venue_inquiries FOR INSERT
  WITH CHECK (customer_id IS NULL OR customer_id = app_user_id() OR app_is_operator());

DROP POLICY IF EXISTS venue_photos_select ON venue_photos;
CREATE POLICY venue_photos_select ON venue_photos FOR SELECT USING (true);
DROP POLICY IF EXISTS venue_photos_write ON venue_photos;
CREATE POLICY venue_photos_write ON venue_photos FOR ALL
  USING (app_is_operator()) WITH CHECK (app_is_operator());

DROP POLICY IF EXISTS venue_event_claims_select ON venue_event_claims;
CREATE POLICY venue_event_claims_select ON venue_event_claims FOR SELECT
  USING (app_is_operator() OR claimed_by = app_user_id());
DROP POLICY IF EXISTS venue_event_claims_write ON venue_event_claims;
CREATE POLICY venue_event_claims_write ON venue_event_claims FOR ALL
  USING (app_is_operator()) WITH CHECK (app_is_operator());
