const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const tenantPool = require('../../db/tenantPool');
const config = require('../../config');
const { authInstance } = require('../../middleware/authInstance');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email y contrasena requeridos.' });
    if (!req.tenant) return res.status(400).json({ error: 'Instancia no resuelta.' });

    const dbName = req.tenant.instanceId;
    const users = await tenantPool.queryTenant(dbName, 'SELECT id, email, password_hash, name, role FROM users WHERE email = ? LIMIT 1', [email]);
    if (!users.length) return res.status(401).json({ error: 'Credenciales incorrectas.' });

    const user = users[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Credenciales incorrectas.' });

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role, instanceId: req.tenant.instanceId },
      config.jwt.secret,
      { expiresIn: '8h' }
    );
    return res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    console.error('Instance login error:', err);
    return res.status(500).json({ error: 'Error en el login.' });
  }
});

router.get('/me', authInstance, async (req, res) => {
  if (req.instanceUser.role === 'superadmin') return res.json(req.instanceUser);
  try {
    const rows = await tenantPool.queryTenant(req.tenant.instanceId, 'SELECT id, email, name, role, company_id FROM users WHERE id = ?', [req.instanceUser.id]);
    if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado.' });
    return res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener usuario.' });
  }
});

module.exports = router;
