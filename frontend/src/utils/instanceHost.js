/**
 * En subdominio (ej. demo_medico.localhost) la app es solo de la instancia: rutas sin /app.
 * En localhost la app es el panel y la instancia va bajo /app.
 */
function getIsInstanceHost() {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return h !== 'localhost' && h !== '127.0.0.1';
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
