const pg = require('./pg');

async function query(sql, params = []) {
  return pg.query(sql, params);
}

async function getConnection() {
  return pg.getPool().connect();
}

module.exports = { query, getConnection };
