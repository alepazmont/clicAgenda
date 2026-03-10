const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const masterDb = require('../../db/master');
const config = require('../../config');
const { authSuperadmin } = require('../../middleware/authSuperadmin');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos.' });
    }

    const users = await masterDb.query(
      'SELECT id, email, password_hash, name FROM superadmins WHERE email = ? LIMIT 1',
      [email]
    );

    if (!users.length) {
      return res.status(401).json({ error: 'Credenciales incorrectas.' });
    }

    const user = users[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales incorrectas.' });
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: 'superadmin' },
      config.jwt.secret,
      { expiresIn: '8h' }
    );

    return res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    console.error('Panel login error:', err);
    return res.status(500).json({ error: 'Error en el login.' });
  }
});

router.get('/me', authSuperadmin, async (req, res) => {
  try {
    const users = await masterDb.query(
      'SELECT id, email, name, created_at FROM superadmins WHERE id = ? LIMIT 1',
      [req.superadmin.id]
    );
    if (!users.length) return res.status(404).json({ error: 'Usuario no encontrado.' });
    return res.json(users[0]);
  } catch (err) {
    console.error('Panel me error:', err);
    return res.status(500).json({ error: 'Error al obtener usuario.' });
  }
});

module.exports = router;
