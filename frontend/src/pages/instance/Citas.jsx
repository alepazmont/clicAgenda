import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PaymentIcon from '@mui/icons-material/Payment';
import ListIcon from '@mui/icons-material/List';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import IconButton from '@mui/material/IconButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import instanceClient from '../../api/instanceClient';
import PaymentModal from '../../components/PaymentModal';
import { getInstancePaths } from '../../utils/instanceHost';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

function formatFecha(fechaString) {
  if (!fechaString) return '-';
  return dayjs(fechaString).format('dddd, D [de] MMMM [de] YYYY, HH:mm');
}

export default function Citas() {
  const navigate = useNavigate();
  const paths = getInstancePaths();
  const [list, setList] = useState([]);
  const [patients, setPatients] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [showHistorical, setShowHistorical] = useState(false);
  const [showNonValidated, setShowNonValidated] = useState(false);
  const [orderBy, setOrderBy] = useState('start');
  const [orderDirection, setOrderDirection] = useState('desc');
  const [saving, setSaving] = useState(false);
  const [editCita, setEditCita] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [deleteCita, setDeleteCita] = useState(null);
  const [paymentCita, setPaymentCita] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      instanceClient.get('/data/appointments').then((r) => r.data || []),
      instanceClient.get('/data/patients').then((r) => r.data || []),
      instanceClient.get('/data/services').then((r) => r.data || []),
    ])
      .then(([appointments, patientsList, servicesList]) => {
        setList(appointments);
        setPatients(patientsList);
        setServices(servicesList);
      })
      .catch((err) => setError(err.response?.data?.error || 'Error al cargar.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const isPast = (a) => dayjs(a.start).isBefore(dayjs(), 'day');
  const isNonValidated = (a) => isPast(a) && a.status !== 'completed' && a.status !== 'cancelled';

  const filteredList = list
    .filter((a) => {
      const term = searchTerm.toLowerCase();
      const match = !term || (a.patient_name && a.patient_name.toLowerCase().includes(term)) || (a.service_name && a.service_name.toLowerCase().includes(term));
      if (!match) return false;
      if (showNonValidated) return isNonValidated(a);
      if (showHistorical) return isPast(a);
      return !showHistorical;
    })
    .sort((a, b) => {
      let va = a[orderBy];
      let vb = b[orderBy];
      if (orderBy === 'start' || orderBy === 'end') {
        va = new Date(va).getTime();
        vb = new Date(vb).getTime();
      } else if (orderBy === 'patient_name' || orderBy === 'service_name') {
        va = (va || '').toLowerCase();
        vb = (vb || '').toLowerCase();
      } else if (orderBy === 'status') {
        va = (va || '').toLowerCase();
        vb = (vb || '').toLowerCase();
      }
      if (va < vb) return orderDirection === 'asc' ? -1 : 1;
      if (va > vb) return orderDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const handleSort = (field) => {
    if (orderBy === field) setOrderDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    else setOrderBy(field);
  };

  const SortHeader = ({ field, label }) => (
    <TableCell sx={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort(field)}>
      <strong>{label}</strong> {orderBy === field ? (orderDirection === 'asc' ? ' ▲' : ' ▼') : ''}
    </TableCell>
  );

  const handleUpdateStatus = () => {
    if (!editCita || !editStatus) return;
    setSaving(true);
    instanceClient.put('/data/appointments/' + editCita.id, { status: editStatus })
      .then(() => { setEditCita(null); setSuccess('Estado actualizado.'); load(); })
      .catch((err) => setError(err.response?.data?.error || 'Error.'))
      .finally(() => setSaving(false));
  };

  const handleDelete = () => {
    if (!deleteCita) return;
    setSaving(true);
    instanceClient.delete('/data/appointments/' + deleteCita.id)
      .then(() => { setDeleteCita(null); setSuccess('Cita eliminada.'); load(); })
      .catch((err) => setError(err.response?.data?.error || 'Error.'))
      .finally(() => setSaving(false));
  };

  const renderStatusChip = (status) => {
    const s = (status || 'scheduled').toLowerCase();
    if (s === 'scheduled' || s === 'programada') return <Chip label="Programada" color="info" size="small" />;
    if (s === 'cancelled' || s === 'cancelada') return <Chip label="Cancelada" color="error" size="small" />;
    if (s === 'completed' || s === 'atendida') return <Chip label="Atendida" color="success" size="small" />;
    return <Chip label={status || 'Programada'} size="small" variant="outlined" />;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          Gestión de Citas
        </Typography>
        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => navigate(paths.citasPath + '/nueva')} disabled={!patients.length || !services.length}>
          Nueva Cita
        </Button>
      </Box>

      {(!patients.length || !services.length) && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Necesitas al menos un paciente y un servicio para crear citas.
        </Alert>
      )}

      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ mb: 2, p: 2 }}>
        <Box display="flex" flexWrap="wrap" alignItems="center" gap={2}>
          <TextField
            size="small"
            label="Buscar"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
            sx={{ maxWidth: 280 }}
          />
          <ToggleButtonGroup value={viewMode} exclusive onChange={(_, v) => v && setViewMode(v)} size="small">
            <ToggleButton value="list"><ListIcon /> Lista</ToggleButton>
            <ToggleButton value="calendar"><CalendarTodayIcon /> Calendario</ToggleButton>
          </ToggleButtonGroup>
          <FormControlLabel control={<Switch checked={showNonValidated} onChange={(e) => setShowNonValidated(e.target.checked)} size="small" />} label="Solo no validadas" />
          <FormControlLabel control={<Switch checked={showHistorical} onChange={(e) => setShowHistorical(e.target.checked)} size="small" />} label="Historico" />
        </Box>
      </Paper>

      {viewMode === 'calendar' && (
        <Paper sx={{ mb: 2, p: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>Vista por semana (próximos 7 días)</Typography>
          <Box display="flex" flexWrap="wrap" gap={2}>
            {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
              const d = dayjs().add(offset, 'day');
              const dayCitas = filteredList.filter((a) => dayjs(a.start).isSame(d, 'day'));
              return (
                <Box key={offset} sx={{ minWidth: 140, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="caption" fontWeight="bold">{d.format('ddd D MMM')}</Typography>
                  {dayCitas.length === 0 ? <Typography variant="body2" color="text.secondary">Sin citas</Typography> : dayCitas.map((a) => (
                    <Box key={a.id} sx={{ mt: 0.5, fontSize: '0.75rem' }}>
                      {dayjs(a.start).format('HH:mm')} {a.patient_name}
                    </Box>
                  ))}
                </Box>
              );
            })}
          </Box>
        </Paper>
      )}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <SortHeader field="start" label="Fecha y hora" />
              <SortHeader field="patient_name" label="Paciente" />
              <SortHeader field="service_name" label="Servicio" />
              <SortHeader field="status" label="Estado" />
              <TableCell align="right"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  {list.length === 0 ? 'No hay citas. Crea pacientes y servicios y pulsa "Nueva Cita".' : 'No hay citas que coincidan.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredList.map((a) => (
                <TableRow key={a.id} hover>
                  <TableCell>{formatFecha(a.start)}</TableCell>
                  <TableCell>
                    <Button size="small" onClick={() => navigate(paths.pacientesPath + '/detalle/' + (a.patient_id || a.patientId))} sx={{ textTransform: 'none' }}>
                      {a.patient_name || '-'}
                    </Button>
                  </TableCell>
                  <TableCell><Chip label={a.service_name || '-'} color="primary" variant="outlined" size="small" /></TableCell>
                  <TableCell>{renderStatusChip(a.status)}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => navigate(paths.citasPath + '/editar/' + a.id)} title="Editar"><EditIcon /></IconButton>
                    <IconButton size="small" onClick={() => setPaymentCita(a)} title="Registrar pago"><PaymentIcon /></IconButton>
                    <IconButton size="small" onClick={() => { setEditCita(a); setEditStatus(a.status || 'scheduled'); }} title="Cambiar estado"><EditIcon /></IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteCita(a)} title="Eliminar"><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <PaymentModal
        open={!!paymentCita}
        onClose={() => setPaymentCita(null)}
        cita={paymentCita ? { id: paymentCita.id, patient_id: paymentCita.patient_id, patient_name: paymentCita.patient_name, service_name: paymentCita.service_name, start: paymentCita.start } : null}
        onSuccess={(msg) => { setSuccess(msg); setPaymentCita(null); load(); }}
        onError={(msg) => setError(msg)}
      />

      <Dialog open={!!editCita} onClose={() => setEditCita(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Cambiar estado</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Estado</InputLabel>
            <Select value={editStatus} label="Estado" onChange={(e) => setEditStatus(e.target.value)}>
              <MenuItem value="scheduled">Programada</MenuItem>
              <MenuItem value="completed">Atendida</MenuItem>
              <MenuItem value="cancelled">Cancelada</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditCita(null)}>Cancelar</Button>
          <Button variant="contained" onClick={handleUpdateStatus} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteCita} onClose={() => setDeleteCita(null)}>
        <DialogTitle>Eliminar cita</DialogTitle>
        <DialogContent>
          {deleteCita && (
            <Typography>¿Eliminar la cita del {formatFecha(deleteCita.start)} con {deleteCita.patient_name}?</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteCita(null)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={saving}>{saving ? 'Eliminando...' : 'Eliminar'}</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
