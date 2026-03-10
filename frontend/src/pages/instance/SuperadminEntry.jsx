import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import client from '../../api/client';
import AlertModal from '../../components/AlertModal';
import { useInstance } from '../../context/InstanceContext';
import { getInstancePaths } from '../../utils/instanceHost';

const STORAGE_KEY = 'clicagenda_instance_superadmin';

export default function SuperadminEntry() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setInstance } = useInstance();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading');
  const [instance, setInstanceLocal] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Falta el token en la URL.');
      setStatus('error');
      return;
    }
    client
      .get('/panel/instances/enter/validate', { params: { token } })
      .then((res) => {
        const { instanceId, name, slug, instanceToken } = res.data;
        setInstanceLocal({ instanceId, name, slug });
        setInstance({ slug, name, instanceToken });
        try {
          const storage = typeof localStorage !== 'undefined' ? localStorage : sessionStorage;
          storage.setItem(STORAGE_KEY, JSON.stringify({ token, instanceId, slug, name, instanceToken, at: Date.now() }));
        } catch (_) {}
        setStatus('ok');
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Token inválido o expirado.');
        setStatus('error');
      });
  }, [token, setInstance]);

  useEffect(() => {
    if (status === 'ok') navigate(getInstancePaths().dashboardPath, { replace: true });
  }, [status, navigate]);

  if (status === 'loading') {
    return (
      <div style={{ maxWidth: 480, margin: '80px auto', padding: 24, textAlign: 'center' }}>
        <p>Comprobando acceso a la instancia...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ maxWidth: 480, margin: '80px auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h1 style={{ marginTop: 0 }}>Entrada a instancia</h1>
        <AlertModal open={!!error} onClose={() => setError('')} variant="error" message={error} />
        <p>No se pudo validar el enlace. El token puede haber expirado (válido 5 minutos).</p>
        <Link to="/" style={{ color: '#1976d2' }}>Volver al panel</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: '80px auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h1 style={{ marginTop: 0 }}>Entrada a instancia</h1>
      <p>Has entrado como superadmin en la instancia <strong>{instance && instance.name ? instance.name : ''}</strong>.</p>
      <p style={{ color: '#666', fontSize: 14 }}>Redirigiendo a la app de la instancia...</p>
      <Link to={getInstancePaths().dashboardPath} style={{ display: 'inline-block', marginTop: 16, padding: '10px 20px', background: '#2e7d32', color: '#fff', borderRadius: 4, textDecoration: 'none' }}>Ir a la instancia</Link>
      <span style={{ marginLeft: 12 }} />
      <Link to="/" style={{ display: 'inline-block', marginTop: 16, padding: '10px 20px', background: '#1976d2', color: '#fff', borderRadius: 4, textDecoration: 'none' }}>Volver al panel</Link>
    </div>
  );
}
