import { useState, useEffect } from 'react';
import client from '../../api/client';
import AlertModal from '../../components/AlertModal';
import { useDebugLog } from '../../context/DebugContext';

export default function InstanceList() {
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [entering, setEntering] = useState(null);
  const debugLog = useDebugLog().log;

  useEffect(() => {
    client.get('/panel/instances')
      .then((res) => {
        setInstances(res.data);
        if (debugLog) debugLog('all', 'Listado de instancias cargado', 'info', { count: (res.data || []).length });
      })
      .catch((err) => setError(err.response && err.response.data && err.response.data.error ? err.response.data.error : 'Error al cargar instancias.'))
      .finally(() => setLoading(false));
  }, []);

  const handleEnter = async (id) => {
    setEntering(id);
    try {
      const { data } = await client.post('/panel/instances/' + id + '/enter');
      window.open(data.enterUrl, '_blank');
    } catch (err) {
      setError(err.response && err.response.data && err.response.data.error ? err.response.data.error : 'Error al generar enlace.');
    } finally {
      setEntering(null);
    }
  };

  return (
    <>
      <AlertModal open={!!error} onClose={() => setError('')} variant="error" message={error} />
      {loading ? <p>Cargando instancias...</p> : (
    <div>
      <h1>Instancias</h1>
      {instances.length === 0 ? (
        <p>No hay instancias. <a href="/instances/new">Crear la primera</a>.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ textAlign: 'left', padding: 12 }}>Nombre</th>
              <th style={{ textAlign: 'left', padding: 12 }}>Slug</th>
              <th style={{ textAlign: 'left', padding: 12 }}>Estado</th>
              <th style={{ textAlign: 'left', padding: 12 }}>Plan</th>
              <th style={{ textAlign: 'left', padding: 12 }}>Creado</th>
              <th style={{ padding: 12 }}></th>
            </tr>
          </thead>
          <tbody>
            {instances.map((i) => (
              <tr key={i.id} style={{ borderTop: '1px solid #eee' }}>
                <td style={{ padding: 12 }}>{i.name}</td>
                <td style={{ padding: 12 }}>{i.slug}</td>
                <td style={{ padding: 12 }}>{i.state}</td>
                <td style={{ padding: 12 }}>{i.plan_name || '-'}</td>
                <td style={{ padding: 12 }}>{i.created_at ? new Date(i.created_at).toLocaleDateString() : '-'}</td>
                <td style={{ padding: 12 }}>
                  <button type="button" onClick={() => handleEnter(i.id)} disabled={entering === i.id} style={{ padding: '6px 12px', background: '#1976d2', color: '#fff', border: 0, borderRadius: 4, cursor: 'pointer' }}>
                    {entering === i.id ? '...' : 'Entrar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
      )}
    </>
  );
}
