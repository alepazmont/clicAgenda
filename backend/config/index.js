require('dotenv').config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  appName: process.env.APP_NAME || 'ClicAgenda',
  port: process.env.BACKEND_PORT || 5001,

  masterDb: {
    host: process.env.DB_MASTER_HOST || 'localhost',
    port: parseInt(process.env.DB_MASTER_PORT || '3306', 10),
    user: process.env.DB_MASTER_USER || 'clicagenda',
    password: process.env.DB_MASTER_PASSWORD || 'clicagenda',
    database: process.env.DB_MASTER_DATABASE || 'citas_master',
  },

  instancePrefix: process.env.DB_INSTANCE_PREFIX || 'citas_',

  jwt: {
    secret: process.env.JWT_SECRET || 'change-me',
    superadminTokenSecret: process.env.SUPERADMIN_TOKEN_SECRET || 'change-me-superadmin',
  },

  panelUrl: process.env.PANEL_URL || process.env.FRONTEND_URL || 'http://localhost:5174',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5174',
};
