/**
 * Resolución de tenant por slug (header/body) o dominio legacy.
 */
const masterDb = require('../db/master');
const config = require('../config');

async function resolveTenant(req, res, next) {
  const host = req.get('x-forwarded-host') || req.get('host') || req.hostname || '';
  const baseHost = host.split(':')[0];
  const rawSlug = req.get('x-instance-slug') || req.query.slug || req.body?.instanceSlug;
  const slugHeader = rawSlug && String(rawSlug).trim();

  try {
    let rows;
    if (slugHeader) {
      rows = await masterDb.query(
        `SELECT id, slug, db_name, name, state, specialty FROM instances
         WHERE slug = ? AND state IN ('active', 'trial', 'development')
         LIMIT 1`,
        [slugHeader]
      );
    } else {
      rows = await masterDb.query(
        `SELECT id, slug, db_name, name, state, specialty FROM instances
         WHERE (domain_value = ? OR domain_value = ?) AND state IN ('active', 'trial', 'development')
         LIMIT 1`,
        [baseHost, host]
      );
    }

    if (!rows || rows.length === 0) {
      const msg = !slugHeader
        ? 'Indica el slug de la instancia (ej. demo_dental).'
        : 'Instancia no encontrada';
      return res.status(404).json({
        error: msg,
        redirect: config.panelUrl || config.frontendUrl,
      });
    }

    const instance = rows[0];
    if (instance.state === 'suspended' || instance.state === 'baja') {
      return res.status(403).json({ error: 'Instancia suspendida.' });
    }

    req.tenant = {
      instanceId: instance.id,
      slug: instance.slug,
      dbName: instance.db_name,
      name: instance.name || instance.slug,
      specialty: instance.specialty,
    };
    next();
  } catch (err) {
    console.error('resolveTenant error:', err);
    return res.status(500).json({ error: 'Error al resolver instancia.' });
  }
}

module.exports = { resolveTenant };
