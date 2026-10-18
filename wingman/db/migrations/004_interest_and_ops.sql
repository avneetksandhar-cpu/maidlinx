-- Customer interest waitlist (no charge, no access promise) + grants for ops import.

CREATE TABLE IF NOT EXISTS interest_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text,
  source text NOT NULL,
  event_id uuid REFERENCES events(id) ON DELETE SET NULL,
  notes text,
  user_id uuid REFERENCES auth_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT interest_source_check CHECK (
    source IN ('wingmen_directory', 'event', 'home', 'plan', 'other')
  )
);

ALTER TABLE interest_signups
  ADD COLUMN IF NOT EXISTS email_key text GENERATED ALWAYS AS (lower(email)) STORED;
ALTER TABLE interest_signups
  ADD COLUMN IF NOT EXISTS event_key text GENERATED ALWAYS AS (COALESCE(event_id::text, '')) STORED;

CREATE UNIQUE INDEX IF NOT EXISTS interest_signups_unique_idx
  ON interest_signups (email_key, source, event_key);

CREATE INDEX IF NOT EXISTS interest_signups_created_idx ON interest_signups (created_at DESC);

ALTER TABLE interest_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE interest_signups FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS interest_select ON interest_signups;
CREATE POLICY interest_select ON interest_signups FOR SELECT
  USING (app_is_operator() OR user_id = app_user_id());

DROP POLICY IF EXISTS interest_insert ON interest_signups;
CREATE POLICY interest_insert ON interest_signups FOR INSERT
  WITH CHECK (user_id IS NULL OR user_id = app_user_id() OR app_is_operator());

DROP POLICY IF EXISTS interest_update ON interest_signups;
CREATE POLICY interest_update ON interest_signups FOR UPDATE
  USING (app_is_operator()) WITH CHECK (app_is_operator());

GRANT SELECT, INSERT, UPDATE, DELETE ON interest_signups TO wingman_rls;

INSERT INTO schema_migrations (id)
VALUES ('004_interest_and_ops')
ON CONFLICT (id) DO NOTHING;
