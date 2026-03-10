import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  InputAdornment,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Payment as PaymentIcon,
  CreditCard as CreditCardIcon,
  MonetizationOn as CashIcon,
  LocalOffer as BonoIcon,
} from '@mui/icons-material';
import instanceClient from '../api/instanceClient';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

export default function PaymentModal({ open, onClose, cita, onSuccess, onError }) {
  const [loading, setLoading] = useState(false);
  const [loadingBonos, setLoadingBonos] = useState(false);
  const [paymentData, setPaymentData] = useState({ tipoPago: '', cantidad: '', idBono: '' });
  const [bonosDisponibles, setBonosDisponibles] = useState([]);
  const [error, setError] = useState('');

  const patientId = cita?.patient_id || cita?.patientId;

  useEffect(() => {
    if (!open) return;
    setPaymentData({ tipoPago: '', cantidad: '', idBono: '' });
    setError('');
    setBonosDisponibles([]);
    if (patientId) {
      setLoadingBonos(true);
      instanceClient.get('/data/patient_services', { params: { patient_id: patientId } })
        .then((r) => setBonosDisponibles((r.data || []).filter((b) => (b.remaining_sessions || 0) > 0)))
        .catch(() => setBonosDisponibles([]))
        .finally(() => setLoadingBonos(false));
    }
  }, [open, patientId]);

  const validateForm = () => {
    if (!paymentData.tipoPago) {
      setError('Debe seleccionar un tipo de pago');
      return false;
    }
    if (paymentData.tipoPago === 'Bono') {
      if (!paymentData.idBono) {
        setError('Debe seleccionar un bono');
        return false;
      }
    } else {
      if (!paymentData.cantidad || parseFloat(paymentData.cantidad) <= 0) {
        setError('La cantidad debe ser mayor a 0');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !cita?.id) return;
    setLoading(true);
    setError('');
    const payload = {
      tipoPago: paymentData.tipoPago,
      cantidad: paymentData.tipoPago === 'Bono' ? 0 : parseFloat(paymentData.cantidad),
      idBono: paymentData.tipoPago === 'Bono' ? paymentData.idBono : null,
    };
    instanceClient
      .put(`/data/appointments/${cita.id}/payment`, payload)
      .then(() => {
        const msg = paymentData.tipoPago === 'Bono' ? 'Pago con bono registrado.' : `Pago de €${payload.cantidad} registrado.`;
        if (onSuccess) onSuccess(msg);
        onClose();
      })
      .catch((err) => {
        const msg = err.response?.data?.error || 'Error al registrar el pago';
        setError(msg);
        if (onError) onError(msg);
      })
      .finally(() => setLoading(false));
  };

  const handleChange = (field, value) => {
    setPaymentData((prev) => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  if (!cita) return null;

  const formatFecha = (d) => (d ? dayjs(d).format('dddd, D [de] MMMM [de] YYYY, HH:mm') : '-');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <PaymentIcon color="primary" />
          <Typography variant="h6">Registrar pago</Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Información de la cita</Typography>
          <Typography variant="body2" color="text.secondary"><strong>Paciente:</strong> {cita.patient_name || '-'}</Typography>
          <Typography variant="body2" color="text.secondary"><strong>Servicio:</strong> {cita.service_name || '-'}</Typography>
          <Typography variant="body2" color="text.secondary"><strong>Fecha:</strong> {formatFecha(cita.start)}</Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <FormControl fullWidth required>
            <InputLabel>Tipo de pago</InputLabel>
            <Select
              value={paymentData.tipoPago}
              onChange={(e) => handleChange('tipoPago', e.target.value)}
              label="Tipo de pago"
              disabled={loading}
            >
              <MenuItem value="Efectivo"><Box display="flex" alignItems="center" gap={1}><CashIcon fontSize="small" />Efectivo</Box></MenuItem>
              <MenuItem value="Tarjeta"><Box display="flex" alignItems="center" gap={1}><CreditCardIcon fontSize="small" />Tarjeta</Box></MenuItem>
              <MenuItem value="Bono"><Box display="flex" alignItems="center" gap={1}><BonoIcon fontSize="small" />Bono{loadingBonos && <CircularProgress size={16} />}</Box></MenuItem>
            </Select>
          </FormControl>

          {paymentData.tipoPago && paymentData.tipoPago !== 'Bono' && (
            <TextField
              fullWidth
              required
              label="Cantidad"
              type="number"
              value={paymentData.cantidad}
              onChange={(e) => handleChange('cantidad', e.target.value)}
              disabled={loading}
              inputProps={{ min: 0, step: 0.01 }}
              InputProps={{ startAdornment: <InputAdornment position="start">€</InputAdornment> }}
            />
          )}

          {paymentData.tipoPago === 'Bono' && (
            <FormControl fullWidth required>
              <InputLabel>Bono</InputLabel>
              <Select
                value={paymentData.idBono}
                onChange={(e) => handleChange('idBono', e.target.value)}
                label="Bono"
                disabled={loading || loadingBonos}
              >
                {bonosDisponibles.length === 0 && !loadingBonos ? (
                  <MenuItem disabled>No hay bonos con sesiones disponibles</MenuItem>
                ) : (
                  bonosDisponibles.map((b) => (
                    <MenuItem key={b.id} value={b.id}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <span>{b.service_name}</span>
                        <Chip label={`${b.remaining_sessions} ses.`} size="small" variant="outlined" />
                      </Box>
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !paymentData.tipoPago || (paymentData.tipoPago === 'Bono' ? !paymentData.idBono : !paymentData.cantidad)}
          startIcon={loading ? <CircularProgress size={20} /> : <PaymentIcon />}
        >
          {loading ? 'Procesando...' : 'Confirmar pago'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
