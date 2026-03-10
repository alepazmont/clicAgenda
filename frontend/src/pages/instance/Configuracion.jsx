import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  TextField,
  Typography,
  CircularProgress,
  Tabs,
  Tab,
  InputAdornment,
  IconButton,
  Grid,
  FormControlLabel,
  Switch,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
  useTheme,
  useMediaQuery,
  Stack,
  Divider,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import BusinessIcon from '@mui/icons-material/Business';
import PaletteIcon from '@mui/icons-material/Palette';
import ScheduleIcon from '@mui/icons-material/Schedule';
import GroupIcon from '@mui/icons-material/Group';
import PublicIcon from '@mui/icons-material/Public';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import instanceClient from '../../api/instanceClient';
import { useInstanceCompany } from '../../context/InstanceCompanyContext';
import { useInstance } from '../../context/InstanceContext';
import { getInstancePaths } from '../../utils/instanceHost';

const TAB_IDS = ['datos', 'apariencia', 'horarios', 'equipo', 'portal'];
const TAB_CONFIG = [
  { id: 'datos', label: 'Datos del negocio', icon: <BusinessIcon /> },
  { id: 'apariencia', label: 'Apariencia', icon: <PaletteIcon /> },
  { id: 'horarios', label: 'Horarios', icon: <ScheduleIcon /> },
  { id: 'equipo', label: 'Equipo', icon: <GroupIcon /> },
  { id: 'portal', label: 'Portal público', icon: <PublicIcon /> },
];

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const defaultDayConfig = () => ({
  closed: false,
  morning: { enabled: true, start: '09:00', end: '14:00' },
  afternoon: { enabled: true, start: '16:00', end: '20:00' },
});

function ColorPicker({ color, label, onChange }) {
  return (
    <TextField
      fullWidth
      label={label}
      value={color || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder="#1976d2"
      inputProps={{ 'aria-label': label }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Box
              sx={{
                width: 28,
                height: 28,
                bgcolor: color || '#ccc',
                borderRadius: 1,
                border: '2px solid',
                borderColor: 'divider',
              }}
              aria-hidden
            />
          </InputAdornment>
        ),
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              size="small"
              aria-label="Abrir selector de color"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'color';
                input.value = color || '#1976d2';
                input.oninput = (e) => onChange(e.target.value);
                input.click();
              }}
            >
              <ColorLensIcon />
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
}

function DaySchedule({ day, dayConfig, onChange }) {
  const safe = {
    closed: dayConfig?.closed ?? false,
    morning: dayConfig?.morning || { enabled: true, start: '09:00', end: '14:00' },
    afternoon: dayConfig?.afternoon || { enabled: true, start: '16:00', end: '20:00' },
  };

  const update = (key, value) => onChange({ ...safe, [key]: value });
  const updateMorning = (field, value) => update('morning', { ...safe.morning, [field]: value });
  const updateAfternoon = (field, value) => update('afternoon', { ...safe.afternoon, [field]: value });

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 1 }}>
          <Typography variant="subtitle1" component="h3" fontWeight={600}>
            {day}
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={!safe.closed}
                onChange={() => update('closed', !safe.closed)}
                size="small"
                color="primary"
                inputProps={{ 'aria-label': `${day}: ${safe.closed ? 'Abrir' : 'Cerrar'}` }}
              />
            }
            label={safe.closed ? 'Cerrado' : 'Abierto'}
          />
        </Box>
        {!safe.closed && (
          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                Mañana
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" useFlexGap>
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={safe.morning.enabled}
                      onChange={() => updateMorning('enabled', !safe.morning.enabled)}
                      inputProps={{ 'aria-label': 'Activar horario de mañana' }}
                    />
                  }
                  label="Activo"
                />
                <TextField
                  size="small"
                  type="time"
                  value={safe.morning.start}
                  onChange={(e) => updateMorning('start', e.target.value)}
                  disabled={!safe.morning.enabled}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ 'aria-label': 'Inicio mañana' }}
                  sx={{ width: 110 }}
                />
                <TextField
                  size="small"
                  type="time"
                  value={safe.morning.end}
                  onChange={(e) => updateMorning('end', e.target.value)}
                  disabled={!safe.morning.enabled}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ 'aria-label': 'Fin mañana' }}
                  sx={{ width: 110 }}
                />
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                Tarde
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" useFlexGap>
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={safe.afternoon.enabled}
                      onChange={() => updateAfternoon('enabled', !safe.afternoon.enabled)}
                      inputProps={{ 'aria-label': 'Activar horario de tarde' }}
                    />
                  }
                  label="Activo"
                />
                <TextField
                  size="small"
                  type="time"
                  value={safe.afternoon.start}
                  onChange={(e) => updateAfternoon('start', e.target.value)}
                  disabled={!safe.afternoon.enabled}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ 'aria-label': 'Inicio tarde' }}
                  sx={{ width: 110 }}
                />
                <TextField
                  size="small"
                  type="time"
                  value={safe.afternoon.end}
                  onChange={(e) => updateAfternoon('end', e.target.value)}
                  disabled={!safe.afternoon.enabled}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ 'aria-label': 'Fin tarde' }}
                  sx={{ width: 110 }}
                />
              </Stack>
            </Grid>
          </Grid>
        )}
      </CardContent>
    </Card>
  );
}

