/**
 * Rutas públicas de la instancia (sin autenticación).
 * Requieren resolveTenant (por Host o x-instance-slug).
 */
const express = require('express');
const tenantPool = require('../../db/tenantPool');

const router = express.Router();

const COMPANY_EXTENDED_COLS = 'id, name, logo_url, colors, business_hours, professionals, address, phone, email, website, short_description, description, social_links, portal_enabled, portal_welcome_text, portal_cta_button, google_business_url, google_maps_embed_src';
const COMPANY_BASE_COLS = 'id, name, logo_url, colors, business_hours';

function parseCompanyRow(row) {
  if (!row) return row;
  if (row.business_hours && typeof row.business_hours === 'string') {
    try { row.business_hours = JSON.parse(row.business_hours); } catch (_) {}
  }
  if (row.professionals && typeof row.professionals === 'string') {
    try { row.professionals = JSON.parse(row.professionals); } catch (_) {}
  }
  if (row.social_links && typeof row.social_links === 'string') {
    try { row.social_links = JSON.parse(row.social_links); } catch (_) {}
  }
  if (!Array.isArray(row.professionals)) row.professionals = [];
  if (row.portal_enabled === 0 || row.portal_enabled === '0') row.portal_enabled = false;
  return row;
}

/** Datos públicos de la empresa para el portal */
router.get('/company', async (req, res) => {
  try {
    let rows;
    try {
      rows = await tenantPool.queryTenant(req.tenant.dbName, `SELECT ${COMPANY_EXTENDED_COLS} FROM company LIMIT 1`);
    } catch (colErr) {
      if (colErr.code === 'ER_BAD_FIELD_ERROR') {
        rows = await tenantPool.queryTenant(req.tenant.dbName, `SELECT ${COMPANY_BASE_COLS} FROM company LIMIT 1`);
      } else throw colErr;
    }
    const row = parseCompanyRow(rows[0] || {});
    return res.json(row);
  } catch (err) {
    console.error('Public company error:', err);
    return res.status(500).json({ error: 'Error al cargar datos.' });
  }
});

/** Listado público de servicios (para selector en solicitud de cita) */
router.get('/services', async (req, res) => {
  try {
    const rows = await tenantPool.queryTenant(
      req.tenant.dbName,
      'SELECT id, name, duration_minutes, price FROM services ORDER BY name'
    );
    return res.json(rows || []);
  } catch (err) {
    console.error('Public services error:', err);
    return res.status(500).json({ error: 'Error al cargar servicios.' });
  }
});

/** Enviar solicitud de cita (portal) */
router.post('/appointment-request', async (req, res) => {
  try {
    const { name, email, phone, service_id, preferred_date, message } = req.body || {};
    if (!name || !String(name).trim()) return res.status(400).json({ error: 'El nombre es obligatorio.' });
    if (!email || !String(email).trim()) return res.status(400).json({ error: 'El email es obligatorio.' });

    let tableExists = true;
    try {
      await tenantPool.queryTenant(req.tenant.dbName, 'SELECT 1 FROM appointment_requests LIMIT 1');
    } catch (_) {
      tableExists = false;
    }
    if (!tableExists) {
      return res.status(503).json({ error: 'Las solicitudes de cita no están disponibles. Contacte por teléfono o email.' });
    }

    const serviceId = service_id ? parseInt(service_id, 10) : null;
    const prefDate = preferred_date && String(preferred_date).trim() ? String(preferred_date).trim() : null;

    await tenantPool.queryTenant(req.tenant.dbName,
      `INSERT INTO appointment_requests (name, email, phone, service_id, preferred_date, message, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [String(name).trim(), String(email).trim(), (phone && String(phone).trim()) || null, serviceId, prefDate, (message && String(message).trim()) || null]
    );
    return res.status(201).json({ success: true, message: 'Solicitud enviada. Nos pondremos en contacto contigo.' });
  } catch (err) {
    console.error('Appointment request error:', err);
    return res.status(500).json({ error: 'Error al enviar la solicitud.' });
  }
});

module.exports = router;
