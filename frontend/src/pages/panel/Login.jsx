import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import client from '../../api/client';
import AlertModal from '../../components/AlertModal';

export default function Login() {
  const [email, setEmail] = useState('admin@clicagenda.es');
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
      if (err.response?.data?.error) msg = err.response.data.error;
      else if (err.code === 'ERR_NETWORK' || !err.response) msg = 'No se puede conectar con la API. Comprueba DATABASE_URL y que el backend esté en marcha.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <p className="auth-kicker">ClicAgenda</p>
        <h1>Panel superadmin</h1>
        <p className="auth-lead">Accede a las tres clínicas demo desde un solo panel.</p>
        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
          <label>Contraseña</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" placeholder="changeme" />
          <AlertModal open={!!error} onClose={() => setError('')} variant="error" message={error} />
          <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Entrando…' : 'Entrar'}</button>
        </form>
        <p className="auth-hint">Demo: admin@clicagenda.es / changeme</p>
      </div>
    </div>
  );
}
