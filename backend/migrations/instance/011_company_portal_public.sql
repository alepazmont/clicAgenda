-- Más datos de empresa y configuración del portal público

ALTER TABLE company
  ADD COLUMN address VARCHAR(512) DEFAULT NULL,
  ADD COLUMN phone VARCHAR(64) DEFAULT NULL,
  ADD COLUMN email VARCHAR(255) DEFAULT NULL,
  ADD COLUMN website VARCHAR(512) DEFAULT NULL,
  ADD COLUMN short_description VARCHAR(500) DEFAULT NULL,
  ADD COLUMN description TEXT DEFAULT NULL,
  ADD COLUMN social_links JSON DEFAULT NULL,
  ADD COLUMN portal_enabled TINYINT(1) DEFAULT 1,
  ADD COLUMN portal_welcome_text TEXT DEFAULT NULL,
  ADD COLUMN portal_cta_button VARCHAR(100) DEFAULT 'Solicitar cita';
