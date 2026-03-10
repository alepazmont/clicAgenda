-- Grupos y funcionalidades para el catálogo (y pestaña Debug)
INSERT INTO feature_groups (id, key_name, name_es, description) VALUES
(1, 'citas', 'Citas', 'Calendario y reservas'),
(2, 'pacientes', 'Pacientes', 'Fichas y listados'),
(3, 'servicios_bonos', 'Servicios y bonos', 'Servicios y consumo')
ON DUPLICATE KEY UPDATE name_es = VALUES(name_es);

INSERT INTO features (feature_group_id, key_name, name_es, description)
SELECT 1, 'calendario', 'Calendario', 'Vista de agenda' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM features WHERE feature_group_id = 1 AND key_name = 'calendario');
INSERT INTO features (feature_group_id, key_name, name_es, description)
SELECT 1, 'reserva_online', 'Reserva online', 'Reserva por el paciente' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM features WHERE feature_group_id = 1 AND key_name = 'reserva_online');
INSERT INTO features (feature_group_id, key_name, name_es, description)
SELECT 2, 'ficha', 'Ficha paciente', 'Datos del paciente' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM features WHERE feature_group_id = 2 AND key_name = 'ficha');
INSERT INTO features (feature_group_id, key_name, name_es, description)
SELECT 2, 'listado', 'Listado', 'Listado de pacientes' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM features WHERE feature_group_id = 2 AND key_name = 'listado');
INSERT INTO features (feature_group_id, key_name, name_es, description)
SELECT 3, 'servicios', 'Servicios', 'Catálogo de servicios' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM features WHERE feature_group_id = 3 AND key_name = 'servicios');
INSERT INTO features (feature_group_id, key_name, name_es, description)
SELECT 3, 'bonos', 'Bonos', 'Bonos y sesiones' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM features WHERE feature_group_id = 3 AND key_name = 'bonos');