export default function Configuracion() {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') || '';
  const tabIndex = TAB_IDS.includes(tabParam) ? TAB_IDS.indexOf(tabParam) : 0;
  const activeTabId = TAB_IDS[tabIndex];

  const { refresh } = useInstanceCompany();
  const { slug } = useInstance();
  const paths = getInstancePaths();
  const [company, setCompany] = useState({
    name: '',
    colors: '',
    business_hours: null,
    professionals: [],
    address: '',
    phone: '',
    email: '',
    website: '',
    short_description: '',
    description: '',
    social_links: {},
    portal_enabled: true,
    portal_welcome_text: '',
    portal_cta_button: 'Solicitar cita',
    logo_url: '',
    google_business_url: '',
    google_maps_embed_src: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [proDialog, setProDialog] = useState(false);
  const [editingProIndex, setEditingProIndex] = useState(-1);
  const [proNombre, setProNombre] = useState('');
  const [proRol, setProRol] = useState('');
  const [confirmDelete, setConfirmDelete] = useState({ open: false, index: null });

  const primaryColor = typeof company.colors === 'string' ? company.colors : company.colors?.primary || '';
  const professionals = Array.isArray(company.professionals) ? company.professionals : [];

  const loadCompany = useCallback(() => {
    instanceClient
      .get('/data/company')
      .then((res) => {
        const d = res.data || {};
        const social = d.social_links && typeof d.social_links === 'object' ? d.social_links : {};
        setCompany({
          name: d.name || '',
          colors: d.colors || '',
          business_hours:
            d.business_hours ||
            Object.fromEntries(DAYS.map((_, i) => [String(i), defaultDayConfig()])),
          professionals: Array.isArray(d.professionals) ? d.professionals : [],
          address: d.address || '',
          phone: d.phone || '',
          email: d.email || '',
          website: d.website || '',
          short_description: d.short_description || '',
          description: d.description || '',
          social_links: { facebook: social.facebook || '', instagram: social.instagram || '', twitter: social.twitter || '', linkedin: social.linkedin || '' },
          portal_enabled: d.portal_enabled !== false && d.portal_enabled !== 0,
          portal_welcome_text: d.portal_welcome_text || '',
          portal_cta_button: d.portal_cta_button || 'Solicitar cita',
          logo_url: d.logo_url || '',
          google_business_url: d.google_business_url || '',
          google_maps_embed_src: d.google_maps_embed_src || '',
        });
      })
      .catch(() => setSnackbar({ open: true, message: 'Error al cargar la configuración.', severity: 'error' }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadCompany();
  }, [loadCompany]);

  const setTab = (index) => {
    const id = TAB_IDS[index];
    setSearchParams(id === 'datos' ? {} : { tab: id });
  };

  const showSuccess = (message) => {
    setSnackbar({ open: true, message, severity: 'success' });
  };
  const showError = (message) => {
    setSnackbar({ open: true, message: message || 'Error al guardar.', severity: 'error' });
  };

  const handleSaveDatos = (e) => {
    e.preventDefault();
    setSaving(true);
    const social = company.social_links || {};
    const payload = {
      name: company.name.trim() || undefined,
      address: (company.address || '').trim() || undefined,
      phone: (company.phone || '').trim() || undefined,
      email: (company.email || '').trim() || undefined,
      website: (company.website || '').trim() || undefined,
      short_description: (company.short_description || '').trim() || undefined,
      description: (company.description || '').trim() || undefined,
      social_links: (social.facebook || social.instagram || social.twitter || social.linkedin)
        ? { facebook: (social.facebook || '').trim() || undefined, instagram: (social.instagram || '').trim() || undefined, twitter: (social.twitter || '').trim() || undefined, linkedin: (social.linkedin || '').trim() || undefined }
        : undefined,
      google_business_url: (company.google_business_url || '').trim() || undefined,
      google_maps_embed_src: (company.google_maps_embed_src || '').trim() || undefined,
    };
    instanceClient
      .patch('/data/company', payload)
      .then(() => {
        showSuccess('Datos guardados correctamente.');
        refresh();
      })
      .catch((err) => showError(err.response?.data?.error))
      .finally(() => setSaving(false));
  };

  const handleSavePortal = (e) => {
    e.preventDefault();
    setSaving(true);
    instanceClient
      .patch('/data/company', {
        portal_enabled: company.portal_enabled,
        portal_welcome_text: (company.portal_welcome_text || '').trim() || undefined,
        portal_cta_button: (company.portal_cta_button || '').trim() || 'Solicitar cita',
      })
      .then(() => {
        showSuccess('Configuración del portal guardada.');
        refresh();
      })
      .catch((err) => showError(err.response?.data?.error))
      .finally(() => setSaving(false));
  };

  const handleUploadLogo = (file) => {
    setSaving(true);
    const formData = new FormData();
    formData.append('logo', file);
    instanceClient
      .post('/data/company/logo', formData)
      .then((res) => {
        setCompany((c) => ({ ...c, logo_url: res.data?.logo_url || '' }));
        showSuccess('Logo subido correctamente.');
        refresh();
      })
      .catch((err) => showError(err.response?.data?.error))
      .finally(() => setSaving(false));
  };

  const handleSaveApariencia = (e) => {
    e.preventDefault();
    setSaving(true);
    const colors = primaryColor
      ? typeof company.colors === 'object'
        ? { ...company.colors, primary: primaryColor }
        : primaryColor
      : undefined;
    instanceClient
      .patch('/data/company', {
        colors: colors ? (typeof colors === 'string' ? colors : JSON.stringify(colors)) : undefined,
      })
      .then(() => {
        showSuccess('Apariencia guardada correctamente.');
        refresh();
      })
      .catch((err) => showError(err.response?.data?.error))
      .finally(() => setSaving(false));
  };

  const handleSaveHorarios = (e) => {
    e.preventDefault();
    setSaving(true);
    instanceClient
      .patch('/data/company', { business_hours: company.business_hours })
      .then(() => showSuccess('Horarios guardados correctamente.'))
      .catch((err) => showError(err.response?.data?.error))
      .finally(() => setSaving(false));
  };

  const setBusinessHours = (dayIndex, config) => {
    setCompany((c) => ({
      ...c,
      business_hours: { ...(c.business_hours || {}), [String(dayIndex)]: config },
    }));
  };

  const openProDialog = (index = -1) => {
    setEditingProIndex(index);
    if (index >= 0 && professionals[index]) {
      setProNombre(professionals[index].name || '');
      setProRol(professionals[index].rol || '');
    } else {
      setProNombre('');
      setProRol('');
    }
    setProDialog(true);
  };

  const handleSavePro = () => {
    const name = proNombre.trim();
    if (!name) return;
    const next = [...professionals];
    const item = { name, rol: proRol.trim() || undefined };
    if (editingProIndex >= 0) next[editingProIndex] = item;
    else next.push(item);
    setCompany((c) => ({ ...c, professionals: next }));
    setProDialog(false);
    setSaving(true);
    instanceClient
      .patch('/data/company', { professionals: next })
      .then(() => {
        showSuccess(editingProIndex >= 0 ? 'Profesional actualizado.' : 'Profesional añadido.');
        refresh();
      })
      .catch((err) => showError(err.response?.data?.error))
      .finally(() => setSaving(false));
  };

  const openConfirmDelete = (index) => setConfirmDelete({ open: true, index });
  const closeConfirmDelete = () => setConfirmDelete({ open: false, index: null });

  const handleConfirmDeletePro = () => {
    const { index } = confirmDelete;
    if (index == null) {
      closeConfirmDelete();
      return;
    }
    const next = professionals.filter((_, i) => i !== index);
    setCompany((c) => ({ ...c, professionals: next }));
    setSaving(true);
    instanceClient
      .patch('/data/company', { professionals: next })
      .then(() => {
        showSuccess('Profesional eliminado.');
        refresh();
        closeConfirmDelete();
      })
      .catch((err) => {
        showError(err.response?.data?.error);
        closeConfirmDelete();
      })
      .finally(() => setSaving(false));
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="40vh"
        aria-busy="true"
        aria-label="Cargando configuración"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" component="main" sx={{ py: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight={700} sx={{ mb: 3 }}>
        Configuración
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Ajusta los datos de tu clínica, horarios, apariencia y equipo.
      </Typography>

      <Tabs
        value={tabIndex}
        onChange={(_, v) => setTab(v)}
        variant={isSmall ? 'scrollable' : 'standard'}
        scrollButtons={isSmall ? 'auto' : false}
        aria-label="Secciones de configuración"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          mb: 3,
          '& .MuiTab-root': { minHeight: 48, textTransform: 'none', fontWeight: 600 },
        }}
      >
        {TAB_CONFIG.map((t, i) => (
          <Tab
            key={t.id}
            label={t.label}
            icon={t.icon}
            iconPosition="start"
            id={`config-tab-${i}`}
            aria-controls={`config-panel-${i}`}
          />
        ))}
      </Tabs>

      <Box role="tabpanel" id={`config-panel-${tabIndex}`} aria-labelledby={`config-tab-${tabIndex}`}>
        {/* Datos del negocio */}
        {activeTabId === 'datos' && (
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardHeader
              title="Datos del negocio"
              subheader="Información de contacto y descripción para la web y el portal"
              titleTypographyProps={{ variant: 'h6', component: 'h2' }}
            />
            <CardContent>
              <form onSubmit={handleSaveDatos} noValidate>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Identidad</Typography>
                <TextField
                  fullWidth
                  label="Nombre de la clínica"
                  value={company.name}
                  onChange={(e) => setCompany((c) => ({ ...c, name: e.target.value }))}
                  required
                  autoComplete="organization"
                  inputProps={{ 'aria-label': 'Nombre de la clínica' }}
                  sx={{ mb: 2 }}
                />
                <Divider sx={{ my: 3 }} />
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Contacto</Typography>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Teléfono" value={company.phone} onChange={(e) => setCompany((c) => ({ ...c, phone: e.target.value }))} placeholder="+34 600 000 000" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Email" type="email" value={company.email} onChange={(e) => setCompany((c) => ({ ...c, email: e.target.value }))} placeholder="contacto@clinica.es" />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Dirección" value={company.address} onChange={(e) => setCompany((c) => ({ ...c, address: e.target.value }))} placeholder="Calle, número, código postal, ciudad" />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Web" value={company.website} onChange={(e) => setCompany((c) => ({ ...c, website: e.target.value }))} placeholder="https://www.miclinica.es" />
                  </Grid>
                </Grid>
                <Divider sx={{ my: 3 }} />
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Descripción</Typography>
                <TextField fullWidth label="Resumen (línea corta)" value={company.short_description} onChange={(e) => setCompany((c) => ({ ...c, short_description: e.target.value }))} placeholder="Ej: Fisioterapia y readaptación deportiva" sx={{ mb: 2 }} />
                <TextField fullWidth label="Descripción" value={company.description} onChange={(e) => setCompany((c) => ({ ...c, description: e.target.value }))} multiline rows={4} placeholder="Texto que verán los pacientes en el portal público" sx={{ mb: 2 }} />
                <Divider sx={{ my: 3 }} />
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Redes sociales (URLs)</Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {['facebook', 'instagram', 'twitter', 'linkedin'].map((key) => (
                    <Grid item xs={12} sm={6} key={key}>
                      <TextField fullWidth label={key.charAt(0).toUpperCase() + key.slice(1)} value={company.social_links?.[key] || ''} onChange={(e) => setCompany((c) => ({ ...c, social_links: { ...(c.social_links || {}), [key]: e.target.value } }))} placeholder={`https://${key}.com/...`} />
                    </Grid>
                  ))}
                </Grid>
                <Divider sx={{ my: 3 }} />
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Google</Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Enlace a ficha de Google (Google Business)" value={company.google_business_url || ''} onChange={(e) => setCompany((c) => ({ ...c, google_business_url: e.target.value }))} placeholder="https://g.page/tu-negocio o enlace de tu ficha" />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="URL del iframe de Google Maps" value={company.google_maps_embed_src || ''} onChange={(e) => setCompany((c) => ({ ...c, google_maps_embed_src: e.target.value }))} placeholder="https://www.google.com/maps/embed?pb=..." helperText="En Google Maps: Compartir → Insertar un mapa → copiar la URL del src del iframe" />
                  </Grid>
                </Grid>
                <Button type="submit" variant="contained" size="large" startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />} disabled={saving} aria-busy={saving}>
                  {saving ? 'Guardando…' : 'Guardar datos'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Apariencia */}
        {activeTabId === 'apariencia' && (
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardHeader
              title="Apariencia"
              subheader="Color principal de la aplicación y logo"
              titleTypographyProps={{ variant: 'h6', component: 'h2' }}
            />
            <CardContent>
              <form onSubmit={handleSaveApariencia} noValidate>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Color principal
                </Typography>
                <Box sx={{ mb: 3 }}>
                  <ColorPicker
                    label="Color primario"
                    color={primaryColor}
                    onChange={(v) =>
                      setCompany((c) => ({
                        ...c,
                        colors: typeof c.colors === 'object' ? { ...c.colors, primary: v } : v,
                      }))
                    }
                  />
                </Box>
                <Divider sx={{ my: 3 }} />
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Logo
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                  {company.logo_url && (
                    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1, bgcolor: 'background.default' }}>
                      <img src={`/api/uploads/${company.logo_url}`} alt="Logo actual" style={{ maxHeight: 80, maxWidth: 200, objectFit: 'contain' }} />
                    </Box>
                  )}
                  <Box>
                    <input accept="image/jpeg,image/png,image/gif,image/webp" type="file" id="logo-upload" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadLogo(f); e.target.value = ''; }} />
                    <Button variant="outlined" component="label" htmlFor="logo-upload" disabled={saving}>
                      {saving ? 'Subiendo…' : 'Elegir y subir logo'}
                    </Button>
                    <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>JPG, PNG, GIF o WebP. Máx. 2 MB.</Typography>
                  </Box>
                </Box>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  disabled={saving}
                  aria-busy={saving}
                >
                  {saving ? 'Guardando…' : 'Guardar apariencia'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Horarios */}
        {activeTabId === 'horarios' && (
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardHeader
              title="Horarios de atención"
              subheader="Define el horario de cada día de la semana"
              titleTypographyProps={{ variant: 'h6', component: 'h2' }}
            />
            <CardContent>
              <form onSubmit={handleSaveHorarios} noValidate>
                {DAYS.map((day, i) => (
                  <DaySchedule
                    key={day}
                    day={day}
                    dayConfig={company.business_hours?.[String(i)]}
                    onChange={(config) => setBusinessHours(i, config)}
                  />
                ))}
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  disabled={saving}
                  sx={{ mt: 2 }}
                  aria-busy={saving}
                >
                  {saving ? 'Guardando…' : 'Guardar horarios'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Equipo */}
        {activeTabId === 'equipo' && (
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardHeader
              title="Equipo"
              subheader="Profesionales de la clínica"
              titleTypographyProps={{ variant: 'h6', component: 'h2' }}
              action={
                <Button
                  variant="contained"
                  size="medium"
                  startIcon={<AddIcon />}
                  onClick={() => openProDialog(-1)}
                  aria-label="Añadir profesional"
                >
                  Añadir
                </Button>
              }
            />
            <CardContent>
              {professionals.length === 0 ? (
                <Box
                  sx={{
                    py: 4,
                    textAlign: 'center',
                    color: 'text.secondary',
                    border: '1px dashed',
                    borderColor: 'divider',
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="body2">No hay profesionales añadidos.</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => openProDialog(-1)}
                    sx={{ mt: 2 }}
                  >
                    Añadir el primero
                  </Button>
                </Box>
              ) : (
                <List disablePadding>
                  {professionals.map((p, i) => (
                    <ListItem
                      key={i}
                      divider={i < professionals.length - 1}
                      secondaryAction={
                        <ListItemSecondaryAction>
                          <IconButton
                            size="small"
                            onClick={() => openProDialog(i)}
                            aria-label={`Editar ${p.name || 'profesional'}`}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => openConfirmDelete(i)}
                            aria-label={`Eliminar ${p.name || 'profesional'}`}
                          >
                            <DeleteOutlineIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      }
                    >
                      <ListItemText
                        primary={p.name || '—'}
                        secondary={p.rol || 'Sin cargo'}
                        primaryTypographyProps={{ fontWeight: 500 }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        )}

        {/* Portal público */}
        {activeTabId === 'portal' && (
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardHeader
              title="Portal público"
              subheader="Página que ven los pacientes no registrados: información, contacto y solicitud de cita"
              titleTypographyProps={{ variant: 'h6', component: 'h2' }}
            />
            <CardContent>
              <form onSubmit={handleSavePortal} noValidate>
                <FormControlLabel
                  control={
                    <Switch
                      checked={company.portal_enabled !== false}
                      onChange={(e) => setCompany((c) => ({ ...c, portal_enabled: e.target.checked }))}
                      color="primary"
                    />
                  }
                  label="Portal público activo (visible para quien no ha iniciado sesión)"
                  sx={{ display: 'block', mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Texto de bienvenida"
                  value={company.portal_welcome_text || ''}
                  onChange={(e) => setCompany((c) => ({ ...c, portal_welcome_text: e.target.value }))}
                  multiline
                  rows={3}
                  placeholder="Bienvenidos a nuestra clínica. Aquí podéis solicitar cita o contactarnos."
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Texto del botón principal"
                  value={company.portal_cta_button || ''}
                  onChange={(e) => setCompany((c) => ({ ...c, portal_cta_button: e.target.value }))}
                  placeholder="Solicitar cita"
                  sx={{ mb: 3 }}
                />
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                  <Button type="submit" variant="contained" size="large" startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />} disabled={saving} aria-busy={saving}>
                    {saving ? 'Guardando…' : 'Guardar configuración del portal'}
                  </Button>
                  <Button
                    component="a"
                    href={paths.portalPath + (slug ? `?slug=${encodeURIComponent(slug)}` : '')}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="outlined"
                    startIcon={<OpenInNewIcon />}
                  >
                    Ver portal público
                  </Button>
                </Box>
              </form>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Diálogo añadir/editar profesional */}
      <Dialog
        open={proDialog}
        onClose={() => setProDialog(false)}
        maxWidth="xs"
        fullWidth
        aria-labelledby="pro-dialog-title"
        aria-describedby="pro-dialog-desc"
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle id="pro-dialog-title">
          {editingProIndex >= 0 ? 'Editar profesional' : 'Añadir profesional'}
        </DialogTitle>
        <DialogContent id="pro-dialog-desc">
          <TextField
            fullWidth
            label="Nombre"
            value={proNombre}
            onChange={(e) => setProNombre(e.target.value)}
            required
            autoFocus
            margin="normal"
            inputProps={{ 'aria-label': 'Nombre del profesional' }}
          />
          <TextField
            fullWidth
            label="Cargo o rol"
            value={proRol}
            onChange={(e) => setProRol(e.target.value)}
            margin="normal"
            placeholder="Ej. Fisioterapeuta, Recepcionista"
            inputProps={{ 'aria-label': 'Cargo o rol' }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setProDialog(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSavePro}
            disabled={!proNombre.trim() || saving}
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo confirmar eliminar */}
      <Dialog
        open={confirmDelete.open}
        onClose={closeConfirmDelete}
        aria-labelledby="confirm-delete-title"
        aria-describedby="confirm-delete-desc"
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle id="confirm-delete-title">Eliminar profesional</DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-delete-desc">
            ¿Estás seguro de que quieres eliminar a{' '}
            {confirmDelete.index != null && professionals[confirmDelete.index]
              ? professionals[confirmDelete.index].name
              : 'este profesional'}
            ? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeConfirmDelete}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleConfirmDeletePro} autoFocus>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          elevation={6}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
