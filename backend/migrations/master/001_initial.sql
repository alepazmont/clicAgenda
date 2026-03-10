-- BBDD maestra - esquema inicial Fase 0
CREATE TABLE IF NOT EXISTS superadmins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS feature_groups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  key_name VARCHAR(64) NOT NULL UNIQUE,
  name_es VARCHAR(255) NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS features (
  id INT AUTO_INCREMENT PRIMARY KEY,
  feature_group_id INT NOT NULL,
  key_name VARCHAR(64) NOT NULL,
  name_es VARCHAR(255) NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) DEFAULT NULL,
  FOREIGN KEY (feature_group_id) REFERENCES feature_groups(id)
);

CREATE TABLE IF NOT EXISTS plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price_monthly DECIMAL(10,2) DEFAULT 0,
  price_annual DECIMAL(10,2) DEFAULT 0,
  discount_biennial DECIMAL(5,2) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS plan_features (
  plan_id INT NOT NULL,
  feature_id INT NOT NULL,
  PRIMARY KEY (plan_id, feature_id),
  FOREIGN KEY (plan_id) REFERENCES plans(id),
  FOREIGN KEY (feature_id) REFERENCES features(id)
);

CREATE TABLE IF NOT EXISTS templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(32) DEFAULT 'library',
  instance_id INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS template_versions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  template_id INT NOT NULL,
  version VARCHAR(32) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  changelog TEXT,
  FOREIGN KEY (template_id) REFERENCES templates(id)
);

CREATE TABLE IF NOT EXISTS instances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(128) NOT NULL UNIQUE,
  db_name VARCHAR(128) NOT NULL UNIQUE,
  domain_type VARCHAR(32) DEFAULT 'subdomain_ours',
  domain_value VARCHAR(255) NOT NULL,
  plan_id INT DEFAULT NULL,
  template_id INT DEFAULT NULL,
  template_version_id INT DEFAULT NULL,
  state VARCHAR(32) DEFAULT 'active',
  contact_email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES plans(id),
  FOREIGN KEY (template_id) REFERENCES templates(id),
  FOREIGN KEY (template_version_id) REFERENCES template_versions(id)
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  superadmin_id INT,
  action VARCHAR(64) NOT NULL,
  entity_type VARCHAR(64),
  entity_id VARCHAR(64),
  payload JSON,
  ip VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (superadmin_id) REFERENCES superadmins(id)
);

CREATE TABLE IF NOT EXISTS migrations_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  instance_id INT,
  migration_name VARCHAR(255) NOT NULL,
  success TINYINT(1) DEFAULT 1,
  error_message TEXT,
  finished_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (instance_id) REFERENCES instances(id)
);
