require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL || '';

module.exports = {
  env: process.env.NODE_ENV || 'development',
  appName: process.env.APP_NAME || 'ClicAgenda',
  port: process.env.BACKEND_PORT || 5001,
  databaseUrl,
  dbSsl: process.env.DB_SSL === 'true' || /neon\.tech|supabase\.co|vercel-storage\.com/i.test(databaseUrl),

  jwt: {
    secret: process.env.JWT_SECRET || 'change-me',
    superadminTokenSecret: process.env.SUPERADMIN_TOKEN_SECRET || 'change-me-superadmin',
  },

  panelUrl: process.env.PANEL_URL || process.env.FRONTEND_URL || 'http://localhost:5174',
  frontendUrl: process.env.FRONTEND_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:5174',
};
