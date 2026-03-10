-- Notas médicas en ficha de paciente (ejecutar una vez; si la columna existe, ignorar error)
ALTER TABLE patients ADD COLUMN notes TEXT NULL;
