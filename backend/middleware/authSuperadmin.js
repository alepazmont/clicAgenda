const jwt = require('jsonwebtoken');
const config = require('../config');

function authSuperadmin(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'No autorizado. Token requerido.' });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    if (decoded.role !== 'superadmin') {
      return res.status(403).json({ error: 'Acceso denegado.' });
    }
    req.superadmin = { id: decoded.sub, email: decoded.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
}

module.exports = { authSuperadmin };
