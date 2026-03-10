/**
 * Resolución de tenant por Host.
 * Consulta la BBDD maestra para obtener instance_id y db_name.
 * Si no hay instancia para ese host, responde 404 y redirección.
 */
const masterDb = require('../db/master');
const config = require('../config');

async function resolveTenant(req, res, next) {
  const host = req.get('x-forwarded-host') || req.get('host') || req.hostname || '';
  const baseHost = host.split(':')[0];
  const rawSlug = req.get('x-instance-slug') || req.body?.instanceSlug;
  const slugHeader = rawSlug && String(rawSlug).trim();

  try {
    let rows;
    const isPlainLocalhost = baseHost === 'localhost' || baseHost === '127.0.0.1';
    if (isPlainLocalhost && slugHeader) {
      const prefix = config.instancePrefix || 'citas_';
      const slugParam = slugHeader;
      const dbNameParam = slugHeader.startsWith(prefix) ? slugHeader : prefix + slugHeader;
      rows = await masterDb.query(
        `SELECT id, slug, db_name, name, state FROM instances 
         WHERE (slug = ? OR db_name = ?) AND state IN ('active', 'trial', 'development') 
         LIMIT 1`,
        [slugParam, dbNameParam]
      );
      if (!rows || rows.length === 0) {
        console.warn('[resolveTenant] localhost: slug=', slugHeader, 'dbNameParam=', dbNameParam, 'rows=', rows?.length ?? 0);
      }
    } else {
      rows = await masterDb.query(
        `SELECT id, slug, db_name, name, state FROM instances 
         WHERE (domain_value = ? OR domain_value = ?) AND state IN ('active', 'trial', 'development')
         LIMIT 1`,
        [baseHost, host]
      );
      if (!rows || rows.length === 0) {
        console.warn('[resolveTenant] by host: baseHost=', baseHost, 'host=', host, 'rows=', rows?.length ?? 0);
      }
    }

    if (!rows || rows.length === 0) {
      const msg = isPlainLocalhost && !slugHeader
        ? 'Indica el slug de la instancia (ej. demo_medico).'
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
    };
    next();
  } catch (err) {
    console.error('resolveTenant error:', err);
    return res.status(500).json({ error: 'Error al resolver instancia.' });
  }
}

module.exports = { resolveTenant };
