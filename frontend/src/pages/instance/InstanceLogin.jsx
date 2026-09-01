import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useInstance } from '../../context/InstanceContext';
import instanceClient from '../../api/instanceClient';
import AlertModal from '../../components/AlertModal';
import { isInstanceHost, getInstancePaths } from '../../utils/instanceHost';

export default function InstanceLogin() {
  const [searchParams] = useSearchParams();
  const slugFromUrl = searchParams.get('slug') || '';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [slugInput, setSlugInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resolvingHost, setResolvingHost] = useState(true);
  const { slug: storedSlug, token, setInstance } = useInstance();
  const navigate = useNavigate();
  const paths = getInstancePaths();
  const instanceOnly = isInstanceHost();

  const slug = (storedSlug || slugFromUrl || '').trim();
  const isStepChooseInstance = !slug && !instanceOnly;

  useEffect(() => {
    if (slugFromUrl && !storedSlug) {
      setInstance({ slug: slugFromUrl });
      setResolvingHost(false);
      return;
    }
    if (storedSlug) {
      setResolvingHost(false);
      return;
    }
    fetch('/api/instance/resolve')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (data && data.slug) setInstance({ slug: data.slug, name: data.name || data.slug });
      })
      .catch(() => {})
      .finally(() => setResolvingHost(false));
  }, [slugFromUrl, storedSlug, setInstance]);

  useEffect(() => {
    if (storedSlug && !slugInput) setSlugInput(storedSlug);
  }, [storedSlug, slugInput]);

  if (token && slug) {
    navigate(paths.dashboardPath, { replace: true });
    return null;
  }

  const handleChooseInstance = (e) => {
    e.preventDefault();
    setError('');
    const s = slugInput.trim();
    if (!s) {
      setError('Indica el identificador de la instancia (ej. demo_medico).');
      return;
    }
    setInstance({ slug: s });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await instanceClient.post(
        '/auth/login',
        { email: email.trim(), password, instanceSlug: slug },
        { headers: { 'X-Instance-Slug': slug } }
      );
      setInstance({
        slug,
        token: res.data.token,
        name: (res.data.user && res.data.user.name) ? res.data.user.name : 'Instancia',
      });
      navigate(paths.dashboardPath, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesion.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeInstance = () => {
    setInstance({ slug: null, token: null, name: null });
    setSlugInput('');
    setEmail('');
    setPassword('');
    setError('');
  };

  if (resolvingHost) {
    return (
      <div style={{ maxWidth: 400, margin: '80px auto', padding: 24, textAlign: 'center' }}>
        <p>Detectando instancia...</p>
      </div>
    );
  }

  if (instanceOnly && !slug) {
    return (
      <div style={{ maxWidth: 400, margin: '80px auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h1 style={{ marginTop: 0 }}>Instancia no encontrada</h1>
        <p style={{ color: '#666' }}>Esta direccion no corresponde a ninguna instancia. Comprueba la URL o contacta con el administrador.</p>
      </div>
    );
  }

  if (isStepChooseInstance) {
    return (
      <div style={{ maxWidth: 400, margin: '80px auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h1 style={{ marginTop: 0 }}>Elige tu instancia</h1>
        <p style={{ color: '#666', marginBottom: 20 }}>Indica el identificador de la instancia a la que quieres acceder.</p>
        <form onSubmit={handleChooseInstance}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Identificador de instancia</label>
            <input
              type="text"
              value={slugInput}
              onChange={(e) => setSlugInput(e.target.value)}
              placeholder="demo_dental, demo_psicologia o demo_fisioterapia"
              style={{ width: '100%', padding: 10 }}
              autoFocus
            />
          </div>
          <AlertModal open={!!error} onClose={() => setError('')} variant="error" message={error} />
          <button type="submit" style={{ width: '100%', padding: 10, background: '#2e7d32', color: '#fff', border: 0, borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>
            Continuar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h1 style={{ marginTop: 0 }}>Iniciar sesion</h1>
      <p style={{ color: '#666', marginBottom: 20 }}>Instancia: <strong>{slug}</strong></p>
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4 }}>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: 10 }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4 }}>Contrasena</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: 10 }} />
        </div>
        <AlertModal open={!!error} onClose={() => setError('')} variant="error" message={error} />
        <button type="submit" disabled={loading} style={{ width: '100%', padding: 10, background: '#2e7d32', color: '#fff', border: 0, borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      {!instanceOnly && (
        <button type="button" onClick={handleChangeInstance} style={{ marginTop: 16, padding: 8, background: 'transparent', border: 0, color: '#666', cursor: 'pointer', fontSize: 14 }}>
          Usar otra instancia
        </button>
      )}
      <p style={{ marginTop: 20, fontSize: 12, color: '#888' }}>
        Demo: admin@demo.es / changeme · Slugs: demo_dental, demo_psicologia, demo_fisioterapia
      </p>
    </div>
  );
}
