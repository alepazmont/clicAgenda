const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const tenantPool = require('../../db/tenantPool');
const { authInstance } = require('../../middleware/authInstance');

const router = express.Router();

const UPLOADS_DIR = path.join(__dirname, '../../uploads');
function ensureUploadsDir(dir) {
  const full = path.join(UPLOADS_DIR, dir);
  if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
  return full;
}

const uploadCompanyLogo = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const slug = (req.tenant && req.tenant.slug) || 'default';
      const dir = ensureUploadsDir(path.join('company', slug));
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = (file.originalname && path.extname(file.originalname)) || '.jpg';
      cb(null, 'logo' + ext.toLowerCase());
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /^image\/(jpeg|png|gif|webp)$/i.test(file.mimetype);
    cb(null, !!ok);
  },
});

const uploadDocument = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const patientId = req.body && req.body.patient_id ? String(req.body.patient_id).replace(/\D/g, '') : '0';
      const dir = ensureUploadsDir(path.join('patients', patientId));
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const base = Date.now() + '_' + (file.originalname || 'file').replace(/[^a-zA-Z0-9.-]/g, '_');
      cb(null, base.slice(0, 200));
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.use(authInstance);

router.get('/stats', async (req, res) => {
  try {
    const db = req.tenant.dbName;
    const patientsRows = await tenantPool.queryTenant(db, 'SELECT COUNT(*) AS total FROM patients');
    const servicesRows = await tenantPool.queryTenant(db, 'SELECT COUNT(*) AS total FROM services');
    const appointmentsRows = await tenantPool.queryTenant(db, 'SELECT COUNT(*) AS total FROM appointments');
    const nextAppointments = await tenantPool.queryTenant(db,
      `SELECT a.id, a.start, a.end, a.status, p.name AS patient_name, s.name AS service_name 
       FROM appointments a LEFT JOIN patients p ON p.id = a.patient_id LEFT JOIN services s ON s.id = a.service_id 
       WHERE a.start >= NOW() ORDER BY a.start ASC LIMIT 5`);
    return res.json({
      patients: (patientsRows[0] && patientsRows[0].total) || 0,
      services: (servicesRows[0] && servicesRows[0].total) || 0,
      appointments: (appointmentsRows[0] && appointmentsRows[0].total) || 0,
      nextAppointments: nextAppointments || [],
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error al cargar estadisticas.' });
  }
});

router.get('/appointments', async (req, res) => {
  try {
    const rows = await tenantPool.queryTenant(req.tenant.dbName,
      `SELECT a.id, a.patient_id, a.service_id, a.start, a.end, a.status, a.payment_info, p.name AS patient_name, s.name AS service_name 
       FROM appointments a 
       LEFT JOIN patients p ON p.id = a.patient_id 
       LEFT JOIN services s ON s.id = a.service_id 
       ORDER BY a.start DESC LIMIT 500`);
    return res.json(rows);
  } catch (err) {
    console.error('Instance appointments error:', err);
    return res.status(500).json({ error: 'Error al listar citas.' });
  }
});

router.get('/appointments/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'ID invalido.' });
    let [row] = await tenantPool.queryTenant(req.tenant.dbName,
      `SELECT a.id, a.patient_id, a.service_id, a.start, a.end, a.status, a.payment_info, p.name AS patient_name, s.name AS service_name 
       FROM appointments a 
       LEFT JOIN patients p ON p.id = a.patient_id 
       LEFT JOIN services s ON s.id = a.service_id 
       WHERE a.id = ?`, [id]);
    if (!row) return res.status(404).json({ error: 'Cita no encontrada.' });
    try {
      const [r2] = await tenantPool.queryTenant(req.tenant.dbName,
        `SELECT a.id, a.patient_id, a.service_id, a.start, a.end, a.status, a.notes, a.payment_info, p.name AS patient_name, s.name AS service_name 
         FROM appointments a LEFT JOIN patients p ON p.id = a.patient_id LEFT JOIN services s ON s.id = a.service_id WHERE a.id = ?`, [id]);
      if (r2) row = r2;
    } catch (_) {}
    return res.json(row);
  } catch (err) {
    return res.status(500).json({ error: 'Error al cargar cita.' });
  }
});

router.get('/patients', async (req, res) => {
  try {
    const rows = await tenantPool.queryTenant(req.tenant.dbName,
      'SELECT id, name, email, phone, created_at FROM patients ORDER BY name LIMIT 500');
    return res.json(rows);
  } catch (err) {
    console.error('Instance patients error:', err);
    return res.status(500).json({ error: 'Error al listar pacientes.' });
  }
});

