const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const config = require('./config');

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const panelAuth = require('./routes/panel/auth');
const panelInstances = require('./routes/panel/instances');
const panelDebug = require('./routes/panel/debug');
const { resolveTenant } = require('./middleware/resolveTenant');
const instanceAuth = require('./routes/instance/auth');
const instanceData = require('./routes/instance/data');
const instancePublic = require('./routes/instance/public');

const app = express();

app.use(cors({ origin: config.frontendUrl || true, credentials: true }));
app.use(express.json());

app.use('/api/panel/auth', panelAuth);
app.use('/api/panel/instances', panelInstances);
app.use('/api/panel/debug', panelDebug);

app.get('/api/health', (req, res) => res.json({ ok: true, app: config.appName }));

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

const port = config.port;
app.listen(port, () => {
  console.log(`${config.appName} backend (Fase 0) en http://localhost:${port}`);
});
