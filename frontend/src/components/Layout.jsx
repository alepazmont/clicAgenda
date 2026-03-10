import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Layout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: '#1976d2', color: '#fff', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 'bold' }}>ClicAgenda Panel</Link>
        <nav style={{ display: 'flex', gap: 16 }}>
          <Link to="/" style={{ color: '#fff', textDecoration: 'none' }}>Instancias</Link>
          <Link to="/instances/new" style={{ color: '#fff', textDecoration: 'none' }}>Nueva instancia</Link>
          <Link to="/debug" style={{ color: '#fff', textDecoration: 'none' }}>Debug</Link>
          <button type="button" onClick={handleLogout} style={{ background: 'transparent', border: '1px solid #fff', color: '#fff', padding: '6px 12px', borderRadius: 4, cursor: 'pointer' }}>Salir</button>
        </nav>
      </header>
      <main style={{ flex: 1, padding: 24 }}><Outlet /></main>
    </div>
  );
}
