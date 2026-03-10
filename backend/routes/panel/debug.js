const express = require('express');
const masterDb = require('../../db/master');
const { authSuperadmin } = require('../../middleware/authSuperadmin');
const debugLogger = require('../../lib/debugLogger');

const router = express.Router();
const PANEL_INSTANCE_ID = null;

router.use(authSuperadmin);

router.get('/settings', async (req, res) => {
  try {
    const rows = await masterDb.query(
      'SELECT scope_type, scope_key, console_enabled, file_enabled FROM debug_settings WHERE instance_id IS NULL ORDER BY scope_type, scope_key'
    );
    return res.json(rows);
  } catch (err) {
    console.error('debug settings get:', err);
    return res.status(500).json({ error: 'Error al obtener configuración de debug.' });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const rules = req.body.rules || [];
    await masterDb.query('DELETE FROM debug_settings WHERE instance_id IS NULL');
    for (const r of rules) {
      const scopeType = r.scope_type || 'all';
      const scopeKey = r.scope_key || 'all';
      const consoleEnabled = r.console_enabled ? 1 : 0;
      const fileEnabled = r.file_enabled ? 1 : 0;
      await masterDb.query(
        'INSERT INTO debug_settings (instance_id, scope_type, scope_key, console_enabled, file_enabled) VALUES (NULL, ?, ?, ?, ?)',
        [scopeType, scopeKey, consoleEnabled, fileEnabled]
      );
    }
    debugLogger.clearCache();
    return res.json({ ok: true });
  } catch (err) {
    console.error('debug settings put:', err);
    return res.status(500).json({ error: 'Error al guardar configuración de debug.' });
  }
});

router.get('/feature-groups', async (req, res) => {
  try {
    const groups = await masterDb.query('SELECT id, key_name, name_es, description FROM feature_groups ORDER BY key_name');
    const features = await masterDb.query('SELECT id, feature_group_id, key_name, name_es FROM features ORDER BY feature_group_id, key_name');
    const byGroup = {};
    for (const g of groups) {
      byGroup[g.key_name] = { id: g.id, name_es: g.name_es, description: g.description, features: [] };
    }
    for (const f of features) {
      const g = groups.find((x) => x.id === f.feature_group_id);
      if (g && byGroup[g.key_name]) {
        byGroup[g.key_name].features.push({ key: f.key_name, name_es: f.name_es, scope: g.key_name + '.' + f.key_name });
      }
    }
    return res.json(Object.entries(byGroup).map(([key, v]) => ({ key, ...v })));
  } catch (err) {
    console.error('debug feature-groups:', err);
    return res.status(500).json({ error: 'Error al cargar grupos de funcionalidades.' });
  }
});

router.post('/log', async (req, res) => {
  try {
    const { scope, message, level, meta } = req.body || {};
    if (!scope || message === undefined) return res.status(400).json({ error: 'scope y message requeridos.' });
    await debugLogger.log(scope, message, level || 'info', meta || {});
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Error al registrar log.' });
  }
});

module.exports = router;
