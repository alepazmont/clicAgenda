import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import instanceClient from '../../api/instanceClient';
import { getInstancePaths } from '../../utils/instanceHost';

export default function Pacientes() {
  const navigate = useNavigate();
  const paths = getInstancePaths();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deletePatient, setDeletePatient] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const load = useCallback(() => {
    setLoading(true);
    instanceClient.get('/data/patients')
      .then((res) => setList(res.data || []))
      .catch((err) => setError(err.response?.data?.error || 'Error al cargar.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = list.filter((p) => {
    const t = searchTerm.toLowerCase();
    return !t || (p.name && p.name.toLowerCase().includes(t)) || (p.email && p.email.toLowerCase().includes(t)) || (p.phone && String(p.phone).includes(t));
  });

  const handleConfirmDelete = () => {
    if (!deletePatient) return;
    setDeleting(true);
    instanceClient.delete('/data/patients/' + deletePatient.id)
      .then(() => {
        setDeletePatient(null);
        load();
        setSnackbar({ open: true, message: 'Paciente eliminado.', severity: 'success' });
      })
      .catch((err) => setSnackbar({ open: true, message: err.response?.data?.error || 'Error al eliminar.', severity: 'error' }))
      .finally(() => setDeleting(false));
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Pacientes</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate(paths.pacientesPath + '/nuevo')}>Nuevo paciente</Button>
      </Box>

      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          size="small"
          label="Buscar"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
          sx={{ maxWidth: 400 }}
        />
      </Paper>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell><strong>Nombre</strong></TableCell>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>Telefono</strong></TableCell>
              <TableCell align="right"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}>No hay pacientes. Anade uno con &quot;Nuevo paciente&quot;.</TableCell></TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell>{p.name || '-'}</TableCell>
                  <TableCell>{p.email || '-'}</TableCell>
                  <TableCell>{p.phone || '-'}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => navigate(paths.pacientesPath + '/detalle/' + p.id)} title="Ver ficha"><VisibilityIcon /></IconButton>
                    <IconButton size="small" onClick={() => navigate(paths.pacientesPath + '/editar/' + p.id)} title="Editar"><EditIcon /></IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeletePatient(p)} title="Eliminar"><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={!!deletePatient} onClose={() => !deleting && setDeletePatient(null)}>
        <DialogTitle>Eliminar paciente</DialogTitle>
        {deletePatient && (
          <DialogContent>
            <Typography variant="body2">¿Eliminar a {deletePatient.name}? Esta accion no se puede deshacer.</Typography>
          </DialogContent>
        )}
        <DialogActions>
          <Button onClick={() => setDeletePatient(null)} disabled={deleting}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={handleConfirmDelete} disabled={deleting}>
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        message={snackbar.message}
      />
    </Container>
  );
}
