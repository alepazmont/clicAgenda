import { useState, useEffect } from 'react';
import instanceClient from '../../api/instanceClient';
import { useInstance } from '../../context/InstanceContext';

export default function Dashboard() {
  const { token, slug } = useInstance();
  const [company, setCompany] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !slug) return;
    setLoading(true);
    Promise.all([
      instanceClient.get('/data/company').then((r) => r.data).catch(() => null),
      instanceClient.get('/data/stats').then((r) => r.data).catch(() => null),
    ]).then(([companyData, statsData]) => {
      setCompany(companyData);
      setStats(statsData);
    }).finally(() => setLoading(false));
  }, [token, slug]);

  if (loading) return <p>Cargando...</p>;

  const name = company && company.name ? company.name : 'la instancia';
  const patients = (stats && stats.patients) || 0;
  const services = (stats && stats.services) || 0;
  const appointments = (stats && stats.appointments) || 0;
  const nextAppointments = (stats && stats.nextAppointments) || [];

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Inicio</h1>
      <p style={{ fontSize: 18, color: '#333' }}>Bienvenido a <strong>{name}</strong>.</p>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 24, marginBottom: 24 }}>
        <div style={{ flex: '1 1 140px', minWidth: 120, padding: 20, background: '#e8f5e9', borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#2e7d32' }}>{patients}</div>
          <div style={{ color: '#666', marginTop: 4 }}>Pacientes</div>
        </div>
        <div style={{ flex: '1 1 140px', minWidth: 120, padding: 20, background: '#e3f2fd', borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#1565c0' }}>{services}</div>
          <div style={{ color: '#666', marginTop: 4 }}>Servicios</div>
        </div>
        <div style={{ flex: '1 1 140px', minWidth: 120, padding: 20, background: '#fff3e0', borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#e65100' }}>{appointments}</div>
          <div style={{ color: '#666', marginTop: 4 }}>Citas</div>
        </div>
      </div>

      {nextAppointments.length > 0 && (
        <>
          <h2 style={{ marginTop: 24, marginBottom: 12 }}>Proximas citas</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <thead><tr style={{ background: '#f5f5f5' }}><th style={{ textAlign: 'left', padding: 12 }}>Fecha y hora</th><th style={{ textAlign: 'left', padding: 12 }}>Paciente</th><th style={{ textAlign: 'left', padding: 12 }}>Servicio</th><th style={{ textAlign: 'left', padding: 12 }}>Estado</th></tr></thead>
            <tbody>
              {nextAppointments.map((a) => (
                <tr key={a.id} style={{ borderTop: '1px solid #eee' }}>
                  <td style={{ padding: 12 }}>{a.start ? new Date(a.start).toLocaleString() : '-'}</td>
                  <td style={{ padding: 12 }}>{a.patient_name || '-'}</td>
                  <td style={{ padding: 12 }}>{a.service_name || '-'}</td>
                  <td style={{ padding: 12 }}>{a.status || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {nextAppointments.length === 0 && (
        <p style={{ color: '#666', marginTop: 24 }}>No hay citas proximas. Ve a <strong>Citas</strong> para crear una.</p>
      )}
    </div>
  );
}
