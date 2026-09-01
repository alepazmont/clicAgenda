import { useState, useEffect } from 'react';
import client from '../../api/client';
import AlertModal from '../../components/AlertModal';

const SPECIALTY_META = {
  dental: { label: 'Dental', color: '#0277bd' },
  psicologia: { label: 'Psicología', color: '#7b1fa2' },
  fisioterapia: { label: 'Fisioterapia', color: '#2e7d32' },
};

function specialtyFor(instance) {
  if (instance.specialty && SPECIALTY_META[instance.specialty]) return SPECIALTY_META[instance.specialty];
  if (String(instance.slug || '').includes('dental')) return SPECIALTY_META.dental;
  if (String(instance.slug || '').includes('psico')) return SPECIALTY_META.psicologia;
  if (String(instance.slug || '').includes('fisio')) return SPECIALTY_META.fisioterapia;
  return { label: 'Clínica', color: '#1976d2' };
}

export default function InstanceList() {
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [entering, setEntering] = useState(null);

  useEffect(() => {
    client.get('/panel/instances')
      .then((res) => setInstances(res.data || []))
      .catch((err) => setError(err.response?.data?.error || 'Error al cargar instancias.'))
      .finally(() => setLoading(false));
  }, []);

  const handleEnter = async (id) => {
    setEntering(id);
    try {
      const { data } = await client.post('/panel/instances/' + id + '/enter');
      window.location.href = data.enterUrl;
    } catch (err) {
      setError(err.response?.data?.error || 'Error al generar enlace.');
    } finally {
      setEntering(null);
    }
  };

  return (
    <>
      <AlertModal open={!!error} onClose={() => setError('')} variant="error" message={error} />
      {loading ? <p>Cargando instancias...</p> : (
        <div>
          <header style={{ marginBottom: 28 }}>
            <h1 style={{ margin: '0 0 8px', fontSize: 28 }}>Instancias demo</h1>
            <p style={{ margin: 0, color: '#666', maxWidth: 640 }}>
              Tres clínicas de ejemplo (dental, psicología y fisioterapia). Entra en cualquiera como superadmin o usa <code>admin@demo.es</code> / <code>changeme</code> en el login de instancia.
            </p>
          </header>
          {instances.length === 0 ? (
            <p>No hay instancias. Ejecuta <code>npm run db:setup</code> con DATABASE_URL configurada.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {instances.map((i) => {
                const meta = specialtyFor(i);
                return (
                  <article
                    key={i.id}
                    style={{
                      background: '#fff',
                      borderRadius: 12,
                      padding: 20,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      borderTop: `4px solid ${meta.color}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          background: meta.color,
                          color: '#fff',
                          display: 'grid',
                          placeItems: 'center',
                          fontWeight: 700,
                          fontSize: 14,
                        }}
                        aria-hidden
                      >
                        {meta.label.slice(0, 1)}
                      </span>
                      <div>
                        <h2 style={{ margin: 0, fontSize: 18 }}>{i.name}</h2>
                        <span style={{ fontSize: 13, color: meta.color, fontWeight: 600 }}>{meta.label}</span>
                      </div>
                    </div>
                    <dl style={{ margin: 0, fontSize: 14, color: '#555', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px' }}>
                      <dt>Slug</dt><dd style={{ margin: 0, fontFamily: 'monospace' }}>{i.slug}</dd>
                      <dt>Estado</dt><dd style={{ margin: 0 }}>{i.state}</dd>
                      <dt>Plan</dt><dd style={{ margin: 0 }}>{i.plan_name || 'Demo'}</dd>
                    </dl>
                    <button
                      type="button"
                      onClick={() => handleEnter(i.id)}
                      disabled={entering === i.id}
                      style={{
                        marginTop: 'auto',
                        padding: '10px 16px',
                        background: meta.color,
                        color: '#fff',
                        border: 0,
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      {entering === i.id ? 'Entrando…' : 'Entrar en la clínica'}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
}
