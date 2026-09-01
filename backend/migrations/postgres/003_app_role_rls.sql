-- Aislamiento real en Neon: el owner (neondb_owner) tiene BYPASSRLS.
-- Usamos rol de aplicación sin BYPASSRLS + defaults de instance_id desde app.instance_id.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'clicagenda_app') THEN
    CREATE ROLE clicagenda_app NOINHERIT NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO clicagenda_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO clicagenda_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO clicagenda_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO clicagenda_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO clicagenda_app;
GRANT clicagenda_app TO CURRENT_USER;

ALTER TABLE company FORCE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
ALTER TABLE patients FORCE ROW LEVEL SECURITY;
ALTER TABLE services FORCE ROW LEVEL SECURITY;
ALTER TABLE appointments FORCE ROW LEVEL SECURITY;
ALTER TABLE patient_services FORCE ROW LEVEL SECURITY;
ALTER TABLE medical_treatments FORCE ROW LEVEL SECURITY;
ALTER TABLE medical_documents FORCE ROW LEVEL SECURITY;
ALTER TABLE appointment_requests FORCE ROW LEVEL SECURITY;

ALTER TABLE company ALTER COLUMN instance_id SET DEFAULT NULLIF(current_setting('app.instance_id', true), '')::int;
ALTER TABLE users ALTER COLUMN instance_id SET DEFAULT NULLIF(current_setting('app.instance_id', true), '')::int;
ALTER TABLE patients ALTER COLUMN instance_id SET DEFAULT NULLIF(current_setting('app.instance_id', true), '')::int;
ALTER TABLE services ALTER COLUMN instance_id SET DEFAULT NULLIF(current_setting('app.instance_id', true), '')::int;
ALTER TABLE appointments ALTER COLUMN instance_id SET DEFAULT NULLIF(current_setting('app.instance_id', true), '')::int;
ALTER TABLE patient_services ALTER COLUMN instance_id SET DEFAULT NULLIF(current_setting('app.instance_id', true), '')::int;
ALTER TABLE medical_treatments ALTER COLUMN instance_id SET DEFAULT NULLIF(current_setting('app.instance_id', true), '')::int;
ALTER TABLE medical_documents ALTER COLUMN instance_id SET DEFAULT NULLIF(current_setting('app.instance_id', true), '')::int;
ALTER TABLE appointment_requests ALTER COLUMN instance_id SET DEFAULT NULLIF(current_setting('app.instance_id', true), '')::int;