router.get('/patients/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'ID invalido.' });
    let [patient] = await tenantPool.queryTenant(req.tenant.dbName,
      'SELECT id, name, email, phone, created_at FROM patients WHERE id = ?', [id]);
    try {
      const [p] = await tenantPool.queryTenant(req.tenant.dbName,
        'SELECT id, name, email, phone, dni, address, birth_date, notes, created_at FROM patients WHERE id = ?', [id]);
      if (p) patient = p;
    } catch (_) {
      try {
        const [p] = await tenantPool.queryTenant(req.tenant.dbName,
          'SELECT id, name, email, phone, notes, created_at FROM patients WHERE id = ?', [id]);
        if (p) patient = p;
      } catch (_2) { /* columnas opcionales */ }
    }
    if (!patient) return res.status(404).json({ error: 'Paciente no encontrado.' });
    const appointments = await tenantPool.queryTenant(req.tenant.dbName,
      `SELECT a.id, a.start, a.end, a.status, p.name AS patient_name, s.name AS service_name 
       FROM appointments a LEFT JOIN patients p ON p.id = a.patient_id LEFT JOIN services s ON s.id = a.service_id 
       WHERE a.patient_id = ? ORDER BY a.start DESC LIMIT 100`, [id]);
    const patientServices = await tenantPool.queryTenant(req.tenant.dbName,
      `SELECT ps.id, ps.patient_id, ps.service_id, ps.remaining_sessions, ps.created_at, s.name AS service_name 
       FROM patient_services ps JOIN services s ON s.id = ps.service_id WHERE ps.patient_id = ?`, [id]);
    let treatments = [];
    let documents = [];
    try {
      treatments = await tenantPool.queryTenant(req.tenant.dbName,
        'SELECT id, patient_id, title, description, status, start_date, end_date, evolution_notes, created_at FROM medical_treatments WHERE patient_id = ? ORDER BY created_at DESC', [id]);
    } catch (_) { /* tabla puede no existir aún */ }
    try {
      documents = await tenantPool.queryTenant(req.tenant.dbName,
        'SELECT id, patient_id, name, description, file_path, document_type, created_at FROM medical_documents WHERE patient_id = ? ORDER BY created_at DESC', [id]);
    } catch (_) { /* tabla puede no existir aún */ }
    return res.json({
      ...patient,
      appointments: appointments || [],
      patient_services: patientServices || [],
      medical_treatments: treatments,
      medical_documents: documents,
    });
  } catch (err) {
    console.error('Instance patient detail error:', err);
    return res.status(500).json({ error: 'Error al cargar paciente.' });
  }
});

router.get('/services', async (req, res) => {
  try {
    const rows = await tenantPool.queryTenant(req.tenant.dbName, 'SELECT id, name, duration_minutes, price, created_at FROM services ORDER BY name');
    return res.json(rows);
  } catch (err) {
    console.error('Instance services error:', err);
    return res.status(500).json({ error: 'Error al listar servicios.' });
  }
});

router.get('/services/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'ID invalido.' });
    let [row] = await tenantPool.queryTenant(req.tenant.dbName, 'SELECT id, name, duration_minutes, price, created_at FROM services WHERE id = ?', [id]);
    if (!row) return res.status(404).json({ error: 'Servicio no encontrado.' });
    try {
      const [r2] = await tenantPool.queryTenant(req.tenant.dbName, 'SELECT id, name, duration_minutes, price, description, created_at FROM services WHERE id = ?', [id]);
      if (r2) row = r2;
    } catch (_) {}
    return res.json(row);
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener servicio.' });
  }
});

const COMPANY_EXTENDED = 'id, name, logo_url, colors, business_hours, professionals, address, phone, email, website, short_description, description, social_links, portal_enabled, portal_welcome_text, portal_cta_button, google_business_url, google_maps_embed_src';
const COMPANY_BASE = 'id, name, logo_url, colors, business_hours';

function parseCompany(row) {
  if (!row) return row;
  if (row.business_hours && typeof row.business_hours === 'string') try { row.business_hours = JSON.parse(row.business_hours); } catch (_) {}
  if (row.professionals && typeof row.professionals === 'string') try { row.professionals = JSON.parse(row.professionals); } catch (_) {}
  if (row.social_links && typeof row.social_links === 'string') try { row.social_links = JSON.parse(row.social_links); } catch (_) {}
  if (!Array.isArray(row.professionals)) row.professionals = [];
  return row;
}

router.post('/company/logo', uploadCompanyLogo.single('logo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se envió ningún archivo de imagen.' });
    const slug = (req.tenant && req.tenant.slug) || 'default';
    const relativePath = path.join('company', slug, req.file.filename).replace(/\\/g, '/');
    try {
      await tenantPool.queryTenant(req.tenant.dbName, 'UPDATE company SET logo_url = ? WHERE id = 1', [relativePath]);
    } catch (colErr) {
      if (colErr.code === 'ER_BAD_FIELD_ERROR') return res.status(400).json({ error: 'Actualiza la base de datos (migraciones).' });
      throw colErr;
    }
    let rows;
    try {
      rows = await tenantPool.queryTenant(req.tenant.dbName, `SELECT ${COMPANY_EXTENDED} FROM company LIMIT 1`);
    } catch (_) {
      rows = await tenantPool.queryTenant(req.tenant.dbName, `SELECT id, name, logo_url, colors, business_hours FROM company LIMIT 1`);
    }
    return res.json(parseCompany(rows[0] || {}));
  } catch (err) {
    console.error('Upload logo error:', err);
    return res.status(500).json({ error: 'Error al subir el logo.' });
  }
});

