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
  InputAdornment,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import instanceClient from '../../api/instanceClient';
import { getInstancePaths } from '../../utils/instanceHost';

export default function ServiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const paths = getInstancePaths();
  const isEdit = !!id;
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 30,
    price: '',
  });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    instanceClient.get('/data/services/' + id)
      .then((res) => {
        const s = res.data;
        setFormData({
          name: s.name || '',
          description: s.description || '',
          duration: s.duration_minutes ?? 30,
          price: s.price != null ? String(s.price) : '',
        });
      })
      .catch((err) => setError(err.response?.data?.error || 'Error al cargar.'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!formData.name.trim()) { setError('El nombre del servicio es obligatorio.'); return false; }
    const dur = parseInt(formData.duration, 10);
    if (isNaN(dur) || dur < 15) { setError('La duración debe ser de al menos 15 minutos.'); return false; }
    if (formData.price !== '' && (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0)) {
      setError('Ingrese un precio válido.');
      return false;
    }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setSaving(true);
    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      duration_minutes: parseInt(formData.duration, 10) || 30,
      price: formData.price === '' ? null : parseFloat(formData.price),
    };
    const req = isEdit ? instanceClient.put('/data/services/' + id, payload) : instanceClient.post('/data/services', payload);
    req
      .then(() => {
        setSuccess(isEdit ? 'Servicio actualizado.' : 'Servicio creado.');
        setTimeout(() => navigate(paths.serviciosPath), 1500);
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
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(paths.serviciosPath)} sx={{ mb: 2 }}>Volver</Button>
      <Typography variant="h5" component="h1" gutterBottom>{isEdit ? 'Editar servicio' : 'Nuevo servicio'}</Typography>
      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      <Paper elevation={3} sx={{ p: 4, mt: 2 }}>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField fullWidth required label="Nombre del servicio" name="name" value={formData.name} onChange={handleChange} disabled={saving} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Descripción" name="description" value={formData.description} onChange={handleChange} multiline rows={3} disabled={saving} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth required label="Duración (minutos)" name="duration" type="number" value={formData.duration} onChange={handleChange} disabled={saving} inputProps={{ min: 15, step: 5 }} helperText="Mínimo 15 minutos" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Precio" name="price" type="number" value={formData.price} onChange={handleChange} disabled={saving} inputProps={{ min: 0, step: 0.01 }} InputProps={{ startAdornment: <InputAdornment position="start">€</InputAdornment> }} placeholder="Opcional" />
            </Grid>
          </Grid>
          <Box sx={{ mt: 3 }}>
            <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
