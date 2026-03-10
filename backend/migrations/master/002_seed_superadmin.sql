-- Seed: un superadmin por defecto (solo si no existe ninguno)
-- Password: changeme (cambiar en producción)
-- Hash bcrypt para 'changeme'
INSERT INTO superadmins (email, password_hash, name)
SELECT 'admin@clicagenda.es', '$2a$10$vCCxlamo4f5ZgWq89NuFjeh9Bl/pXCVhuTmXEcfsPRzEq7.8hQaA6', 'Superadmin'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM superadmins LIMIT 1);