router.get('/company', async (req, res) => {
  try {
    let rows;
    try {
      rows = await tenantPool.queryTenant(req.tenant.dbName, `SELECT ${COMPANY_EXTENDED} FROM company LIMIT 1`);
    } catch (colErr) {
      if (colErr.code === 'ER_BAD_FIELD_ERROR') {
        try {
          rows = await tenantPool.queryTenant(req.tenant.dbName, `SELECT id, name, logo_url, colors, business_hours, professionals FROM company LIMIT 1`);
        } catch (e2) {
          rows = await tenantPool.queryTenant(req.tenant.dbName, `SELECT ${COMPANY_BASE} FROM company LIMIT 1`);
        }
      } else throw colErr;
    }
    return res.json(parseCompany(rows[0] || {}));
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener datos de la clinica.' });
  }
});

router.patch('/company', async (req, res) => {
  try {
    const {
      name, colors, business_hours, professionals,
      address, phone, email, website, short_description, description, social_links,
      portal_enabled, portal_welcome_text, portal_cta_button,
      google_business_url, google_maps_embed_src,
    } = req.body || {};
    const updates = [];
    const values = [];
    if (name !== undefined) { updates.push('name = ?'); values.push(name || null); }
    if (colors !== undefined) { updates.push('colors = ?'); values.push(typeof colors === 'object' ? JSON.stringify(colors) : (colors || null)); }
    if (business_hours !== undefined) { updates.push('business_hours = ?'); values.push(typeof business_hours === 'object' ? JSON.stringify(business_hours) : (business_hours || null)); }
    if (professionals !== undefined) { updates.push('professionals = ?'); values.push(Array.isArray(professionals) ? JSON.stringify(professionals) : (professionals || null)); }
    if (address !== undefined) { updates.push('address = ?'); values.push(address || null); }
    if (phone !== undefined) { updates.push('phone = ?'); values.push(phone || null); }
    if (email !== undefined) { updates.push('email = ?'); values.push(email || null); }
    if (website !== undefined) { updates.push('website = ?'); values.push(website || null); }
    if (short_description !== undefined) { updates.push('short_description = ?'); values.push(short_description || null); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description || null); }
    if (social_links !== undefined) { updates.push('social_links = ?'); values.push(typeof social_links === 'object' ? JSON.stringify(social_links) : (social_links || null)); }
    if (portal_enabled !== undefined) { updates.push('portal_enabled = ?'); values.push(portal_enabled ? 1 : 0); }
    if (portal_welcome_text !== undefined) { updates.push('portal_welcome_text = ?'); values.push(portal_welcome_text || null); }
    if (portal_cta_button !== undefined) { updates.push('portal_cta_button = ?'); values.push(portal_cta_button || null); }
    if (google_business_url !== undefined) { updates.push('google_business_url = ?'); values.push(google_business_url || null); }
    if (google_maps_embed_src !== undefined) { updates.push('google_maps_embed_src = ?'); values.push(google_maps_embed_src || null); }
    if (updates.length === 0) return res.status(400).json({ error: 'Nada que actualizar.' });
    values.push(1);
    await tenantPool.queryTenant(req.tenant.dbName, `UPDATE company SET ${updates.join(', ')} WHERE id = ?`, values);
    let rows;
    try {
      rows = await tenantPool.queryTenant(req.tenant.dbName, `SELECT ${COMPANY_EXTENDED} FROM company LIMIT 1`);
    } catch (selErr) {
      if (selErr.code === 'ER_BAD_FIELD_ERROR') {
        try {
          rows = await tenantPool.queryTenant(req.tenant.dbName, 'SELECT id, name, logo_url, colors, business_hours, professionals FROM company LIMIT 1');
        } catch (_) {
          rows = await tenantPool.queryTenant(req.tenant.dbName, `SELECT ${COMPANY_BASE} FROM company LIMIT 1`);
        }
      } else throw selErr;
    }
    return res.json(parseCompany(rows[0] || {}));
  } catch (err) {
    return res.status(500).json({ error: 'Error al actualizar datos de la clinica.' });
  }
});

router.get('/appointment-requests', async (req, res) => {
  try {
    const rows = await tenantPool.queryTenant(req.tenant.dbName,
      `SELECT ar.id, ar.name, ar.email, ar.phone, ar.service_id, ar.preferred_date, ar.message, ar.status, ar.created_at, s.name AS service_name
       FROM appointment_requests ar LEFT JOIN services s ON s.id = ar.service_id ORDER BY ar.created_at DESC LIMIT 200`);
    return res.json(rows || []);
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') return res.json([]);
    return res.status(500).json({ error: 'Error al listar solicitudes.' });
  }
});

