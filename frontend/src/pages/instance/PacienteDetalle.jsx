import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Tabs,
  Tab,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import PaymentIcon from '@mui/icons-material/Payment';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import instanceClient from '../../api/instanceClient';
import PaymentModal from '../../components/PaymentModal';
import { getInstancePaths } from '../../utils/instanceHost';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ py: 2 }}>{children}</Box> : null;
}

export default function PacienteDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paths = getInstancePaths();
  const tabParam = searchParams.get('tab');
  const initialTab = tabParam !== null && tabParam !== '' ? parseInt(tabParam, 10) : 0;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tab, setTab] = useState(Number.isNaN(initialTab) ? 0 : Math.max(0, Math.min(initialTab, 4)));
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocDesc, setNewDocDesc] = useState('');
  const [newDocType, setNewDocType] = useState('other');
  const [newDocFile, setNewDocFile] = useState(null);
  const [showDocDialog, setShowDocDialog] = useState(false);
  const [savingDoc, setSavingDoc] = useState(false);
  const [paymentCita, setPaymentCita] = useState(null);
  const [usingSessionPs, setUsingSessionPs] = useState(null);
  const [completeTreatment, setCompleteTreatment] = useState(null);
  const [completeNotes, setCompleteNotes] = useState('');
  const [completing, setCompleting] = useState(false);

  const load = () => {
    setLoading(true);
    instanceClient.get(`/data/patients/${id}`)
      .then((res) => {
        setData(res.data);
        setNotes(res.data.notes || '');
      })
      .catch((err) => setError(err.response?.data?.error || 'Error al cargar.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleSaveNotes = () => {
    setSavingNotes(true);
    instanceClient.put(`/data/patients/${id}`, { notes })
      .then(() => {
        setEditingNotes(false);
        setSuccess('Notas guardadas.');
        if (data) setData({ ...data, notes });
      })
      .catch((err) => setError(err.response?.data?.error || 'Error al guardar.'))
      .finally(() => setSavingNotes(false));
  };

  const handleAddDocument = (e) => {
    e.preventDefault();
    if (!newDocName.trim()) return;
    setSavingDoc(true);
    if (newDocFile) {
      const formData = new FormData();
      formData.append('patient_id', id);
      formData.append('name', newDocName.trim());
      if (newDocDesc.trim()) formData.append('description', newDocDesc.trim());
      formData.append('document_type', newDocType);
      formData.append('file', newDocFile);
      instanceClient.post('/data/medical_documents/upload', formData)
        .then(() => {
          setShowDocDialog(false);
          setNewDocName('');
          setNewDocDesc('');
          setNewDocType('other');
          setNewDocFile(null);
          load();
          setSuccess('Documento subido.');
        })
        .catch((err) => setError(err.response?.data?.error || 'Error al subir documento.'))
        .finally(() => setSavingDoc(false));
    } else {
      instanceClient.post('/data/medical_documents', {
        patient_id: parseInt(id, 10),
        name: newDocName.trim(),
        description: newDocDesc.trim() || undefined,
        document_type: newDocType,
      })
        .then(() => {
          setShowDocDialog(false);
          setNewDocName('');
          setNewDocDesc('');
          setNewDocType('other');
          load();
          setSuccess('Documento añadido.');
        })
        .catch((err) => setError(err.response?.data?.error || 'Error al crear documento.'))
        .finally(() => setSavingDoc(false));
    }
  };

  const handleDeleteDoc = (docId) => {
    if (!window.confirm('Eliminar este documento?')) return;
    instanceClient.delete(`/data/medical_documents/${docId}`)
      .then(() => { load(); setSuccess('Documento eliminado.'); })
      .catch((err) => setError(err.response?.data?.error || 'Error.'));
  };

  const handleDescontarSesion = (ps) => {
    const next = (ps.remaining_sessions || 0) - 1;
    if (next < 0) return;
    setUsingSessionPs(ps.id);
    instanceClient.put(`/data/patient_services/${ps.id}`, { remaining_sessions: next })
      .then(() => { load(); setSuccess('Sesión descontada.'); })
      .catch((err) => setError(err.response?.data?.error || 'Error al descontar.'))
      .finally(() => setUsingSessionPs(null));
  };

  const citaForPayment = paymentCita ? { ...paymentCita, patient_id: id, patient_name: data?.name } : null;

  const handleCompleteTreatment = () => {
    if (!completeTreatment) return;
    setCompleting(true);
    instanceClient.put(`/data/medical_treatments/${completeTreatment.id}`, { status: 'completed', evolution_notes: completeNotes })
      .then(() => { setCompleteTreatment(null); setCompleteNotes(''); load(); setSuccess('Tratamiento completado.'); })
      .catch((err) => setError(err.response?.data?.error || 'Error al completar.'))
      .finally(() => setCompleting(false));
  };

  if (loading || !data) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <IconButton onClick={() => navigate(paths.pacientesPath)} size="small"><ArrowBackIcon /></IconButton>
        <Typography variant="h5">{data.name || 'Paciente'}</Typography>
      </Box>

      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>{success}</Alert>}

      <Paper sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Datos" />
          <Tab label="Citas" />
          <Tab label="Bonos" />
          <Tab label="Tratamientos" />
          <Tab label="Documentos" />
        </Tabs>

        <Box sx={{ p: 2 }}>
          <TabPanel value={tab} index={0}>
            <Typography variant="body2" color="text.secondary">Email: {data.email || '-'}</Typography>
            <Typography variant="body2" color="text.secondary">Telefono: {data.phone || '-'}</Typography>
            <Box sx={{ mt: 2 }}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="subtitle2">Notas medicas</Typography>
                {!editingNotes ? (
                  <Button size="small" startIcon={<EditIcon />} onClick={() => setEditingNotes(true)}>Editar</Button>
                ) : (
                  <>
                    <Button size="small" startIcon={<SaveIcon />} onClick={handleSaveNotes} disabled={savingNotes}>Guardar</Button>
                    <Button size="small" onClick={() => { setEditingNotes(false); setNotes(data.notes || ''); }}>Cancelar</Button>
                  </>
                )}
              </Box>
              {editingNotes ? (
                <TextField fullWidth multiline rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
              ) : (
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{data.notes || 'Sin notas.'}</Typography>
              )}
            </Box>
            <Button sx={{ mt: 2 }} variant="outlined" startIcon={<EditIcon />} onClick={() => navigate(paths.pacientesPath + '/editar/' + id)}>Editar datos</Button>
          </TabPanel>

          <TabPanel value={tab} index={1}>
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow><TableCell>Fecha</TableCell><TableCell>Servicio</TableCell><TableCell>Estado</TableCell><TableCell align="right">Acciones</TableCell></TableRow></TableHead>
                <TableBody>
                  {(data.appointments || []).length === 0 ? (
                    <TableRow><TableCell colSpan={4}>Sin citas.</TableCell></TableRow>
                  ) : (
                    data.appointments.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>{dayjs(a.start).format('DD/MM/YYYY HH:mm')}</TableCell>
                        <TableCell>{a.service_name || '-'}</TableCell>
                        <TableCell><Chip label={a.status || 'scheduled'} size="small" color={a.status === 'completed' ? 'success' : a.status === 'cancelled' ? 'error' : 'default'} /></TableCell>
                        <TableCell align="right">
                          <Button size="small" startIcon={<PaymentIcon />} onClick={() => setPaymentCita(a)}>Registrar pago</Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Button sx={{ mt: 1 }} variant="contained" startIcon={<AddIcon />} onClick={() => navigate(paths.citasPath + '/nueva?paciente=' + id)}>Nueva cita</Button>
          </TabPanel>

          <TabPanel value={tab} index={2}>
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow><TableCell>Servicio</TableCell><TableCell>Sesiones restantes</TableCell><TableCell align="right">Acciones</TableCell></TableRow></TableHead>
                <TableBody>
                  {(data.patient_services || []).length === 0 ? (
                    <TableRow><TableCell colSpan={3}>Sin bonos asignados.</TableCell></TableRow>
                  ) : (
                    data.patient_services.map((ps) => (
                      <TableRow key={ps.id}>
                        <TableCell>{ps.service_name}</TableCell>
                        <TableCell>{ps.remaining_sessions}</TableCell>
                        <TableCell align="right">
                          <Button size="small" startIcon={<RemoveCircleOutlineIcon />} disabled={(ps.remaining_sessions || 0) < 1 || usingSessionPs === ps.id} onClick={() => handleDescontarSesion(ps)}>
                            {usingSessionPs === ps.id ? '...' : 'Descontar sesión'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Button sx={{ mt: 1 }} variant="outlined" startIcon={<AddIcon />} onClick={() => navigate(paths.serviciosPath + '/asignar?paciente=' + id)}>Asignar bono</Button>
          </TabPanel>

          <TabPanel value={tab} index={3}>
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow><TableCell>Titulo</TableCell><TableCell>Estado</TableCell><TableCell>Fecha inicio</TableCell><TableCell align="right">Acciones</TableCell></TableRow></TableHead>
                <TableBody>
                  {(data.medical_treatments || []).length === 0 ? (
                    <TableRow><TableCell colSpan={4}>Sin tratamientos.</TableCell></TableRow>
                  ) : (
                    data.medical_treatments.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>{t.title}</TableCell>
                        <TableCell><Chip label={t.status || 'active'} size="small" color={t.status === 'completed' ? 'success' : 'default'} /></TableCell>
                        <TableCell>{t.start_date ? dayjs(t.start_date).format('DD/MM/YYYY') : '-'}</TableCell>
                        <TableCell align="right">
                          <Button size="small" onClick={() => navigate(paths.tratamientosPath + '/editar/' + t.id)}>Editar</Button>
                          {t.status !== 'completed' && (
                            <Button size="small" color="primary" onClick={() => { setCompleteTreatment(t); setCompleteNotes(''); }}>Completar tratamiento</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Button sx={{ mt: 1 }} variant="outlined" startIcon={<AddIcon />} onClick={() => navigate(paths.tratamientosPath + '/nuevo?paciente=' + id)}>Nuevo tratamiento</Button>
          </TabPanel>

          <TabPanel value={tab} index={4}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="subtitle2">Documentos clinicos</Typography>
              <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => setShowDocDialog(true)}>Anadir</Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow><TableCell>Nombre</TableCell><TableCell>Descripción</TableCell><TableCell>Tipo</TableCell><TableCell>Archivo</TableCell><TableCell></TableCell></TableRow></TableHead>
                <TableBody>
                  {(data.medical_documents || []).length === 0 ? (
                    <TableRow><TableCell colSpan={5}>Sin documentos.</TableCell></TableRow>
                  ) : (
                    data.medical_documents.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell>{d.name}</TableCell>
                        <TableCell>{d.description || '-'}</TableCell>
                        <TableCell>{d.document_type || 'other'}</TableCell>
                        <TableCell>{d.file_path ? <Button size="small" component="a" href={`/api/uploads/${d.file_path}`} target="_blank" rel="noopener noreferrer">Descargar</Button> : '-'}</TableCell>
                        <TableCell><Button size="small" color="error" onClick={() => handleDeleteDoc(d.id)}>Eliminar</Button></TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
        </Box>
      </Paper>

      <Dialog open={showDocDialog} onClose={() => { setShowDocDialog(false); setNewDocFile(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>Añadir documento</DialogTitle>
        <form onSubmit={handleAddDocument}>
          <DialogContent>
            <TextField fullWidth label="Nombre" value={newDocName} onChange={(e) => setNewDocName(e.target.value)} required sx={{ mt: 1 }} />
            <TextField fullWidth select label="Tipo" value={newDocType} onChange={(e) => setNewDocType(e.target.value)} sx={{ mt: 2 }}>
              <MenuItem value="informe">Informe</MenuItem>
              <MenuItem value="analitica">Analítica</MenuItem>
              <MenuItem value="consentimiento">Consentimiento</MenuItem>
              <MenuItem value="radiologia">Radiología</MenuItem>
              <MenuItem value="other">Otro</MenuItem>
            </TextField>
            <TextField fullWidth label="Descripción" value={newDocDesc} onChange={(e) => setNewDocDesc(e.target.value)} multiline rows={2} sx={{ mt: 2 }} />
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>Archivo (opcional, máx. 10 MB)</Typography>
              <input accept=".pdf,.doc,.docx,image/*" type="file" id="doc-file" style={{ display: 'none' }} onChange={(e) => setNewDocFile(e.target.files?.[0] || null)} />
              <Button variant="outlined" component="label" htmlFor="doc-file" size="small">{newDocFile ? newDocFile.name : 'Elegir archivo'}</Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowDocDialog(false)}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={savingDoc}>{savingDoc ? 'Guardando…' : 'Guardar'}</Button>
          </DialogActions>
        </form>
      </Dialog>

      <PaymentModal
        open={!!paymentCita}
        onClose={() => setPaymentCita(null)}
        cita={citaForPayment}
        onSuccess={() => { setPaymentCita(null); load(); setSuccess('Pago registrado.'); }}
        onError={(msg) => setError(msg || 'Error al registrar pago.')}
      />

      <Dialog open={!!completeTreatment} onClose={() => !completing && setCompleteTreatment(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Completar tratamiento</DialogTitle>
        <DialogContent>
          {completeTreatment && (
            <>
              <Typography variant="body2" sx={{ mb: 1 }}>Tratamiento: {completeTreatment.title}</Typography>
              <TextField fullWidth label="Notas de cierre (opcional)" value={completeNotes} onChange={(e) => setCompleteNotes(e.target.value)} multiline rows={3} />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompleteTreatment(null)} disabled={completing}>Cancelar</Button>
          <Button variant="contained" onClick={handleCompleteTreatment} disabled={completing}>{completing ? 'Guardando...' : 'Completar'}</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
