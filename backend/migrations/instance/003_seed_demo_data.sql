-- Datos de ejemplo para instancias demo (opcional; no falla si ya existen)
INSERT INTO patients (name, email, phone) VALUES
  ('Maria Garcia', 'maria@ejemplo.com', '612000001'),
  ('Juan Lopez', 'juan@ejemplo.com', '612000002'),
  ('Ana Martinez', 'ana@ejemplo.com', '612000003')
ON DUPLICATE KEY UPDATE name = name;

INSERT INTO services (name, duration_minutes, price) VALUES
  ('Consulta general', 30, 45.00),
  ('Revision', 20, 25.00),
  ('Seguimiento', 15, 20.00)
ON DUPLICATE KEY UPDATE name = name;

-- Una cita de ejemplo si no hay citas (primer paciente, primer servicio, usuario 1)
INSERT INTO appointments (patient_id, user_id, service_id, start, end, status)
SELECT (SELECT id FROM patients LIMIT 1), 1, (SELECT id FROM services LIMIT 1), DATE_ADD(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 30 MINUTE, 'scheduled'
FROM DUAL
WHERE (SELECT COUNT(*) FROM appointments) = 0 AND (SELECT COUNT(*) FROM patients) > 0 AND (SELECT COUNT(*) FROM services) > 0;
