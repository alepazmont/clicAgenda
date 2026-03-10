import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  TextField,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  Link as MuiLink,
  MenuItem,
  useTheme,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LoginIcon from '@mui/icons-material/Login';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LanguageIcon from '@mui/icons-material/Language';
import SendIcon from '@mui/icons-material/Send';
import publicInstanceClient from '../../api/publicInstanceClient';
import { getInstancePaths } from '../../utils/instanceHost';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function formatDayHours(config) {
  if (!config || config.closed) return 'Cerrado';
  const parts = [];
  if (config.morning?.enabled && config.morning?.start && config.morning?.end) {
    parts.push(`${config.morning.start.slice(0, 5)} - ${config.morning.end.slice(0, 5)}`);
  }
  if (config.afternoon?.enabled && config.afternoon?.start && config.afternoon?.end) {
    parts.push(`${config.afternoon.start.slice(0, 5)} - ${config.afternoon.end.slice(0, 5)}`);
  }
  return parts.length ? parts.join(' / ') : 'Cerrado';
}

export default function PortalPublico() {
  const theme = useTheme();
  const paths = getInstancePaths();
  const [company, setCompany] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', service_id: '', preferred_date: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    Promise.all([
      publicInstanceClient.get('/public/company'),
      publicInstanceClient.get('/public/services').catch(() => ({ data: [] })),
    ])
      .then(([companyRes, servicesRes]) => {
        const data = companyRes.data || {};
        if (data.portal_enabled === false || data.portal_enabled === 0) {
          setError('El portal no está disponible.');
          setCompany(data);
        } else {
          setCompany(data);
          setServices(Array.isArray(servicesRes.data) ? servicesRes.data : []);
        }
      })
      .catch((err) => setError(err.response?.data?.error || 'No se pudo cargar la información.'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmitRequest = (e) => {
    e.preventDefault();
    if (!form.name?.trim() || !form.email?.trim()) {
      setError('Nombre y email son obligatorios.');
      return;
    }
    setError('');
    setSending(true);
    publicInstanceClient
      .post('/public/appointment-request', {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        service_id: form.service_id ? parseInt(form.service_id, 10) : undefined,
        preferred_date: form.preferred_date || undefined,
        message: form.message.trim() || undefined,
      })
      .then(() => {
        setSent(true);
        setForm({ name: '', email: '', phone: '', service_id: '', preferred_date: '', message: '' });
      })
      .catch((err) => setError(err.response?.data?.error || 'Error al enviar. Inténtalo de nuevo.'))
      .finally(() => setSending(false));
  };

  const primaryColor = (company?.colors && (typeof company.colors === 'string' ? company.colors : company.colors?.primary)) || theme.palette.primary?.main || '#1976d2';

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !company) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button variant="contained" onClick={() => window.location.href = paths.loginPath}>Ir a inicio de sesión</Button>
      </Container>
    );
  }

  const ctaText = (company?.portal_cta_button || 'Solicitar cita').trim();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 6 }}>
      {/* Cabecera */}
      <Paper
        elevation={0}
        sx={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
          color: '#fff',
          py: 6,
          px: 2,
          borderRadius: 0,
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            {company?.logo_url && (
              <img src={`/api/uploads/${company.logo_url}`} alt="" style={{ maxHeight: 56, maxWidth: 180, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
            )}
            <Typography variant="h3" component="h1" fontWeight={700} gutterBottom sx={{ mb: 0 }}>
              {company?.name || 'Clínica'}
            </Typography>
          </Box>
          {(company?.short_description || company?.portal_welcome_text) && (
            <Typography variant="h6" sx={{ opacity: 0.95, maxWidth: 600 }}>
              {company?.portal_welcome_text?.trim() || company?.short_description}
            </Typography>
          )}
          <Box sx={{ mt: 4, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Button
              component="a"
              href="#solicitar-cita"
              variant="contained"
              size="large"
              sx={{ bgcolor: '#fff', color: primaryColor, '&:hover': { bgcolor: '#f5f5f5' } }}
              startIcon={<CalendarTodayIcon />}
            >
              {ctaText}
            </Button>
            <Button
              component={Link}
              to={paths.loginPath}
              variant="outlined"
              size="large"
              sx={{ borderColor: '#fff', color: '#fff', '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.1)' } }}
              startIcon={<LoginIcon />}
            >
              Acceder (empleados)
            </Button>
          </Box>
        </Container>
      </Paper>

      <Container maxWidth="md" sx={{ mt: -3, position: 'relative' }}>
        {/* Contacto e info */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {(company?.address || company?.phone || company?.email || company?.website) && (
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom fontWeight={600}>Contacto</Typography>
                {company?.address && (
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1.5 }}>
                    <LocationOnIcon color="action" fontSize="small" sx={{ mt: 0.3 }} />
                    <Typography variant="body2">{company.address}</Typography>
                  </Box>
                )}
                {company?.phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <PhoneIcon color="action" fontSize="small" />
                    <MuiLink href={`tel:${company.phone}`} color="inherit" underline="hover">{company.phone}</MuiLink>
                  </Box>
                )}
                {company?.email && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <EmailIcon color="action" fontSize="small" />
                    <MuiLink href={`mailto:${company.email}`} color="inherit" underline="hover">{company.email}</MuiLink>
                  </Box>
                )}
                {company?.website && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LanguageIcon color="action" fontSize="small" />
                    <MuiLink href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer" color="inherit" underline="hover">{company.website}</MuiLink>
                  </Box>
                )}
              </Paper>
            </Grid>
          )}
          {company?.business_hours && Object.keys(company.business_hours).length > 0 && (
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom fontWeight={600}>Horarios</Typography>
                {DAYS.map((day, i) => (
                  <Box key={day} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">{day}</Typography>
                    <Typography variant="body2">{formatDayHours(company.business_hours[String(i)])}</Typography>
                  </Box>
                ))}
              </Paper>
            </Grid>
          )}
        </Grid>

        {company?.description && (
          <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{company.description}</Typography>
          </Paper>
        )}

        {company?.google_business_url && (
          <Paper variant="outlined" sx={{ p: 2, mb: 4 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>En Google</Typography>
            <Button component="a" href={company.google_business_url} target="_blank" rel="noopener noreferrer" variant="outlined" size="small">
              Ver ficha en Google
            </Button>
          </Paper>
        )}

        {company?.google_maps_embed_src && (
          <Paper variant="outlined" sx={{ p: 2, mb: 4 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>Dónde estamos</Typography>
            <Box sx={{ position: 'relative', width: '100%', height: 0, paddingBottom: '56.25%', overflow: 'hidden', borderRadius: 1 }}>
              <iframe title="Mapa" src={company.google_maps_embed_src} width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            </Box>
          </Paper>
        )}

        {/* Formulario solicitud de cita */}
        <Paper id="solicitar-cita" variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom fontWeight={600}>Solicitar cita</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Rellena el formulario y nos pondremos en contacto contigo para confirmar día y hora.
          </Typography>
          {sent && <Alert severity="success" sx={{ mb: 2 }}>Solicitud enviada correctamente. Te contactaremos pronto.</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
          <form onSubmit={handleSubmitRequest} noValidate>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Nombre" name="name" value={form.name} onChange={handleChange} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Teléfono" name="phone" value={form.phone} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth select label="Servicio (opcional)" name="service_id" value={form.service_id} onChange={handleChange}>
                  <MenuItem value="">Ninguno</MenuItem>
                  {services.map((s) => (
                    <MenuItem key={s.id} value={String(s.id)}>{s.name}{s.duration_minutes ? ` (${s.duration_minutes} min)` : ''}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Fecha preferida (opcional)" name="preferred_date" type="date" value={form.preferred_date} onChange={handleChange} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Comentarios" name="message" value={form.message} onChange={handleChange} multiline rows={3} />
              </Grid>
              <Grid item xs={12}>
                <Button type="submit" variant="contained" size="large" startIcon={sending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />} disabled={sending}>
                  {sending ? 'Enviando…' : 'Enviar solicitud'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>

        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Button component={Link} to={paths.loginPath} startIcon={<LoginIcon />} color="primary">
            Acceso para empleados
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
