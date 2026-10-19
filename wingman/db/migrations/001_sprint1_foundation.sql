-- Sprint 1 foundation: auth tables, flexible roles, RLS.
-- Unresolved product questions (Promoter vs Verified Wingman, pricing)
-- are NOT encoded as fake rules. Both host/promote flags can live on role=partner.

CREATE TABLE IF NOT EXISTS schema_migrations (
  id text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('member', 'partner', 'admin', 'owner');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE membership_tier AS ENUM ('basic', 'preferred', 'premium');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE approval_status AS ENUM ('unverified', 'verified', 'approved', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS auth_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT auth_users_email_lower_unique UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth_users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'member',
  membership_tier membership_tier NOT NULL DEFAULT 'basic',
  approval_status approval_status NOT NULL DEFAULT 'unverified',
  display_name text,
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions (expires_at);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS password_reset_tokens_user_id_idx ON password_reset_tokens (user_id);

CREATE OR REPLACE FUNCTION app_user_id() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.user_id', true), '')::uuid;
$$;

CREATE OR REPLACE FUNCTION app_role() RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(NULLIF(current_setting('app.role', true), ''), '');
$$;

CREATE OR REPLACE FUNCTION app_is_staff() RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT app_role() IN ('admin', 'owner');
$$;

CREATE OR REPLACE FUNCTION prevent_privilege_escalation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF app_role() NOT IN ('admin', 'owner') THEN
    IF NEW.role IS DISTINCT FROM OLD.role
       OR NEW.approval_status IS DISTINCT FROM OLD.approval_status
       OR NEW.membership_tier IS DISTINCT FROM OLD.membership_tier
       OR NEW.permissions IS DISTINCT FROM OLD.permissions THEN
      RAISE EXCEPTION 'privilege escalation denied' USING ERRCODE = '42501';
    END IF;
  END IF;

  IF app_role() = 'admin' AND NEW.role = 'owner' AND OLD.role IS DISTINCT FROM 'owner' THEN
    RAISE EXCEPTION 'admin cannot grant owner' USING ERRCODE = '42501';
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_privilege_escalation ON profiles;
CREATE TRIGGER profiles_prevent_privilege_escalation
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_privilege_escalation();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select ON profiles;
CREATE POLICY profiles_select ON profiles
  FOR SELECT
  USING (id = app_user_id() OR app_is_staff());

DROP POLICY IF EXISTS profiles_update ON profiles;
CREATE POLICY profiles_update ON profiles
  FOR UPDATE
  USING (id = app_user_id() OR app_is_staff())
  WITH CHECK (id = app_user_id() OR app_is_staff());

DROP POLICY IF EXISTS profiles_insert ON profiles;
CREATE POLICY profiles_insert ON profiles
  FOR INSERT
  WITH CHECK (id = app_user_id());

DROP POLICY IF EXISTS profiles_delete ON profiles;
CREATE POLICY profiles_delete ON profiles
  FOR DELETE
  USING (app_role() = 'owner');

CREATE OR REPLACE FUNCTION get_auth_by_email(p_email text)
RETURNS TABLE (
  id uuid,
  email text,
  password_hash text,
  display_name text,
  role user_role,
  membership_tier membership_tier,
  approval_status approval_status,
  permissions jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
BEGIN
  SELECT u.id INTO uid
  FROM auth_users u
  WHERE u.email = lower(trim(p_email))
  LIMIT 1;

  IF uid IS NULL THEN
    RETURN;
  END IF;

  PERFORM set_config('app.user_id', uid::text, true);

  RETURN QUERY
  SELECT
    u.id,
    u.email,
    u.password_hash,
    p.display_name,
    p.role,
    p.membership_tier,
    p.approval_status,
    p.permissions
  FROM auth_users u
  JOIN profiles p ON p.id = u.id
  WHERE u.id = uid;
END;
$$;

CREATE OR REPLACE FUNCTION get_session_user(p_token_hash text)
RETURNS TABLE (
  user_id uuid,
  email text,
  display_name text,
  role user_role,
  membership_tier membership_tier,
  approval_status approval_status,
  permissions jsonb,
  expires_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
BEGIN
  SELECT s.user_id INTO uid
  FROM sessions s
  WHERE s.token_hash = p_token_hash
    AND s.expires_at > now()
  LIMIT 1;

  IF uid IS NULL THEN
    RETURN;
  END IF;

  PERFORM set_config('app.user_id', uid::text, true);

  RETURN QUERY
  SELECT
    s.user_id,
    u.email,
    p.display_name,
    p.role,
    p.membership_tier,
    p.approval_status,
    p.permissions,
    s.expires_at
  FROM sessions s
  JOIN auth_users u ON u.id = s.user_id
  JOIN profiles p ON p.id = s.user_id
  WHERE s.token_hash = p_token_hash
    AND s.expires_at > now();
END;
$$;

CREATE OR REPLACE FUNCTION signup_user(
  p_email text,
  p_password_hash text,
  p_display_name text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO auth_users (email, password_hash)
  VALUES (lower(trim(p_email)), p_password_hash)
  RETURNING id INTO new_id;

  PERFORM set_config('app.user_id', new_id::text, true);
  PERFORM set_config('app.role', 'member', true);

  INSERT INTO profiles (id, role, membership_tier, approval_status, display_name, permissions)
  VALUES (
    new_id,
    'member',
    'basic',
    'unverified',
    NULLIF(trim(p_display_name), ''),
    '{"guestList":false,"hostExperiences":false,"manageAttendees":false,"promoteEvents":false,"manageClients":false,"editUsers":false}'::jsonb
  );

  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION provision_user(
  p_email text,
  p_password_hash text,
  p_display_name text,
  p_role user_role,
  p_tier membership_tier,
  p_approval approval_status,
  p_permissions jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO auth_users (email, password_hash)
  VALUES (lower(trim(p_email)), p_password_hash)
  RETURNING id INTO new_id;

  PERFORM set_config('app.user_id', new_id::text, true);
  PERFORM set_config('app.role', p_role::text, true);

  INSERT INTO profiles (id, role, membership_tier, approval_status, display_name, permissions)
  VALUES (new_id, p_role, p_tier, p_approval, NULLIF(trim(p_display_name), ''), COALESCE(p_permissions, '{}'::jsonb));

  RETURN new_id;
END;
$$;

INSERT INTO schema_migrations (id)
VALUES ('001_sprint1_foundation')
ON CONFLICT (id) DO NOTHING;