router.post('/patients', async (req, res) => {
  try {
    const { name, email, phone, dni, address, birth_date } = req.body || {};
    if (!name || !String(name).trim()) return res.status(400).json({ error: 'Nombre requerido.' });
    const [result] = await tenantPool.queryTenant(req.tenant.dbName,
      'INSERT INTO patients (name, email, phone) VALUES (?, ?, ?)',
      [String(name).trim(), (email && String(email).trim()) || null, (phone && String(phone).trim()) || null]);
    const id = result.insertId;
    if (dni !== undefined || address !== undefined || birth_date !== undefined) {
      try {
        const up = []; const v = [];
        if (dni !== undefined) { up.push('dni = ?'); v.push((dni && String(dni).trim()) || null); }
        if (address !== undefined) { up.push('address = ?'); v.push((address && String(address).trim()) || null); }
        if (birth_date !== undefined) { up.push('birth_date = ?'); v.push(birth_date || null); }
        if (up.length) { v.push(id); await tenantPool.queryTenant(req.tenant.dbName, `UPDATE patients SET ${up.join(', ')} WHERE id = ?`, v); }
      } catch (_) { /* columnas opcionales */ }
    }
    let [row] = await tenantPool.queryTenant(req.tenant.dbName, 'SELECT id, name, email, phone, created_at FROM patients WHERE id = ?', [id]);
    try {
      const [r2] = await tenantPool.queryTenant(req.tenant.dbName, 'SELECT id, name, email, phone, dni, address, birth_date, created_at FROM patients WHERE id = ?', [id]);
      if (r2) row = r2;
    } catch (_) {}
    return res.status(201).json(row);
  } catch (err) {
    console.error('Instance create patient error:', err);
    return res.status(500).json({ error: 'Error al crear paciente.' });
  }
});

router.delete('/patients/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'ID invalido.' });
    const r = await tenantPool.queryTenant(req.tenant.dbName, 'DELETE FROM patients WHERE id = ?', [id]);
    if (!r || r.affectedRows === 0) return res.status(404).json({ error: 'Paciente no encontrado.' });
    return res.status(204).send();
  } catch (err) {
    console.error('Instance delete patient error:', err);
    return res.status(500).json({ error: 'Error al eliminar paciente.' });
  }
});

router.put('/patients/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'ID invalido.' });
    const { name, email, phone, notes, dni, address, birth_date } = req.body || {};
    const updates = [];
    const values = [];
    if (name !== undefined) { updates.push('name = ?'); values.push(String(name).trim()); }
    if (email !== undefined) { updates.push('email = ?'); values.push(email != null ? String(email).trim() : null); }
    if (phone !== undefined) { updates.push('phone = ?'); values.push(phone != null ? String(phone).trim() : null); }
    if (notes !== undefined) { updates.push('notes = ?'); values.push(notes != null ? String(notes) : null); }
    if (dni !== undefined) { updates.push('dni = ?'); values.push(dni != null ? String(dni).trim() : null); }
    if (address !== undefined) { updates.push('address = ?'); values.push(address != null ? String(address).trim() : null); }
    if (birth_date !== undefined) { updates.push('birth_date = ?'); values.push(birth_date || null); }
    if (updates.length === 0) return res.status(400).json({ error: 'Nada que actualizar.' });
    values.push(id);
    await tenantPool.queryTenant(req.tenant.dbName, `UPDATE patients SET ${updates.join(', ')} WHERE id = ?`, values);
    const [row] = await tenantPool.queryTenant(req.tenant.dbName, 'SELECT id, name, email, phone, dni, address, birth_date, notes, created_at FROM patients WHERE id = ?', [id]);
    if (!row) return res.status(404).json({ error: 'Paciente no encontrado.' });
    return res.json(row);
  } catch (err) {
    return res.status(500).json({ error: 'Error al actualizar paciente.' });
  }
});

router.post('/services', async (req, res) => {
  try {
    const { name, duration_minutes, price, description } = req.body || {};
    if (!name || !String(name).trim()) return res.status(400).json({ error: 'Nombre del servicio requerido.' });
    const duration = duration_minutes != null ? parseInt(duration_minutes, 10) : 30;
    const priceVal = price != null && price !== '' ? parseFloat(price) : null;
    try {
      const [result] = await tenantPool.queryTenant(req.tenant.dbName,
        'INSERT INTO services (name, duration_minutes, price, description) VALUES (?, ?, ?, ?)',
        [String(name).trim(), isNaN(duration) ? 30 : duration, priceVal, (description && String(description).trim()) || null]);
      const [row] = await tenantPool.queryTenant(req.tenant.dbName, 'SELECT id, name, duration_minutes, price, description, created_at FROM services WHERE id = ?', [result.insertId]);
      return res.status(201).json(row || { id: result.insertId, name: name.trim(), duration_minutes: duration, price: priceVal, description: description || null });
    } catch (insErr) {
      if (insErr.code === 'ER_BAD_FIELD_ERROR') {
        const [result] = await tenantPool.queryTenant(req.tenant.dbName,
          'INSERT INTO services (name, duration_minutes, price) VALUES (?, ?, ?)',
          [String(name).trim(), isNaN(duration) ? 30 : duration, priceVal]);
        const [row] = await tenantPool.queryTenant(req.tenant.dbName, 'SELECT id, name, duration_minutes, price, created_at FROM services WHERE id = ?', [result.insertId]);
        return res.status(201).json(row);
      }
      throw insErr;
    }
  } catch (err) {
    return res.status(500).json({ error: 'Error al crear servicio.' });
  }
});

