DO $$ BEGIN
  CREATE ROLE wingman_rls NOLOGIN NOBYPASSRLS;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

GRANT USAGE ON SCHEMA public TO wingman_rls;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE auth_users, profiles, sessions, password_reset_tokens TO wingman_rls;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO wingman_rls;
GRANT wingman_rls TO CURRENT_USER;

INSERT INTO schema_migrations (id)
VALUES ('002_rls_test_role')
ON CONFLICT (id) DO NOTHING;
