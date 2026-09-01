/**
 * Host de instancia = subdominio de clínica (ej. demo_dental.ejemplo.com).
 * En localhost y en el deploy único de Vercel la app es el panel; la instancia va bajo /app.
 */
function getIsInstanceHost() {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  if (h === 'localhost' || h === '127.0.0.1') return false;
  // Demo / portfolio: un solo dominio (panel + /app)
  if (h === 'clicagenda.vercel.app' || h.endsWith('.vercel.app')) return false;
  // Subdominio de tenant: al menos 3 etiquetas (a.b.c)
  return h.split('.').length >= 3;
}

export function isInstanceHost() {
  return getIsInstanceHost();
}

export function getInstancePaths() {
  const base = getIsInstanceHost() ? '' : '/app';
  return {
    basePath: base,
    loginPath: base + '/login',
    dashboardPath: base + '/dashboard',
    citasPath: base + '/citas',
    pacientesPath: base + '/pacientes',
    serviciosPath: base + '/servicios',
    tratamientosPath: base + '/tratamientos',
    configPath: base + '/admin/configuracion',
    usuariosPath: base + '/admin/usuarios',
    misCitasPath: base + '/mis-citas',
    miPerfilPath: base + '/mi-perfil',
    contactoPath: base + '/contacto',
    portalPath: base + '/portal',
  };
}