router.delete('/services/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'ID invalido.' });
    const r = await tenantPool.queryTenant(req.tenant.dbName, 'DELETE FROM services WHERE id = ?', [id]);
    if (!r || r.affectedRows === 0) return res.status(404).json({ error: 'Servicio no encontrado.' });
    return res.status(204).send();
  } catch (err) {
    console.error('Instance delete service error:', err);
    return res.status(500).json({ error: 'Error al eliminar servicio.' });
  }
});

router.put('/services/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'ID invalido.' });
    const { name, duration_minutes, price, description } = req.body || {};
    const updates = [];
    const values = [];
    if (name !== undefined) { updates.push('name = ?'); values.push(String(name).trim()); }
    if (duration_minutes !== undefined) { updates.push('duration_minutes = ?'); values.push(parseInt(duration_minutes, 10) || 30); }
    if (price !== undefined) { updates.push('price = ?'); values.push(price === '' || price == null ? null : parseFloat(price)); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description != null ? String(description) : null); }
    if (updates.length === 0) return res.status(400).json({ error: 'Nada que actualizar.' });
    values.push(id);
    await tenantPool.queryTenant(req.tenant.dbName, `UPDATE services SET ${updates.join(', ')} WHERE id = ?`, values);
    let [row] = await tenantPool.queryTenant(req.tenant.dbName, 'SELECT id, name, duration_minutes, price, created_at FROM services WHERE id = ?', [id]);
    try {
      const [r2] = await tenantPool.queryTenant(req.tenant.dbName, 'SELECT id, name, duration_minutes, price, description, created_at FROM services WHERE id = ?', [id]);
      if (r2) row = r2;
    } catch (_) {}
    if (!row) return res.status(404).json({ error: 'Servicio no encontrado.' });
    return res.json(row);
  } catch (err) {
    return res.status(500).json({ error: 'Error al actualizar servicio.' });
  }
});

router.post('/appointments', async (req, res) => {
  try {
    const { patient_id, service_id, start, end, user_id, notes } = req.body || {};
    const uid = req.instanceUser && req.instanceUser.id ? req.instanceUser.id : null;
    const userId = user_id != null ? parseInt(user_id, 10) : uid;
    if (!patient_id || !service_id || !start) return res.status(400).json({ error: 'Paciente, servicio e inicio requeridos.' });
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date(startDate.getTime() + 30 * 60 * 1000);
    if (isNaN(startDate.getTime())) return res.status(400).json({ error: 'Fecha de inicio invalida.' });
    try {
      const [result] = await tenantPool.queryTenant(req.tenant.dbName,
        'INSERT INTO appointments (patient_id, user_id, service_id, start, end, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [parseInt(patient_id, 10), userId, parseInt(service_id, 10), startDate, endDate, 'scheduled', (notes && String(notes).trim()) || null]);
      const [row] = await tenantPool.queryTenant(req.tenant.dbName,
        `SELECT a.id, a.start, a.end, a.status, a.notes, p.name AS patient_name, s.name AS service_name 
         FROM appointments a LEFT JOIN patients p ON p.id = a.patient_id LEFT JOIN services s ON s.id = a.service_id WHERE a.id = ?`, [result.insertId]);
      return res.status(201).json(row);
    } catch (insErr) {
      if (insErr.code === 'ER_BAD_FIELD_ERROR') {
        const [result] = await tenantPool.queryTenant(req.tenant.dbName,
          'INSERT INTO appointments (patient_id, user_id, service_id, start, end, status) VALUES (?, ?, ?, ?, ?, ?)',
          [parseInt(patient_id, 10), userId, parseInt(service_id, 10), startDate, endDate, 'scheduled']);
        const [row] = await tenantPool.queryTenant(req.tenant.dbName,
          `SELECT a.id, a.start, a.end, a.status, p.name AS patient_name, s.name AS service_name 
           FROM appointments a LEFT JOIN patients p ON p.id = a.patient_id LEFT JOIN services s ON s.id = a.service_id WHERE a.id = ?`, [result.insertId]);
        return res.status(201).json(row);
      }
      throw insErr;
    }
  } catch (err) {
    console.error('Instance create appointment error:', err);
    return res.status(500).json({ error: 'Error al crear cita.' });
  }
});

router.put('/appointments/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'ID invalido.' });
    const { start, end, status, notes } = req.body || {};
    const updates = [];
    const values = [];
    if (start !== undefined) { updates.push('start = ?'); values.push(new Date(start)); }
    if (end !== undefined) { updates.push('end = ?'); values.push(new Date(end)); }
    if (status !== undefined) { updates.push('status = ?'); values.push(String(status)); }
    if (notes !== undefined) { updates.push('notes = ?'); values.push(notes != null ? String(notes) : null); }
    if (updates.length === 0) return res.status(400).json({ error: 'Nada que actualizar.' });
    values.push(id);
    await tenantPool.queryTenant(req.tenant.dbName, `UPDATE appointments SET ${updates.join(', ')} WHERE id = ?`, values);
    const [row] = await tenantPool.queryTenant(req.tenant.dbName,
      `SELECT a.id, a.start, a.end, a.status, p.name AS patient_name, s.name AS service_name 
       FROM appointments a LEFT JOIN patients p ON p.id = a.patient_id LEFT JOIN services s ON s.id = a.service_id WHERE a.id = ?`, [id]);
    if (!row) return res.status(404).json({ error: 'Cita no encontrada.' });
    return res.json(row);
  } catch (err) {
    return res.status(500).json({ error: 'Error al actualizar cita.' });
  }
});

