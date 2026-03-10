-- BBDD para ClicAgenda nueva app (multi-instancia)
-- citas_master se crea por MYSQL_DATABASE; aquí añadimos la instancia demo.

CREATE DATABASE IF NOT EXISTS citas_demo_medico
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

GRANT ALL PRIVILEGES ON citas_demo_medico.* TO 'clicagenda'@'%';
FLUSH PRIVILEGES;
