#!/usr/bin/env node
/**
 * Aplica migraciones PostgreSQL (001_schema.sql) y seed demo.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const pg = require('../db/pg');

const MIGRATIONS_DIR = path.join(__dirname, '../migrations/postgres');

async function runMigrations() {
  const pool = pg.getPool();
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name VARCHAR(255) PRIMARY KEY,
        executed_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const name = file.replace('.sql', '');
      const done = await client.query('SELECT 1 FROM _migrations WHERE name = $1', [name]);
      if (done.rows.length) continue;
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      await client.query(sql);
      await client.query('INSERT INTO _migrations (name) VALUES ($1)', [name]);
      console.log('Migration applied:', name);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL requerida.');
    process.exit(1);
  }
  await runMigrations();
  const { spawnSync } = require('child_process');
  const seed = spawnSync('node', [path.join(__dirname, 'seed-demo.js')], {
    stdio: 'inherit',
    env: process.env,
  });
  process.exit(seed.status || 0);
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { runMigrations };
