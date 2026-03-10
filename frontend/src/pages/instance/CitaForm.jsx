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
  Autocomplete,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import instanceClient from '../../api/instanceClient';
import { getInstancePaths } from '../../utils/instanceHost';

function toLocalDatetime(d) {
  if (!d) return '';
  const date = new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}T${h}:${min}`;
}

export default function CitaForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paths = getInstancePaths();
  const patientIdUrl = searchParams.get('paciente');
  const isEdit = !!id;
  const [patients, setPatients] = useState([]);
  const [services, setServices] = useState([]);
  const [patient, setPatient] = useState(null);
  const [serviceId, setServiceId] = useState('');
  const [start, setStart] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - (d.getMinutes() % 15));
    d.setHours(d.getHours() + 1);
    return toLocalDatetime(d);
  });
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      instanceClient.get('/data/patients').then((r) => r.data || []),
      instanceClient.get('/data/services').then((r) => r.data || []),
    ]).then(([p, s]) => {
      setPatients(p);
      setServices(s);
      if (patientIdUrl && p.length) {
        const found = p.find((x) => String(x.id) === patientIdUrl);
        if (found) setPatient(found);
      }
      if (s.length && !serviceId) setServiceId(String(s[0].id));
    }).catch(() => setError('Error al cargar.')).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!isEdit || !id || !patients.length) return;
    setLoading(true);
    instanceClient.get('/data/appointments/' + id).then((r) => {
      const cita = r.data;
      if (cita) {
        setStart(toLocalDatetime(cita.start));
        setServiceId(cita.service_id ? String(cita.service_id) : '');
        setNotes(cita.notes || '');
        const p = patients.find((x) => x.id === cita.patient_id);
        setPatient(p || { id: cita.patient_id, name: cita.patient_name || ('ID ' + cita.patient_id) });
      }
    }).catch(() => setError('Error al cargar.')).finally(() => setLoading(false));
  }, [id, isEdit, patients.length]);

  const selectedService = services.find((s) => String(s.id) === serviceId);
  const duration = selectedService?.duration_minutes ?? 30;

  const handleSubmit = (e) => {
    e.preventDefault();
    const pid = patient?.id || patientIdUrl;
    if (!pid || !serviceId) {
      setError('Selecciona paciente y servicio.');
      return;
    }
    setError('');
    setSaving(true);
    const startDate = new Date(start);
    const endDate = new Date(startDate.getTime() + duration * 60 * 1000);
    const payload = {
      patient_id: parseInt(pid, 10),
      service_id: parseInt(serviceId, 10),
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      notes: notes.trim() || undefined,
    };
    const req = isEdit
      ? instanceClient.put('/data/appointments/' + id, { start: payload.start, end: payload.end, notes: payload.notes })
      : instanceClient.post('/data/appointments', payload);
    req
      .then(() => navigate(paths.citasPath))
      .catch((err) => setError(err.response?.data?.error || 'Error al guardar.'))
      .finally(() => setSaving(false));
  };

  if (loading && !patients.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md">
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(paths.citasPath)} sx={{ mb: 2 }}>Volver</Button>
      <Typography variant="h5" component="h1" gutterBottom>{isEdit ? 'Editar cita' : 'Nueva cita'}</Typography>
      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}
      <Paper elevation={3} sx={{ p: 4, mt: 2 }}>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Autocomplete
                options={patients}
                getOptionLabel={(o) => o.name || o.email || String(o.id)}
                value={patient}
                onChange={(_, v) => setPatient(v)}
                renderInput={(params) => <TextField {...params} label="Paciente" required />}
                disabled={isEdit}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Servicio</InputLabel>
                <Select value={serviceId} label="Servicio" onChange={(e) => setServiceId(e.target.value)}>
                  {services.map((s) => (
                    <MenuItem key={s.id} value={s.id}>{s.name} ({s.duration_minutes ?? 30} min)</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Duración" value={duration + ' min'} disabled helperText="Según el servicio" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Fecha y hora" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} required InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Notas" value={notes} onChange={(e) => setNotes(e.target.value)} multiline rows={3} disabled={saving} placeholder="Notas internas de la cita" />
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
