import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
  Autocomplete,
  Grid,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import instanceClient from '../../api/instanceClient';
import { getInstancePaths } from '../../utils/instanceHost';

export default function ServiciosAsignar() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pacienteId = searchParams.get('paciente');
  const paths = getInstancePaths();
  const [patients, setPatients] = useState([]);
  const [services, setServices] = useState([]);
  const [patientId, setPatientId] = useState(pacienteId || '');
  const [patientInput, setPatientInput] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [sessions, setSessions] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    Promise.all([
      instanceClient.get('/data/patients').then((r) => r.data || []),
      instanceClient.get('/data/services').then((r) => r.data || []),
    ]).then(([p, s]) => {
      setPatients(p);
      setServices(s);
      if (pacienteId) setPatientId(pacienteId);
      if (s.length && !serviceId) setServiceId(String(s[0].id));
    }).catch((err) => setError(err.response?.data?.error || 'Error.')).finally(() => setLoading(false));
  }, []);

  const selectedPatient = patients.find((p) => String(p.id) === String(patientId)) || null;
  const selectedService = services.find((s) => String(s.id) === serviceId);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!patientId || !serviceId) { setError('Elige paciente y servicio.'); return; }
    const ses = parseInt(sessions, 10) || 1;
    if (ses < 1) { setError('El número de sesiones debe ser mayor que cero.'); return; }
    setError('');
    setSaving(true);
    instanceClient.post('/data/patient_services', {
      patient_id: parseInt(patientId, 10),
      service_id: parseInt(serviceId, 10),
      remaining_sessions: ses,
    })
      .then(() => {
        setSuccess('Bono asignado correctamente.');
        setSessions(1);
        setTimeout(() => {
          if (pacienteId) navigate(paths.pacientesPath + '/detalle/' + pacienteId + '?tab=2');
          else navigate(paths.serviciosPath);
        }, 1500);
      })
      .catch((err) => setError(err.response?.data?.error || 'Error al asignar.'))
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
      <Paper elevation={3} sx={{ p: 4, mt: 2 }}>
        <Typography variant="h5" component="h1" gutterBottom>Asignar bono a paciente</Typography>
        {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Autocomplete
                fullWidth
                options={patients}
                getOptionLabel={(p) => p.name || p.email || ''}
                value={selectedPatient}
                inputValue={patientInput}
                onInputChange={(_, v) => setPatientInput(v)}
                onChange={(_, v) => setPatientId(v ? String(v.id) : '')}
                renderInput={(params) => <TextField {...params} label="Paciente" required={!patientId} />}
                isOptionEqualToValue={(a, b) => a && b && a.id === b.id}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Servicio / Bono</InputLabel>
                <Select value={serviceId} label="Servicio / Bono" onChange={(e) => setServiceId(e.target.value)}>
                  <MenuItem value="">Selecciona</MenuItem>
                  {services.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name} {s.duration_minutes ? `(${s.duration_minutes} min)` : ''} {s.price != null ? `- ${s.price} €` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth required type="number" label="Sesiones" value={sessions} onChange={(e) => setSessions(parseInt(e.target.value, 10) || 1)} inputProps={{ min: 1 }} helperText="Número de sesiones del bono" />
            </Grid>
            {selectedService && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Servicio seleccionado: {selectedService.name} · Duración: {selectedService.duration_minutes ?? 30} min {selectedService.price != null ? `· Precio: ${selectedService.price} €` : ''}
                </Typography>
              </Grid>
            )}
          </Grid>
          <Box sx={{ mt: 3 }}>
            <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Guardando...' : 'Asignar bono'}</Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
