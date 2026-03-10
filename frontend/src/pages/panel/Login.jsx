import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import client from '../../api/client';
import AlertModal from '../../components/AlertModal';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await client.post('/panel/auth/login', { email, password });
      login(data.token);
      navigate('/', { replace: true });
    } catch (err) {
      let msg = 'Error al iniciar sesión.';
      if (err.response && err.response.data && err.response.data.error) {
        msg = err.response.data.error;
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        msg = 'No se puede conectar con el servidor. Comprueba que el backend esté en marcha y que MySQL esté activo.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h1 style={{ marginTop: 0 }}>ClicAgenda Panel</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4 }}>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: 8 }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4 }}>Contrasena</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: 8 }} />
        </div>
        <AlertModal open={!!error} onClose={() => setError('')} variant="error" message={error} />
        <button type="submit" disabled={loading} style={{ width: '100%', padding: 10, background: '#1976d2', color: '#fff', border: 0, borderRadius: 4, cursor: 'pointer' }}>{loading ? 'Entrando...' : 'Entrar'}</button>
      </form>
      <p style={{ marginTop: 16, fontSize: 12, color: '#888' }}>Por defecto: admin@clicagenda.es / changeme</p>
    </div>
  );
}
