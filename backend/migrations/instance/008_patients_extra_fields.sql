-- Campos extra en pacientes (como en app de referencia: DNI, dirección, fecha nacimiento)
ALTER TABLE patients ADD COLUMN dni VARCHAR(32) NULL;
ALTER TABLE patients ADD COLUMN address TEXT NULL;
ALTER TABLE patients ADD COLUMN birth_date DATE NULL;
