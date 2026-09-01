-- Nota: FORCE RLS no basta si el rol tiene BYPASSRLS (neondb_owner en Neon).
-- La solución efectiva está en 003_app_role_rls.sql (rol clicagenda_app + SET LOCAL ROLE).

ALTER TABLE company FORCE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
ALTER TABLE patients FORCE ROW LEVEL SECURITY;
ALTER TABLE services FORCE ROW LEVEL SECURITY;
ALTER TABLE appointments FORCE ROW LEVEL SECURITY;
ALTER TABLE patient_services FORCE ROW LEVEL SECURITY;
ALTER TABLE medical_treatments FORCE ROW LEVEL SECURITY;
ALTER TABLE medical_documents FORCE ROW LEVEL SECURITY;
ALTER TABLE appointment_requests FORCE ROW LEVEL SECURITY;