router.delete('/appointments/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'ID invalido.' });
    const r = await tenantPool.queryTenant(req.tenant.dbName, 'DELETE FROM appointments WHERE id = ?', [id]);
    if (!r || r.affectedRows === 0) return res.status(404).json({ error: 'Cita no encontrada.' });
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: 'Error al eliminar cita.' });
  }
});

router.put('/appointments/:id/payment', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'ID invalido.' });
    const { tipoPago, cantidad, idBono } = req.body || {};
    if (!tipoPago) return res.status(400).json({ error: 'Tipo de pago requerido.' });
    const db = req.tenant.dbName;
    const [app] = await tenantPool.queryTenant(db, 'SELECT id, patient_id FROM appointments WHERE id = ?', [id]);
    if (!app) return res.status(404).json({ error: 'Cita no encontrada.' });
    let paymentInfo = { tipoPago, cantidad: tipoPago === 'Bono' ? 0 : (parseFloat(cantidad) || 0), paidAt: new Date().toISOString() };
    if (tipoPago === 'Bono' && idBono) {
      paymentInfo.idBono = parseInt(idBono, 10);
      const [ps] = await tenantPool.queryTenant(db, 'SELECT id, remaining_sessions FROM patient_services WHERE id = ? AND patient_id = ?', [paymentInfo.idBono, app.patient_id]);
      if (!ps || (ps.remaining_sessions || 0) < 1) return res.status(400).json({ error: 'Bono no disponible o sin sesiones.' });
      await tenantPool.queryTenant(db, 'UPDATE patient_services SET remaining_sessions = remaining_sessions - 1 WHERE id = ?', [paymentInfo.idBono]);
    }
    try {
      await tenantPool.queryTenant(db, 'UPDATE appointments SET payment_info = ? WHERE id = ?', [JSON.stringify(paymentInfo), id]);
    } catch (e) {
      if (e.code === 'ER_BAD_FIELD_ERROR') return res.status(501).json({ error: 'Pagos no disponibles. Ejecute migraciones.' });
      throw e;
    }
    const [row] = await tenantPool.queryTenant(db,
      `SELECT a.id, a.start, a.end, a.status, a.payment_info, p.name AS patient_name, s.name AS service_name 
       FROM appointments a LEFT JOIN patients p ON p.id = a.patient_id LEFT JOIN services s ON s.id = a.service_id WHERE a.id = ?`, [id]);
    return res.json(row);
  } catch (err) {
    console.error('Instance appointment payment error:', err);
    return res.status(500).json({ error: 'Error al registrar pago.' });
  }
});

// --- Patient services (bonos) ---
router.get('/patient_services', async (req, res) => {
  try {
    const patientId = req.query.patient_id ? parseInt(req.query.patient_id, 10) : null;
    let sql = `SELECT ps.id, ps.patient_id, ps.service_id, ps.remaining_sessions, ps.created_at, s.name AS service_name, s.duration_minutes 
               FROM patient_services ps JOIN services s ON s.id = ps.service_id`;
    const params = [];
    if (patientId) { sql += ' WHERE ps.patient_id = ?'; params.push(patientId); }
    sql += ' ORDER BY ps.created_at DESC';
    const rows = await tenantPool.queryTenant(req.tenant.dbName, sql, params);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: 'Error al listar bonos.' });
  }
});

