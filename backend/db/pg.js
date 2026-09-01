const { Pool } = require('pg');
const config = require('../config');

let pool = null;

function getPool() {
  if (!pool) {
    const connectionString = config.databaseUrl;
    if (!connectionString) {
      throw new Error('DATABASE_URL no configurada.');
    }
    pool = new Pool({
      connectionString,
      ssl: config.dbSsl ? { rejectUnauthorized: false } : undefined,
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    });
  }
  return pool;
}

function convertPlaceholders(sql, params = []) {
  let index = 0;
  const converted = sql.replace(/\?/g, () => {
    index += 1;
    return `$${index}`;
  });
  return { sql: converted, params };
}

function pgifySql(sql) {
  return sql
    .replace(/\ba\.start\b/g, 'a.start_time')
    .replace(/\ba\.end\b/g, 'a.end_time')
    .replace(/appointments \(([^)]*?)start, end/g, 'appointments ($1start_time, end_time')
    .replace(/\(patient_id, user_id, service_id, start, end/g, '(patient_id, user_id, service_id, start_time, end_time')
    .replace(/\bstart = \?/g, 'start_time = ?')
    .replace(/\bend = \?/g, 'end_time = ?')
    .replace(/ORDER BY a\.start\b/g, 'ORDER BY a.start_time')
    .replace(/WHERE a\.start\b/g, 'WHERE a.start_time')
    .replace(/`([^`]+)`/g, '"$1"');
}

async function query(sql, params = []) {
  const pgSql = pgifySql(sql);
  const { sql: converted, params: convertedParams } = convertPlaceholders(pgSql, params);
  const result = await getPool().query(converted, convertedParams);
  return result.rows;
}

async function execute(sql, params = []) {
  const pgSql = pgifySql(sql);
  const { sql: converted, params: convertedParams } = convertPlaceholders(pgSql, params);
  return getPool().query(converted, convertedParams);
}

module.exports = { getPool, query, execute, convertPlaceholders, pgifySql };
