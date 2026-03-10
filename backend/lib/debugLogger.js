/**
 * Logger de debug: consola y/o archivo según configuración (solo superadmin).
 * scope: 'all' | grupo (ej. 'citas') | funcionalidad (ej. 'citas.calendario')
 */
const fs = require('fs');
const path = require('path');
const masterDb = require('../db/master');

const CACHE_MS = 60000;
const LOG_DIR = process.env.DEBUG_LOG_DIR || path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'debug.log');

let cache = { rules: [], at: 0 };
let instanceId = null;

function setContext(instanceIdForLogger) {
  instanceId = instanceIdForLogger;
}

async function loadRules() {
  const now = Date.now();
  if (cache.rules.length && now - cache.at < CACHE_MS) return cache.rules;
  try {
    const rows = await masterDb.query(
      'SELECT scope_type, scope_key, console_enabled, file_enabled FROM debug_settings WHERE (instance_id IS NULL AND ? IS NULL) OR instance_id = ?',
      [instanceId, instanceId]
    );
    cache = { rules: rows || [], at: now };
    return cache.rules;
  } catch (e) {
    cache = { rules: [], at: now };
    return [];
  }
}

function clearCache() {
  cache = { rules: [], at: 0 };
}

function shouldLog(scope, output) {
  const rules = cache.rules;
  const parts = scope.split('.');
  const group = parts[0];
  for (const r of rules) {
    const en = output === 'console' ? r.console_enabled : r.file_enabled;
    if (!en) continue;
    if (r.scope_key === 'all') return true;
    if (r.scope_type === 'group' && r.scope_key === group) return true;
    if (r.scope_type === 'feature' && r.scope_key === scope) return true;
  }
  return false;
}

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
}

function writeToFile(scope, level, message, meta = {}) {
  try {
    ensureLogDir();
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      scope,
      level,
      message,
      ...meta,
    }) + '\n';
    fs.appendFileSync(LOG_FILE, line);
  } catch (e) {
    console.error('debugLogger writeToFile:', e.message);
  }
}

async function log(scope, message, level = 'info', meta = {}) {
  const rules = await loadRules();
  const toConsole = shouldLog(scope, 'console');
  const toFile = shouldLog(scope, 'file');
  if (!toConsole && !toFile) return;
  const prefix = `[debug ${scope}]`;
  if (toConsole) {
    const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    fn(prefix, message, meta && Object.keys(meta).length ? meta : '');
  }
  if (toFile) writeToFile(scope, level, message, meta);
}

module.exports = { log, loadRules, clearCache, setContext };