router.post('/patient_services', async (req, res) => {
  try {
    const { patient_id, service_id, remaining_sessions } = req.body || {};
    if (!patient_id || !service_id) return res.status(400).json({ error: 'Paciente y servicio requeridos.' });
    const sessions = remaining_sessions != null ? parseInt(remaining_sessions, 10) : 1;
    const [result] = await tenantPool.queryTenant(req.tenant.dbName,
      'INSERT INTO patient_services (patient_id, service_id, remaining_sessions) VALUES (?, ?, ?)',
      [parseInt(patient_id, 10), parseInt(service_id, 10), isNaN(sessions) ? 1 : sessions]);
    const [row] = await tenantPool.queryTenant(req.tenant.dbName,
      'SELECT ps.id, ps.patient_id, ps.service_id, ps.remaining_sessions, ps.created_at, s.name AS service_name FROM patient_services ps JOIN services s ON s.id = ps.service_id WHERE ps.id = ?', [result.insertId]);
    return res.status(201).json(row);
  } catch (err) {
    return res.status(500).json({ error: 'Error al asignar bono.' });
  }
});

router.put('/patient_services/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'ID invalido.' });
    const { remaining_sessions } = req.body || {};
    if (remaining_sessions === undefined) return res.status(400).json({ error: 'remaining_sessions requerido.' });
    const n = parseInt(remaining_sessions, 10);
    await tenantPool.queryTenant(req.tenant.dbName, 'UPDATE patient_services SET remaining_sessions = ? WHERE id = ?', [n, id]);
    const [row] = await tenantPool.queryTenant(req.tenant.dbName,
      'SELECT ps.id, ps.patient_id, ps.service_id, ps.remaining_sessions, ps.created_at, s.name AS service_name FROM patient_services ps JOIN services s ON s.id = ps.service_id WHERE ps.id = ?', [id]);
    if (!row) return res.status(404).json({ error: 'Bono no encontrado.' });
    return res.json(row);
  } catch (err) {
    return res.status(500).json({ error: 'Error al actualizar bono.' });
  }
});

router.delete('/patient_services/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'ID invalido.' });
    const r = await tenantPool.queryTenant(req.tenant.dbName, 'DELETE FROM patient_services WHERE id = ?', [id]);
    if (r.affectedRows === 0) return res.status(404).json({ error: 'Bono no encontrado.' });
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: 'Error al eliminar bono.' });
  }
});

// --- Medical treatments ---
router.get('/medical_treatments', async (req, res) => {
  try {
    const patientId = req.query.patient_id ? parseInt(req.query.patient_id, 10) : null;
    let sql = 'SELECT id, patient_id, title, description, status, start_date, end_date, evolution_notes, created_at FROM medical_treatments';
    const params = [];
    if (patientId) { sql += ' WHERE patient_id = ?'; params.push(patientId); }
    sql += ' ORDER BY created_at DESC';
    const rows = await tenantPool.queryTenant(req.tenant.dbName, sql, params);
    return res.json(rows);
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') return res.json([]);
    return res.status(500).json({ error: 'Error al listar tratamientos.' });
  }
});

router.get('/medical_treatments/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'ID invalido.' });
    const [row] = await tenantPool.queryTenant(req.tenant.dbName, 'SELECT id, patient_id, title, description, status, start_date, end_date, evolution_notes, created_at FROM medical_treatments WHERE id = ?', [id]);
    if (!row) return res.status(404).json({ error: 'Tratamiento no encontrado.' });
    return res.json(row);
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') return res.status(501).json({ error: 'Tratamientos no disponibles.' });
    return res.status(500).json({ error: 'Error al obtener tratamiento.' });
  }
});

router.post('/medical_treatments', async (req, res) => {
  try {
    const { patient_id, title, description, status, start_date, end_date } = req.body || {};
    if (!patient_id || !title || !String(title).trim()) return res.status(400).json({ error: 'Paciente y título requeridos.' });
    const [result] = await tenantPool.queryTenant(req.tenant.dbName,
      'INSERT INTO medical_treatments (patient_id, title, description, status, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)',
      [parseInt(patient_id, 10), String(title).trim(), description || null, (status && String(status).trim()) || 'active', start_date || null, end_date || null]);
    const [row] = await tenantPool.queryTenant(req.tenant.dbName, 'SELECT id, patient_id, title, description, status, start_date, end_date, evolution_notes, created_at FROM medical_treatments WHERE id = ?', [result.insertId]);
    return res.status(201).json(row);
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') return res.status(501).json({ error: 'Tratamientos no disponibles.' });
    return res.status(500).json({ error: 'Error al crear tratamiento.' });
  }
});

