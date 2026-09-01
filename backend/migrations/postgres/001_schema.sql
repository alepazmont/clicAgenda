-- ClicAgenda · PostgreSQL (Neon) · esquema unificado multi-tenant

CREATE TABLE IF NOT EXISTS _migrations (
  name VARCHAR(255) PRIMARY KEY,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Master ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS superadmins (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feature_groups (
  id SERIAL PRIMARY KEY,
  key_name VARCHAR(64) NOT NULL UNIQUE,
  name_es VARCHAR(255) NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS features (
  id SERIAL PRIMARY KEY,
  feature_group_id INT NOT NULL REFERENCES feature_groups(id),
  key_name VARCHAR(64) NOT NULL,
  name_es VARCHAR(255) NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price_monthly DECIMAL(10,2) DEFAULT 0,
  price_annual DECIMAL(10,2) DEFAULT 0,
  discount_biennial DECIMAL(5,2) DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plan_features (
  plan_id INT NOT NULL REFERENCES plans(id),
  feature_id INT NOT NULL REFERENCES features(id),
  PRIMARY KEY (plan_id, feature_id)
);

CREATE TABLE IF NOT EXISTS templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(32) DEFAULT 'library',
  instance_id INT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS template_versions (
  id SERIAL PRIMARY KEY,
  template_id INT NOT NULL REFERENCES templates(id),
  version VARCHAR(32) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  changelog TEXT
);

CREATE TABLE IF NOT EXISTS instances (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(128) NOT NULL UNIQUE,
  db_name VARCHAR(128) NOT NULL UNIQUE,
  domain_type VARCHAR(32) DEFAULT 'path',
  domain_value VARCHAR(255) NOT NULL,
  plan_id INT REFERENCES plans(id),
  template_id INT REFERENCES templates(id),
  template_version_id INT REFERENCES template_versions(id),
  state VARCHAR(32) DEFAULT 'active',
  contact_email VARCHAR(255),
  specialty VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  superadmin_id INT REFERENCES superadmins(id),
  action VARCHAR(64) NOT NULL,
  entity_type VARCHAR(64),
  entity_id VARCHAR(64),
  payload JSONB,
  ip VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS migrations_log (
  id SERIAL PRIMARY KEY,
  instance_id INT REFERENCES instances(id),
  migration_name VARCHAR(255) NOT NULL,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  finished_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS debug_settings (
  id SERIAL PRIMARY KEY,
  instance_id INT REFERENCES instances(id) ON DELETE CASCADE,
  scope_type VARCHAR(32) NOT NULL,
  scope_key VARCHAR(128) NOT NULL DEFAULT 'all',
  console_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  file_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (instance_id, scope_type, scope_key)
);

-- ── Tenant (instance_id en todas) ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS company (
  id SERIAL PRIMARY KEY,
  instance_id INT NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  name VARCHAR(255),
  logo_url VARCHAR(512),
  colors JSONB,
  business_hours JSONB,
  address VARCHAR(512),
  phone VARCHAR(64),
  email VARCHAR(255),
  website VARCHAR(512),
  short_description VARCHAR(500),
  description TEXT,
  social_links JSONB,
  portal_enabled BOOLEAN DEFAULT TRUE,
  portal_welcome_text TEXT,
  portal_cta_button VARCHAR(100) DEFAULT 'Solicitar cita',
  professionals JSONB,
  google_business_url VARCHAR(512),
  google_maps_embed_src VARCHAR(1024),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (instance_id)
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  instance_id INT NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'empleado',
  name VARCHAR(255),
  company_id INT REFERENCES company(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (instance_id, email)
);

CREATE TABLE IF NOT EXISTS patients (
  id SERIAL PRIMARY KEY,
  instance_id INT NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(64),
  dni VARCHAR(32),
  address TEXT,
  birth_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  instance_id INT NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  duration_minutes INT DEFAULT 30,
  price DECIMAL(10,2),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  instance_id INT NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  patient_id INT REFERENCES patients(id),
  user_id INT REFERENCES users(id),
  service_id INT REFERENCES services(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status VARCHAR(32) DEFAULT 'scheduled',
  notes TEXT,
  payment_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_services (
  id SERIAL PRIMARY KEY,
  instance_id INT NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  patient_id INT NOT NULL REFERENCES patients(id),
  service_id INT NOT NULL REFERENCES services(id),
  remaining_sessions INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medical_treatments (
  id SERIAL PRIMARY KEY,
  instance_id INT NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  patient_id INT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(32) DEFAULT 'active',
  start_date DATE,
  end_date DATE,
  evolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medical_documents (
  id SERIAL PRIMARY KEY,
  instance_id INT NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  patient_id INT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  file_path VARCHAR(512),
  document_type VARCHAR(64) DEFAULT 'other',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointment_requests (
  id SERIAL PRIMARY KEY,
  instance_id INT NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(64),
  service_id INT REFERENCES services(id) ON DELETE SET NULL,
  preferred_date DATE,
  message TEXT,
  status VARCHAR(32) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE company ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON company
  USING (instance_id = current_setting('app.instance_id', true)::int)
  WITH CHECK (instance_id = current_setting('app.instance_id', true)::int);

CREATE POLICY tenant_isolation ON users
  USING (instance_id = current_setting('app.instance_id', true)::int)
  WITH CHECK (instance_id = current_setting('app.instance_id', true)::int);

CREATE POLICY tenant_isolation ON patients
  USING (instance_id = current_setting('app.instance_id', true)::int)
  WITH CHECK (instance_id = current_setting('app.instance_id', true)::int);

CREATE POLICY tenant_isolation ON services
  USING (instance_id = current_setting('app.instance_id', true)::int)
  WITH CHECK (instance_id = current_setting('app.instance_id', true)::int);

CREATE POLICY tenant_isolation ON appointments
  USING (instance_id = current_setting('app.instance_id', true)::int)
  WITH CHECK (instance_id = current_setting('app.instance_id', true)::int);

CREATE POLICY tenant_isolation ON patient_services
  USING (instance_id = current_setting('app.instance_id', true)::int)
  WITH CHECK (instance_id = current_setting('app.instance_id', true)::int);

CREATE POLICY tenant_isolation ON medical_treatments
  USING (instance_id = current_setting('app.instance_id', true)::int)
  WITH CHECK (instance_id = current_setting('app.instance_id', true)::int);

CREATE POLICY tenant_isolation ON medical_documents
  USING (instance_id = current_setting('app.instance_id', true)::int)
  WITH CHECK (instance_id = current_setting('app.instance_id', true)::int);

CREATE POLICY tenant_isolation ON appointment_requests
  USING (instance_id = current_setting('app.instance_id', true)::int)
  WITH CHECK (instance_id = current_setting('app.instance_id', true)::int);

CREATE INDEX IF NOT EXISTS idx_patients_instance ON patients(instance_id);
CREATE INDEX IF NOT EXISTS idx_appointments_instance_start ON appointments(instance_id, start_time);
CREATE INDEX IF NOT EXISTS idx_services_instance ON services(instance_id);
