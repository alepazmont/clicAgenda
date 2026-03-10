import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';
import AlertModal from '../../components/AlertModal';

export default function CreateInstance() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [contact_email, setContactEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await client.post('/panel/instances', {
        name: name.trim(),
        slug: slug.trim() || undefined,
        contact_email: contact_email.trim() || undefined,
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear la instancia.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 500 }}>
      <h1>Nueva instancia</h1>
      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4 }}>Nombre *</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={{ width: '100%', padding: 8 }} placeholder="Ej. Clínica Demo" />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4 }}>Slug (opcional)</label>
          <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} style={{ width: '100%', padding: 8 }} placeholder="Ej. clinica_demo" />
          <small style={{ color: '#666' }}>Si se deja vacío se genera desde el nombre.</small>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4 }}>Email de contacto</label>
          <input type="email" value={contact_email} onChange={(e) => setContactEmail(e.target.value)} style={{ width: '100%', padding: 8 }} />
        </div>
        <AlertModal open={!!error} onClose={() => setError('')} variant="error" message={error} />
        <button type="submit" disabled={loading} style={{ padding: '10px 20px', background: '#1976d2', color: '#fff', border: 0, borderRadius: 4, cursor: 'pointer' }}>
          {loading ? 'Creando...' : 'Crear instancia'}
        </button>
      </form>
    </div>
  );
}