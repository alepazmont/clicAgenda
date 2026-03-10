/**
 * Gestor de pools por tenant (instancia).
 * Fase 0: implementación mínima; bajo demanda se crea pool por db_name.
 * Techo global y LRU según ESTRATEGIA_BBDD_Y_MIGRACIONES.md se añadirán después.
 */
const mysql = require('mysql2/promise');
const config = require('../config');

const pools = new Map();
const maxPerTenant = parseInt(process.env.DB_POOL_MAX_PER_TENANT || '3', 10);

function getTenantPool(dbName) {
  if (!pools.has(dbName)) {
    pools.set(dbName, mysql.createPool({
      host: config.masterDb.host,
      port: config.masterDb.port,
      user: config.masterDb.user,
      password: config.masterDb.password,
      database: dbName,
      waitForConnections: true,
      connectionLimit: maxPerTenant,
      queueLimit: 0,
      charset: 'utf8mb4',
    }));
  }
  return pools.get(dbName);
}

async function queryTenant(dbName, sql, params = []) {
  const pool = getTenantPool(dbName);
  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function getTenantConnection(dbName) {
  return getTenantPool(dbName).getConnection();
}

module.exports = { getTenantPool, queryTenant, getTenantConnection };
