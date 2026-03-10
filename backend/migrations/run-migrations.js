const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');
const config = require('../config');

const MASTER_DIR = path.join(__dirname, 'master');
const INSTANCE_DIR = path.join(__dirname, 'instance');

function getMigrationFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

async function runMasterMigrations() {
  const pool = mysql.createPool({
    host: config.masterDb.host,
    port: config.masterDb.port,
    user: config.masterDb.user,
    password: config.masterDb.password,
    database: config.masterDb.database,
    multipleStatements: true,
  });

  const conn = await pool.getConnection();
  try {
    await conn.query(
      "CREATE TABLE IF NOT EXISTS _migrations (name VARCHAR(255) PRIMARY KEY, executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"
    );
    const files = getMigrationFiles(MASTER_DIR);
    for (const file of files) {
      const name = file.replace('.sql', '');
      const [rows] = await conn.query('SELECT 1 FROM _migrations WHERE name = ?', [name]);
      if (rows.length) continue;
      const sql = fs.readFileSync(path.join(MASTER_DIR, file), 'utf8');
      await conn.query(sql);
      await conn.query('INSERT INTO _migrations (name) VALUES (?)', [name]);
      console.log('Master migration applied:', name);
    }
  } finally {
    conn.release();
    await pool.end();
  }
}

async function runInstanceMigrations(dbName) {
  const pool = mysql.createPool({
    host: config.masterDb.host,
    port: config.masterDb.port,
    user: config.masterDb.user,
    password: config.masterDb.password,
    database: dbName,
    multipleStatements: true,
  });

  const conn = await pool.getConnection();
  try {
    await conn.query(
      "CREATE TABLE IF NOT EXISTS migrations (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL UNIQUE, executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"
    );
    const files = getMigrationFiles(INSTANCE_DIR);
    for (const file of files) {
      const name = file.replace('.sql', '');
      const [rows] = await conn.query('SELECT 1 FROM migrations WHERE name = ?', [name]);
      if (rows.length) continue;
      const sql = fs.readFileSync(path.join(INSTANCE_DIR, file), 'utf8');
      await conn.query(sql);
      await conn.query('INSERT INTO migrations (name) VALUES (?)', [name]);
      console.log('Instance migration applied:', name, 'to', dbName);
    }
  } finally {
    conn.release();
    await pool.end();
  }
}

async function main() {
  const mode = process.argv[2];
  if (mode === 'master') {
    await runMasterMigrations();
    console.log('Master migrations done.');
  } else if (mode === 'instance') {
    const dbName = process.argv[3];
    if (!dbName) {
      console.error('Usage: node run-migrations.js instance <db_name>');
      process.exit(1);
    }
    await runInstanceMigrations(dbName);
    console.log('Instance migrations done for', dbName);
  } else {
    console.error('Usage: node run-migrations.js master | instance [db_name]');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { runMasterMigrations, runInstanceMigrations };
