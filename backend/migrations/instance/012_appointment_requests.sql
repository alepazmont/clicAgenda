-- Solicitudes de cita desde el portal público (pacientes no registrados)

CREATE TABLE IF NOT EXISTS appointment_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(64) DEFAULT NULL,
  service_id INT DEFAULT NULL,
  preferred_date DATE DEFAULT NULL,
  message TEXT DEFAULT NULL,
  status VARCHAR(32) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
);
