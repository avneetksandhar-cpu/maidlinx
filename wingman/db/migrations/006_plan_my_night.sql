-- Plan My Night journey + trust extensions. No fake Wingmen. No membership billing.

ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS night_goal text;
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS night_plan jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE wingman_applications ADD COLUMN IF NOT EXISTS service_boundary_at timestamptz;
ALTER TABLE wingman_applications ADD COLUMN IF NOT EXISTS no_show_policy_at timestamptz;
ALTER TABLE wingman_applications ADD COLUMN IF NOT EXISTS payment_auth_at timestamptz;

CREATE TABLE IF NOT EXISTS trusted_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE trusted_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE trusted_contacts FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS trusted_contacts_own ON trusted_contacts;
CREATE POLICY trusted_contacts_own ON trusted_contacts FOR ALL
  USING (user_id = app_user_id() OR app_is_operator())
  WITH CHECK (user_id = app_user_id() OR app_is_operator());

GRANT SELECT, INSERT, UPDATE, DELETE ON trusted_contacts TO wingman_rls;

INSERT INTO feature_flags (key, enabled, notes) VALUES
  ('saved_preferences', false, 'Placeholder — not built. Do not delay P0.'),
  ('one_tap_rebook', false, 'Placeholder — not built.'),
  ('multi_night_packages', false, 'Placeholder — not built. No membership billing.'),
  ('birthday_bachelor', false, 'Placeholder — not built.'),
  ('group_invites', false, 'Placeholder — not built.'),
  ('last_minute_priority', false, 'Placeholder — not built.'),
  ('member_pricing', false, 'Placeholder — not built. No membership billing.'),
  ('other_cities', false, 'Placeholder — Miami only.'),
  ('improving_recs', false, 'Placeholder — not built.'),
  ('wingman_passport', false, 'Placeholder — not built.'),
  ('in_person_insurance_cleared', false, 'Owner blocker. Do not claim insurance exists.')
ON CONFLICT (key) DO NOTHING;

INSERT INTO schema_migrations (id)
VALUES ('006_plan_my_night')
ON CONFLICT (id) DO NOTHING;
