const jwt = require('jsonwebtoken');
const config = require('../config');

function authInstance(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No autorizado. Token requerido.' });
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    if (decoded.role === 'superadmin') {
      req.instanceUser = { id: decoded.sub, email: decoded.email, role: 'superadmin', instanceId: decoded.instanceId };
      return next();
    }
    if (decoded.instanceId !== req.tenant.instanceId) return res.status(403).json({ error: 'Token no valido para esta instancia.' });
    req.instanceUser = { id: decoded.sub, email: decoded.email, role: decoded.role, instanceId: decoded.instanceId };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalido o expirado.' });
  }
}

module.exports = { authInstance };
