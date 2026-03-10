-- Usuario demo para entrar en la instancia (password: changeme)
INSERT INTO users (email, password_hash, name, role, company_id)
SELECT 'admin@demo.es', '$2a$10$vCCxlamo4f5ZgWq89NuFjeh9Bl/pXCVhuTmXEcfsPRzEq7.8hQaA6', 'Admin Demo', 'admin', 1
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@demo.es');
