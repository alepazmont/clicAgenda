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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import instanceClient from '../../api/instanceClient';
import { getInstancePaths } from '../../utils/instanceHost';

export default function Servicios() {
  const navigate = useNavigate();
  const paths = getInstancePaths();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteService, setDeleteService] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    instanceClient.get('/data/services')
      .then((res) => setList(res.data || []))
      .catch((err) => setError(err.response?.data?.error || 'Error al cargar.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = list.filter((s) => {
    const t = searchTerm.toLowerCase();
    return !t || (s.name && s.name.toLowerCase().includes(t));
  });

  const handleConfirmDelete = () => {
    if (!deleteService) return;
    setDeleting(true);
    instanceClient.delete('/data/services/' + deleteService.id)
      .then(() => { setDeleteService(null); load(); })
      .catch((err) => setError(err.response?.data?.error || 'Error al eliminar.'))
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Typography variant="h4">Servicios y bonos</Typography>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<CardGiftcardIcon />} onClick={() => navigate(paths.serviciosPath + '/asignar')}>Asignar bono</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate(paths.serviciosPath + '/nuevo')}>Nuevo servicio</Button>
        </Box>
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
              <TableCell><strong>Duracion (min)</strong></TableCell>
              <TableCell><strong>Precio</strong></TableCell>
              <TableCell align="right"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}>No hay servicios. Anade uno con &quot;Nuevo servicio&quot;.</TableCell></TableRow>
            ) : (
              filtered.map((s) => (
                <TableRow key={s.id} hover>
                  <TableCell>{s.name || '-'}</TableCell>
                  <TableCell>{s.duration_minutes ?? '-'}</TableCell>
                  <TableCell>{s.price != null ? s.price + ' €' : '-'}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => navigate(paths.serviciosPath + '/editar/' + s.id)} title="Editar"><EditIcon /></IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteService(s)} title="Eliminar"><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={!!deleteService} onClose={() => !deleting && setDeleteService(null)}>
        <DialogTitle>Eliminar servicio</DialogTitle>
        {deleteService && (
          <DialogContent>
            <Typography variant="body2">¿Eliminar el servicio &quot;{deleteService.name}&quot;? Esta accion no se puede deshacer.</Typography>
          </DialogContent>
        )}
        <DialogActions>
          <Button onClick={() => setDeleteService(null)} disabled={deleting}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={handleConfirmDelete} disabled={deleting}>{deleting ? 'Eliminando...' : 'Eliminar'}</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