router.put('/medical_treatments/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'ID invalido.' });
    const { title, description, status, start_date, end_date, evolution_notes } = req.body || {};
    const updates = [];
    const values = [];
    if (title !== undefined) { updates.push('title = ?'); values.push(String(title).trim()); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (status !== undefined) { updates.push('status = ?'); values.push(String(status)); }
    if (start_date !== undefined) { updates.push('start_date = ?'); values.push(start_date || null); }
    if (end_date !== undefined) { updates.push('end_date = ?'); values.push(end_date || null); }
    if (evolution_notes !== undefined) { updates.push('evolution_notes = ?'); values.push(evolution_notes); }
    if (updates.length === 0) return res.status(400).json({ error: 'Nada que actualizar.' });
    values.push(id);
    await tenantPool.queryTenant(req.tenant.dbName, `UPDATE medical_treatments SET ${updates.join(', ')} WHERE id = ?`, values);
    const [row] = await tenantPool.queryTenant(req.tenant.dbName, 'SELECT id, patient_id, title, description, status, start_date, end_date, evolution_notes, created_at FROM medical_treatments WHERE id = ?', [id]);
    if (!row) return res.status(404).json({ error: 'Tratamiento no encontrado.' });
    return res.json(row);
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') return res.status(501).json({ error: 'Tratamientos no disponibles.' });
    return res.status(500).json({ error: 'Error al actualizar tratamiento.' });
  }
});

router.delete('/medical_treatments/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'ID invalido.' });
    const r = await tenantPool.queryTenant(req.tenant.dbName, 'DELETE FROM medical_treatments WHERE id = ?', [id]);
    if (r.affectedRows === 0) return res.status(404).json({ error: 'Tratamiento no encontrado.' });
    return res.status(204).send();
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') return res.status(501).json({ error: 'Tratamientos no disponibles.' });
    return res.status(500).json({ error: 'Error al eliminar tratamiento.' });
  }
});

// --- Medical documents ---
router.get('/medical_documents', async (req, res) => {
  try {
    const patientId = req.query.patient_id ? parseInt(req.query.patient_id, 10) : null;
    if (!patientId) return res.status(400).json({ error: 'patient_id requerido.' });
    const rows = await tenantPool.queryTenant(req.tenant.dbName, 'SELECT id, patient_id, name, description, file_path, document_type, created_at FROM medical_documents WHERE patient_id = ? ORDER BY created_at DESC', [patientId]);
    return res.json(rows);
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') return res.json([]);
    return res.status(500).json({ error: 'Error al listar documentos.' });
  }
});

router.post('/medical_documents/upload', uploadDocument.single('file'), async (req, res) => {
  try {
    const patientId = req.body && parseInt(req.body.patient_id, 10);
    const name = req.body && String(req.body.name || '').trim();
    if (!patientId || !name) return res.status(400).json({ error: 'Paciente y nombre requeridos.' });
    if (!req.file) return res.status(400).json({ error: 'No se envió ningún archivo.' });
    const relativePath = path.join('patients', String(patientId), req.file.filename).replace(/\\/g, '/');
    const description = (req.body && req.body.description) ? String(req.body.description).trim() : null;
    const documentType = (req.body && req.body.document_type) ? String(req.body.document_type).trim() : 'other';
    const [result] = await tenantPool.queryTenant(req.tenant.dbName,
      'INSERT INTO medical_documents (patient_id, name, description, file_path, document_type) VALUES (?, ?, ?, ?, ?)',
      [patientId, name, description, relativePath, documentType]);
    const [row] = await tenantPool.queryTenant(req.tenant.dbName, 'SELECT id, patient_id, name, description, file_path, document_type, created_at FROM medical_documents WHERE id = ?', [result.insertId]);
    return res.status(201).json(row);
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') return res.status(501).json({ error: 'Documentos no disponibles.' });
    console.error('Upload document error:', err);
    return res.status(500).json({ error: 'Error al subir el documento.' });
  }
});

router.post('/medical_documents', async (req, res) => {
  try {
    const { patient_id, name, description, document_type } = req.body || {};
    if (!patient_id || !name || !String(name).trim()) return res.status(400).json({ error: 'Paciente y nombre requeridos.' });
    const [result] = await tenantPool.queryTenant(req.tenant.dbName,
      'INSERT INTO medical_documents (patient_id, name, description, document_type) VALUES (?, ?, ?, ?)',
      [parseInt(patient_id, 10), String(name).trim(), description || null, (document_type && String(document_type).trim()) || 'other']);
    const [row] = await tenantPool.queryTenant(req.tenant.dbName, 'SELECT id, patient_id, name, description, file_path, document_type, created_at FROM medical_documents WHERE id = ?', [result.insertId]);
    return res.status(201).json(row);
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') return res.status(501).json({ error: 'Documentos no disponibles.' });
    return res.status(500).json({ error: 'Error al crear documento.' });
  }
});

router.delete('/medical_documents/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'ID invalido.' });
    const r = await tenantPool.queryTenant(req.tenant.dbName, 'DELETE FROM medical_documents WHERE id = ?', [id]);
    if (r.affectedRows === 0) return res.status(404).json({ error: 'Documento no encontrado.' });
    return res.status(204).send();
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') return res.status(501).json({ error: 'Documentos no disponibles.' });
    return res.status(500).json({ error: 'Error al eliminar documento.' });
  }
});

module.exports = router;
