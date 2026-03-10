const mysql = require('mysql2/promise');
const config = require('../config');

let pool = null;

function getMasterPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: config.masterDb.host,
      port: config.masterDb.port,
      user: config.masterDb.user,
      password: config.masterDb.password,
      database: config.masterDb.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4',
    });
  }
  return pool;
}

async function query(sql, params = []) {
  const p = getMasterPool();
  const [rows] = await p.execute(sql, params);
  return rows;
}

async function getConnection() {
  return getMasterPool().getConnection();
}

module.exports = { getMasterPool, query, getConnection };
