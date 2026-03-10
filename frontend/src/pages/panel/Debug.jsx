import { useState, useEffect } from 'react';
import client from '../../api/client';
import AlertModal from '../../components/AlertModal';
import { useDebugRefresh } from '../../context/DebugContext';

const sectionStyle = { marginBottom: 24, background: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' };
const rowStyle = { display: 'flex', alignItems: 'center', gap: 24, marginBottom: 12 };
const labelStyle = { minWidth: 180 };

export default function Debug() {
  const [all, setAll] = useState({ console: false, file: false });
  const [groups, setGroups] = useState({});
  const [features, setFeatures] = useState({});
  const [groupList, setGroupList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const refreshSettings = useDebugRefresh();

  useEffect(() => {
    Promise.all([client.get('/panel/debug/settings'), client.get('/panel/debug/feature-groups')])
      .then(([settingsRes, groupsRes]) => {
        const rules = settingsRes.data || [];
        const gList = groupsRes.data || [];
        setGroupList(gList);
        const allRule = rules.find((r) => r.scope_key === 'all');
        setAll({ console: !!allRule?.console_enabled, file: !!allRule?.file_enabled });
        const g = {};
        const f = {};
        rules.forEach((r) => {
          if (r.scope_type === 'group') {
            g[r.scope_key] = { console: !!r.console_enabled, file: !!r.file_enabled };
          } else if (r.scope_type === 'feature') {
            f[r.scope_key] = { console: !!r.console_enabled, file: !!r.file_enabled };
          }
        });
        setGroups(g);
        setFeatures(f);
      })
      .catch((err) => setError(err.response?.data?.error || 'Error al cargar configuración.'))
      .finally(() => setLoading(false));
  }, []);

  const buildRules = () => {
    const rules = [];
    rules.push({ scope_type: 'all', scope_key: 'all', console_enabled: all.console, file_enabled: all.file });
    groupList.forEach((gr) => {
      const g = groups[gr.key] || {};
      rules.push({ scope_type: 'group', scope_key: gr.key, console_enabled: !!g.console, file_enabled: !!g.file });
      (gr.features || []).forEach((fe) => {
        const f = features[fe.scope] || {};
        rules.push({ scope_type: 'feature', scope_key: fe.scope, console_enabled: !!f.console, file_enabled: !!f.file });
      });
    });
    return rules;
  };

  const handleSave = () => {
    setSaving(true);
    setError('');
    setSaved(false);
    client
      .put('/panel/debug/settings', { rules: buildRules() })
      .then(() => {
        setSaved(true);
        refreshSettings();
        setTimeout(() => setSaved(false), 2000);
      })
      .catch((err) => setError(err.response?.data?.error || 'Error al guardar.'))
      .finally(() => setSaving(false));
  };

  const updateAll = (key, value) => setAll((prev) => ({ ...prev, [key]: value }));
  const updateGroup = (key, field, value) => setGroups((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), [field]: value } }));
  const updateFeature = (scope, field, value) => setFeatures((prev) => ({ ...prev, [scope]: { ...(prev[scope] || {}), [field]: value } }));

  if (loading) return <p>Cargando configuración de debug...</p>;

  return (
    <div>
      <h1>Debug</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>Activa logs por consola y/o archivo para el panel. Solo visible para superadmin.</p>

      <div style={sectionStyle}>
        <h2 style={{ marginTop: 0, marginBottom: 16 }}>Toda la app</h2>
        <div style={rowStyle}>
          <span style={labelStyle}>Consola</span>
          <input type="checkbox" checked={all.console} onChange={(e) => updateAll('console', e.target.checked)} />
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>Archivo de texto</span>
          <input type="checkbox" checked={all.file} onChange={(e) => updateAll('file', e.target.checked)} />
        </div>
      </div>

      {groupList.length > 0 && (
        <div style={sectionStyle}>
          <h2 style={{ marginTop: 0, marginBottom: 16 }}>Por grupo de funcionalidad</h2>
          {groupList.map((gr) => (
            <div key={gr.key} style={{ ...rowStyle, marginLeft: 0 }}>
              <span style={{ ...labelStyle, fontWeight: 500 }}>{gr.name_es}</span>
              <label><input type="checkbox" checked={!!groups[gr.key]?.console} onChange={(e) => updateGroup(gr.key, 'console', e.target.checked)} /> Consola</label>
              <label><input type="checkbox" checked={!!groups[gr.key]?.file} onChange={(e) => updateGroup(gr.key, 'file', e.target.checked)} /> Archivo</label>
            </div>
          ))}
        </div>
      )}

      {groupList.length > 0 && (
        <div style={sectionStyle}>
          <h2 style={{ marginTop: 0, marginBottom: 16 }}>Por funcionalidad</h2>
          {groupList.map((gr) =>
            (gr.features || []).map((fe) => (
              <div key={fe.scope} style={{ ...rowStyle, marginLeft: 16 }}>
                <span style={labelStyle}>{fe.name_es}</span>
                <label><input type="checkbox" checked={!!features[fe.scope]?.console} onChange={(e) => updateFeature(fe.scope, 'console', e.target.checked)} /> Consola</label>
                <label><input type="checkbox" checked={!!features[fe.scope]?.file} onChange={(e) => updateFeature(fe.scope, 'file', e.target.checked)} /> Archivo</label>
              </div>
            ))
          )}
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <button type="button" onClick={handleSave} disabled={saving} style={{ padding: '10px 24px', background: '#1976d2', color: '#fff', border: 0, borderRadius: 4, cursor: 'pointer' }}>
          {saving ? 'Guardando...' : 'Guardar configuración'}
        </button>
        {saved && <span style={{ marginLeft: 12, color: '#2e7d32' }}>Guardado.</span>}
      </div>

      <AlertModal open={!!error} onClose={() => setError('')} variant="error" message={error} />
    </div>
  );
}
