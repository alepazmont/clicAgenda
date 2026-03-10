import { Outlet, Link, useNavigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { useInstance } from '../context/InstanceContext';
import { useInstanceCompany } from '../context/InstanceCompanyContext';
import { isInstanceHost, getInstancePaths } from '../utils/instanceHost';

export default function InstanceLayout() {
  const { name, slug, clearInstance } = useInstance();
  const { theme, company } = useInstanceCompany();
  const navigate = useNavigate();
  const paths = getInstancePaths();
  const instanceOnly = isInstanceHost();
  const handleLogout = () => { clearInstance(); navigate(paths.loginPath); };
  const headerBg = theme?.palette?.primary?.main || '#2e7d32';

  return (
    <ThemeProvider theme={theme || { palette: { primary: { main: '#2e7d32' } } }}>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <header style={{ background: headerBg, color: '#fff', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <Link to={paths.dashboardPath} style={{ color: '#fff', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 10 }}>
            {company?.logo_url && <img src={`/api/uploads/${company.logo_url}`} alt="" style={{ maxHeight: 36, maxWidth: 120, objectFit: 'contain' }} />}
            <span>{name || 'Instancia'}</span>
          </Link>
        <nav style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Link to={paths.dashboardPath} style={{ color: '#fff', textDecoration: 'none' }}>Inicio</Link>
          <Link to={paths.citasPath} style={{ color: '#fff', textDecoration: 'none' }}>Citas</Link>
          <Link to={paths.pacientesPath} style={{ color: '#fff', textDecoration: 'none' }}>Pacientes</Link>
          <Link to={paths.serviciosPath} style={{ color: '#fff', textDecoration: 'none' }}>Servicios</Link>
          <Link to={paths.tratamientosPath} style={{ color: '#fff', textDecoration: 'none' }}>Tratamientos</Link>
          <Link to={paths.configPath} style={{ color: '#fff', textDecoration: 'none' }}>Configuración</Link>
          <Link to={paths.misCitasPath} style={{ color: '#fff', textDecoration: 'none' }}>Portal paciente</Link>
          <a href={paths.portalPath + (slug ? `?slug=${encodeURIComponent(slug)}` : '')} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'none' }}>Portal público</a>
          {!instanceOnly && <a href="/" style={{ color: '#fff', textDecoration: 'none' }}>Panel</a>}
          <button type="button" onClick={handleLogout} style={{ background: 'transparent', border: '1px solid #fff', color: '#fff', padding: '6px 12px', borderRadius: 4, cursor: 'pointer' }}>Salir</button>
        </nav>
      </header>
      <main style={{ flex: 1, padding: 24 }}><Outlet /></main>
    </div>
    </ThemeProvider>
  );
}
