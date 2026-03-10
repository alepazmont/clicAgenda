/**
 * Arranque completo: crea BBDD maestra, ejecuta migraciones maestra (tablas + seeds),
 * crea BBDD de la instancia demo y ejecuta migraciones de instancia.
 * Ejecutar desde backend: node scripts/setup-databases.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const { runMasterMigrations, runInstanceMigrations } = require('../migrations/run-migrations');

const masterDbName = process.env.DB_MASTER_DATABASE || 'citas_master';
const demoInstanceDb = 'citas_demo_medico';

async function createDatabaseIfNotExists(dbName) {
  const conn = await mysql.createConnection({
    host: process.env.DB_MASTER_HOST || 'localhost',
    port: parseInt(process.env.DB_MASTER_PORT || '3306', 10),
    user: process.env.DB_MASTER_USER || 'clicagenda',
    password: process.env.DB_MASTER_PASSWORD || 'clicagenda',
    multipleStatements: false,
  });
  try {
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log('BBDD creada o ya existe:', dbName);
  } finally {
    await conn.end();
  }
}

async function main() {
  console.log('1. Creando BBDD maestra...');
  await createDatabaseIfNotExists(masterDbName);

  console.log('2. Ejecutando migraciones maestra (tablas + superadmin + plan/plantilla/instancia demo)...');
  await runMasterMigrations();

  console.log('3. Creando BBDD de la instancia demo (citas_demo_medico)...');
  await createDatabaseIfNotExists(demoInstanceDb);

  console.log('4. Ejecutando migraciones de instancia en citas_demo_medico...');
  await runInstanceMigrations(demoInstanceDb);

  console.log('Listo. Puedes arrancar el backend y acceder al panel.');
  console.log('Login: admin@clicagenda.es / changeme');
  console.log('Instancia demo: slug demo_medico, dominio localhost');
}

function exitWithHelp(err) {
  if (err.code === 'ECONNREFUSED') {
    console.error('\nNo se puede conectar a MySQL (ECONNREFUSED).');
    console.error('  - Comprueba que MySQL esté en marcha.');
    console.error('  - Desde la raíz del proyecto base: docker-compose up -d mysql');
    console.error('  - O arranca MySQL local y revisa backend/.env (DB_MASTER_HOST, DB_MASTER_PORT, usuario y contraseña).\n');
  } else {
    console.error(err);
  }
  process.exit(1);
}

main().catch(exitWithHelp);
