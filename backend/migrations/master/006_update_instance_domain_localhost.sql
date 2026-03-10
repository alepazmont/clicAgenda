-- Actualizar instancias con domain_value = 'localhost' a subdominio slug.localhost (para desarrollo local)
UPDATE instances SET domain_value = CONCAT(slug, '.localhost') WHERE domain_value = 'localhost';
