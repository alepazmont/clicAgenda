/**
 * Crea la BBDD maestra si no existe.
 * Usa las mismas credenciales que config (sin database).
 * Ejecutar desde backend con: node scripts/create-master-db.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

const dbName = process.env.DB_MASTER_DATABASE || 'citas_master';

async function main() {
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
    console.log('BBDD maestra OK:', dbName);
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  if (e.code === 'ECONNREFUSED') {
    console.error('\nNo se puede conectar a MySQL. Arranca MySQL (ej. docker-compose up -d mysql) y revisa backend/.env.\n');
  } else {
    console.error(e);
  }
  process.exit(1);
});
