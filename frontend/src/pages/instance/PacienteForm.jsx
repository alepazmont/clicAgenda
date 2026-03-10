import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import instanceClient from '../../api/instanceClient';
import { getInstancePaths } from '../../utils/instanceHost';
import { PrivacyPolicyConsent } from '../../components/privacy/PrivacyPolicy';

export default function PacienteForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const paths = getInstancePaths();
  const isEdit = !!id;
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dni: '',
    address: '',
    birth_date: '',
  });
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    instanceClient.get('/data/patients/' + id)
      .then((res) => {
        const p = res.data;
        setFormData({
          name: p.name || '',
          email: p.email || '',
          phone: p.phone || '',
          dni: p.dni || '',
          address: p.address || '',
          birth_date: p.birth_date ? p.birth_date.slice(0, 10) : '',
        });
      })
      .catch((err) => setError(err.response?.data?.error || 'Error al cargar.'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { setError('Nombre requerido.'); return; }
    if (!isEdit && !privacyConsent) { setError('Debe aceptar la política de privacidad.'); return; }
    setError('');
    setSuccess('');
    setSaving(true);
    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      dni: formData.dni.trim() || undefined,
      address: formData.address.trim() || undefined,
      birth_date: formData.birth_date || undefined,
    };
    const req = isEdit ? instanceClient.put('/data/patients/' + id, payload) : instanceClient.post('/data/patients', payload);
    req
      .then(() => {
        setSuccess(isEdit ? 'Paciente actualizado.' : 'Paciente creado.');
        if (!isEdit) setFormData({ name: '', email: '', phone: '', dni: '', address: '', birth_date: '' });
        setTimeout(() => navigate(isEdit ? paths.pacientesPath + '/detalle/' + id : paths.pacientesPath), 1500);
      })
      .catch((err) => setError(err.response?.data?.error || 'Error al guardar.'))
      .finally(() => setSaving(false));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md">
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(isEdit ? paths.pacientesPath + '/detalle/' + id : paths.pacientesPath)}>Volver</Button>
      </Box>
      <Typography variant="h5" component="h1" gutterBottom>{isEdit ? 'Editar paciente' : 'Nuevo paciente'}</Typography>
      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      <Paper elevation={3} sx={{ p: 4, mt: 2 }}>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>Información personal</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth required label="Nombre completo" name="name" value={formData.name} onChange={handleChange} disabled={saving} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Email" name="email" type="email" value={formData.email} onChange={handleChange} disabled={saving} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Teléfono" name="phone" value={formData.phone} onChange={handleChange} disabled={saving} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="DNI / NIE" name="dni" value={formData.dni} onChange={handleChange} disabled={saving} helperText="Documento de identidad" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Dirección" name="address" value={formData.address} onChange={handleChange} disabled={saving} helperText="Dirección completa" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Fecha de nacimiento" name="birth_date" type="date" value={formData.birth_date} onChange={handleChange} disabled={saving} InputLabelProps={{ shrink: true }} />
            </Grid>
            {!isEdit && (
              <Grid item xs={12}>
                <PrivacyPolicyConsent value={privacyConsent} onChange={setPrivacyConsent} required />
              </Grid>
            )}
          </Grid>
          <Box sx={{ mt: 3 }}>
            <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
