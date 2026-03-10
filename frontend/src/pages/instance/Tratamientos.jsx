import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import instanceClient from '../../api/instanceClient';
import { getInstancePaths } from '../../utils/instanceHost';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

export default function Tratamientos() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patientIdParam = searchParams.get('paciente');
  const paths = getInstancePaths();
  const [list, setList] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPatientId, setFilterPatientId] = useState(patientIdParam || '');
  const [success, setSuccess] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    const patientIdQ = filterPatientId ? `?patient_id=${filterPatientId}` : '';
    Promise.all([
      instanceClient.get(`/data/medical_treatments${patientIdQ}`).then((r) => r.data || []),
      instanceClient.get('/data/patients').then((r) => r.data || []),
    ])
      .then(([treatments, patientsList]) => {
        setList(treatments);
        setPatients(patientsList);
      })
      .catch((err) => setError(err.response?.data?.error || 'Error al cargar.'))
      .finally(() => setLoading(false));
  }, [filterPatientId]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredList = list.filter((t) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (t.title && t.title.toLowerCase().includes(term)) || (t.description && t.description.toLowerCase().includes(term));
  });

  const newTreatmentUrl = paths.tratamientosPath + '/nuevo' + (filterPatientId ? '?paciente=' + filterPatientId : '');

  if (loading && list.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Tratamientos médicos</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate(newTreatmentUrl)}>Nuevo tratamiento</Button>
      </Box>

      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>{success}</Alert>}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" gap={2} flexWrap="wrap">
          <TextField
            size="small"
            label="Buscar"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
            sx={{ minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Paciente</InputLabel>
            <Select value={filterPatientId} label="Paciente" onChange={(e) => setFilterPatientId(e.target.value)}>
              <MenuItem value="">Todos</MenuItem>
              {patients.map((p) => (
                <MenuItem key={p.id} value={p.id}>{p.name || p.email || p.id}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell><strong>Título</strong></TableCell>
              <TableCell><strong>Paciente</strong></TableCell>
              <TableCell><strong>Estado</strong></TableCell>
              <TableCell><strong>Fecha inicio</strong></TableCell>
              <TableCell align="right"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredList.length === 0 ? (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}>No hay tratamientos. Añade uno desde la ficha del paciente o aquí.</TableCell></TableRow>
            ) : (
              filteredList.map((t) => (
                <TableRow key={t.id} hover>
                  <TableCell>{t.title}</TableCell>
                  <TableCell>
                    <Button size="small" onClick={() => navigate(paths.pacientesPath + '/detalle/' + t.patient_id)}>
                      {patients.find((p) => p.id === t.patient_id)?.name || 'ID ' + t.patient_id}
                    </Button>
                  </TableCell>
                  <TableCell><Chip label={t.status || 'active'} size="small" color={t.status === 'completed' ? 'success' : 'default'} /></TableCell>
                  <TableCell>{t.start_date ? dayjs(t.start_date).format('DD/MM/YYYY') : '-'}</TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => navigate(paths.tratamientosPath + '/editar/' + t.id)}>Editar</Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
