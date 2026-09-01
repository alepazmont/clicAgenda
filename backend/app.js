const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const config = require('./config');

const uploadsDir = process.env.VERCEL
  ? path.join('/tmp', 'clicagenda-uploads')
  : path.join(__dirname, 'uploads');
try {
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
} catch (_) {
  // En serverless el FS puede ser de solo lectura fuera de /tmp.
}

const panelAuth = require('./routes/panel/auth');
const panelInstances = require('./routes/panel/instances');
const panelDebug = require('./routes/panel/debug');
const { resolveTenant } = require('./middleware/resolveTenant');
const instanceAuth = require('./routes/instance/auth');
const instanceData = require('./routes/instance/data');
const instancePublic = require('./routes/instance/public');

const app = express();

const allowedOrigins = [
  config.frontendUrl,
  config.panelUrl,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
].filter(Boolean);

app.use(cors({
  origin(origin, cb) {
    if (!origin || allowedOrigins.some((o) => origin === o || origin.startsWith(o.replace(/\/$/, '')))) {
      return cb(null, true);
    }
    if (config.env === 'development') return cb(null, true);
    return cb(null, true);
  },
  credentials: true,
}));
app.use(express.json());

app.use('/api/panel/auth', panelAuth);
app.use('/api/panel/instances', panelInstances);
app.use('/api/panel/debug', panelDebug);

app.get('/api/health', (req, res) => res.json({ ok: true, app: config.appName, db: config.databaseUrl ? 'configured' : 'missing' }));

app.get('/api/instance/resolve', resolveTenant, (req, res) => {
  res.json({ slug: req.tenant.slug, name: req.tenant.name });
});

app.use('/api/uploads', express.static(uploadsDir));
app.use('/api/instance/auth', resolveTenant, instanceAuth);
app.use('/api/instance/public', resolveTenant, instancePublic);
app.use('/api/instance/data', resolveTenant, instanceData);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno.' });
});

module.exports = app;
