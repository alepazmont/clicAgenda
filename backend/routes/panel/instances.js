const express = require('express');
const jwt = require('jsonwebtoken');
const masterDb = require('../../db/master');
const config = require('../../config');
const { authSuperadmin } = require('../../middleware/authSuperadmin');
const { seedNewInstance } = require('../../lib/seedInstance');

const router = express.Router();

function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

router.get('/enter/validate', async (req, res) => {
  try {
    const token = req.query.token || req.body?.token;
    if (!token) return res.status(400).json({ error: 'Token requerido.' });
    const decoded = jwt.verify(token, config.jwt.superadminTokenSecret);
    if (!decoded.oneTime || !decoded.instanceId) return res.status(401).json({ error: 'Token inválido.' });
    const [inst] = await masterDb.query('SELECT id, name, slug FROM instances WHERE id = ?', [decoded.instanceId]);
    if (!inst) return res.status(404).json({ error: 'Instancia no encontrada.' });
    const instanceToken = jwt.sign(
      { sub: 0, email: 'superadmin', role: 'superadmin', instanceId: inst.id },
      config.jwt.secret,
      { expiresIn: '8h' }
    );
    return res.json({ valid: true, instanceId: inst.id, name: inst.name, slug: inst.slug, instanceToken });
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
});

router.use(authSuperadmin);

router.get('/', async (req, res) => {
  try {
    const rows = await masterDb.query(
      `SELECT i.id, i.name, i.slug, i.db_name, i.state, i.contact_email, i.specialty, i.created_at, p.name AS plan_name
       FROM instances i
       LEFT JOIN plans p ON p.id = i.plan_id
       ORDER BY i.created_at DESC`
    );
    return res.json(rows);
  } catch (err) {
    console.error('List instances error:', err);
    return res.status(500).json({ error: 'Error al listar instancias.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, slug: slugInput, contact_email, plan_id, template_id, domain_type, domain_value, specialty } = req.body || {};
    if (!name) return res.status(400).json({ error: 'Nombre requerido.' });

    const slug = slugInput ? slugify(slugInput) : slugify(name);
    const dbName = `tenant_${slug}`;

    const existing = await masterDb.query('SELECT id FROM instances WHERE slug = ? OR db_name = ?', [slug, dbName]);
    if (existing.length) {
      return res.status(400).json({ error: 'Ya existe una instancia con ese nombre o slug.' });
    }

    const planId = plan_id || null;
    const templateId = template_id || null;
    const domainType = domain_type || 'path';
    const domainValue = domain_value || slug;

    const inserted = await masterDb.query(
      `INSERT INTO instances (name, slug, db_name, domain_type, domain_value, plan_id, template_id, state, contact_email, specialty)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
       RETURNING id, name, slug, db_name, state, created_at`,
      [name, slug, dbName, domainType, domainValue, planId, templateId, contact_email || null, specialty || 'general']
    );

    await seedNewInstance(inserted[0].id, name, slug, specialty || 'general');
    return res.status(201).json(inserted[0]);
  } catch (err) {
    console.error('Create instance error:', err);
    return res.status(500).json({ error: err.message || 'Error al crear instancia.' });
  }
});

router.post('/:id/enter', async (req, res) => {
  try {
    const instanceId = parseInt(req.params.id, 10);
    const [inst] = await masterDb.query('SELECT id, slug, domain_value FROM instances WHERE id = ?', [instanceId]);
    if (!inst) return res.status(404).json({ error: 'Instancia no encontrada.' });

    const signed = jwt.sign(
      { instanceId: inst.id, slug: inst.slug, oneTime: true },
      config.jwt.superadminTokenSecret,
      { expiresIn: '5m' }
    );

    const panelBase = (config.panelUrl || config.frontendUrl || '').replace(/\/$/, '');
    const enterUrl = `${panelBase}/auth/superadmin?token=${signed}`;
    return res.json({ enterUrl, token: signed, slug: inst.slug });
  } catch (err) {
    console.error('Enter instance error:', err);
    return res.status(500).json({ error: 'Error al generar enlace.' });
  }
});

module.exports = router;
