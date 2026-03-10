-- Configuración de debug por ámbito (panel: instance_id NULL; instancias: instance_id = id)
CREATE TABLE IF NOT EXISTS debug_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  instance_id INT DEFAULT NULL,
  scope_type VARCHAR(32) NOT NULL,
  scope_key VARCHAR(128) NOT NULL DEFAULT 'all',
  console_enabled TINYINT(1) NOT NULL DEFAULT 1,
  file_enabled TINYINT(1) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_debug_scope (instance_id, scope_type, scope_key),
  FOREIGN KEY (instance_id) REFERENCES instances(id) ON DELETE CASCADE
);
