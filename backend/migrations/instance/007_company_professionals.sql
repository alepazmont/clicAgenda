-- Añadir columna professionals (JSON) a company para lista de profesionales (nombre, rol/cargo)
ALTER TABLE company ADD COLUMN professionals JSON DEFAULT NULL;
