import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import instanceClient from '../../api/instanceClient';
import { getInstancePaths } from '../../utils/instanceHost';

export default function MedicalTreatmentForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paths = getInstancePaths();
  const isEdit = !!id;
  const patientParam = searchParams.get('paciente');
  const [patients, setPatients] = useState([]);
  const [patientId, setPatientId] = useState(patientParam || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('active');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const selectedPatient = patients.find((p) => String(p.id) === String(patientId));

  useEffect(() => {
    instanceClient.get('/data/patients').then((r) => setPatients(r.data || [])).catch(() => setPatients([]));
  }, []);

  useEffect(() => {
    if (!isEdit || !id) return;
    instanceClient.get('/data/medical_treatments/' + id)
      .then((res) => {
        const t = res.data;
        setPatientId(String(t.patient_id || ''));
        setTitle(t.title || '');
        setDescription(t.description || '');
        setStatus(t.status || 'active');
        setStartDate(t.start_date ? t.start_date.slice(0, 10) : new Date().toISOString().slice(0, 10));
      })
      .catch((err) => setError(err.response?.data?.error || 'Error al cargar.'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!patientId || !title.trim()) { setError('Paciente y nombre del tratamiento son obligatorios.'); return; }
    setError('');
    setSaving(true);
    const payload = {
      patient_id: parseInt(patientId, 10),
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      start_date: startDate || undefined,
    };
    const req = isEdit ? instanceClient.put('/data/medical_treatments/' + id, payload) : instanceClient.post('/data/medical_treatments', payload);
    req
      .then(() => {
        setSuccess(isEdit ? 'Tratamiento actualizado.' : 'Tratamiento creado.');
        setTimeout(() => navigate(patientId ? paths.pacientesPath + '/detalle/' + patientId : paths.tratamientosPath), 1500);
      })
      .catch((err) => setError(err.response?.data?.error || 'Error al guardar.'))
      .finally(() => setSaving(false));
  };

  const handleCancel = () => {
    if (patientId) navigate(paths.pacientesPath + '/detalle/' + patientId);
    else navigate(paths.tratamientosPath);
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
      <Button startIcon={<ArrowBackIcon />} onClick={handleCancel} sx={{ mb: 2 }}>Volver</Button>
      <Typography variant="h5" component="h1" gutterBottom>{isEdit ? 'Editar tratamiento' : 'Nuevo tratamiento'}</Typography>
      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      <Paper elevation={3} sx={{ p: 4, mt: 2 }}>
        {selectedPatient && (
          <Box mb={3}>
            <Typography variant="subtitle1" fontWeight={600}>Paciente: {selectedPatient.name}</Typography>
            <Typography variant="body2" color="text.secondary">{selectedPatient.email} | {selectedPatient.phone || 'Sin teléfono'}</Typography>
            <Divider sx={{ mt: 2 }} />
          </Box>
        )}
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth required disabled={isEdit}>
                <InputLabel>Paciente</InputLabel>
                <Select value={patientId} label="Paciente" onChange={(e) => setPatientId(e.target.value)}>
                  <MenuItem value="">Selecciona</MenuItem>
                  {patients.map((p) => <MenuItem key={p.id} value={p.id}>{p.name || p.email}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth required label="Nombre del tratamiento" name="title" value={title} onChange={(e) => setTitle(e.target.value)} helperText="Ej: Rehabilitación lumbar, Tratamiento post-quirúrgico, etc." disabled={saving} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Diagnóstico / Descripción" name="description" value={description} onChange={(e) => setDescription(e.target.value)} multiline rows={4} disabled={saving} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Fecha de inicio" name="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} disabled={saving} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select value={status} label="Estado" onChange={(e) => setStatus(e.target.value)} disabled={saving}>
                  <MenuItem value="active">Activo</MenuItem>
                  <MenuItem value="completed">Completado</MenuItem>
                  <MenuItem value="paused">Pausado</MenuItem>
                </Select>
              </FormControl>
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
