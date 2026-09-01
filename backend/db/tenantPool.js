const pg = require('./pg');

function normalizeRows(rows) {
  if (!Array.isArray(rows)) return rows;
  return rows.map((row) => {
    if (!row || typeof row !== 'object') return row;
    const next = { ...row };
    if (next.start_time != null && next.start == null) next.start = next.start_time;
    if (next.end_time != null && next.end == null) next.end = next.end_time;
    return next;
  });
}

async function withTenantContext(instanceId, fn) {
  const client = await pg.getPool().connect();
  try {
    await client.query('BEGIN');
    // neondb_owner tiene BYPASSRLS; el rol app aplica las políticas RLS.
    await client.query('SET LOCAL ROLE clicagenda_app');
    await client.query(`SELECT set_config('app.instance_id', $1, true)`, [String(instanceId)]);
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function runTenantQuery(client, sql, params = []) {
  const pgSql = pg.pgifySql(sql);
  const { sql: converted, params: convertedParams } = pg.convertPlaceholders(pgSql, params);
  const trimmed = converted.trim().toUpperCase();
  let finalSql = converted;
  if (trimmed.startsWith('INSERT') && !/RETURNING/i.test(converted)) {
    finalSql = `${converted.replace(/;\s*$/, '')} RETURNING id`;
  }
  return client.query(finalSql, convertedParams);
}

async function queryTenant(instanceId, sql, params = []) {
  return withTenantContext(instanceId, async (client) => {
    const result = await runTenantQuery(client, sql, params);
    const trimmed = pg.pgifySql(sql).trim().toUpperCase();
    if (trimmed.startsWith('SELECT')) {
      return normalizeRows(result.rows);
    }
    if (trimmed.startsWith('INSERT')) {
      return [{ insertId: result.rows[0]?.id ?? null, affectedRows: result.rowCount }];
    }
    return { affectedRows: result.rowCount, insertId: null };
  });
}

async function getTenantConnection(instanceId) {
  const client = await pg.getPool().connect();
  await client.query(`SELECT set_config('app.instance_id', $1, false)`, [String(instanceId)]);
  return client;
}

module.exports = { queryTenant, getTenantConnection };
