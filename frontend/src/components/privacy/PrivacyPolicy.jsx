import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Link,
  Checkbox,
  FormControlLabel,
  Box,
  Divider,
  Alert,
} from '@mui/material';

const PrivacyPolicy = ({ open, onClose, onAccept }) => {
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    if (accepted) {
      onAccept();
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
      aria-labelledby="privacy-policy-title"
    >
      <DialogTitle id="privacy-policy-title">
        Política de Privacidad y Protección de Datos
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="subtitle1" gutterBottom>
          De conformidad con el Reglamento General de Protección de Datos (RGPD) y la Ley Orgánica de Protección de Datos Personales y Garantía de Derechos Digitales (LOPDGDD), le informamos sobre el tratamiento de sus datos personales.
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
          1. Responsable del tratamiento
        </Typography>
        <Typography paragraph>
          [Nombre de la Clínica de Fisioterapia], con domicilio en [Dirección], CIF [Número], teléfono [Teléfono] y correo electrónico [Email].
        </Typography>

        <Typography variant="h6" gutterBottom>
          2. Finalidad del tratamiento
        </Typography>
        <Typography paragraph>
          Los datos personales que nos proporciona serán utilizados para: gestión de citas y servicios de fisioterapia, gestión administrativa y facturación, historia clínica y seguimiento de tratamientos, y comunicaciones relacionadas con nuestros servicios.
        </Typography>

        <Typography variant="h6" gutterBottom>
          3. Legitimación
        </Typography>
        <Typography paragraph>
          El tratamiento es necesario para la ejecución de la relación contractual y para el cumplimiento de obligaciones legales (Ley 41/2002 de autonomía del paciente).
        </Typography>

        <Typography variant="h6" gutterBottom>
          4. Conservación y derechos
        </Typography>
        <Typography paragraph>
          Los datos se conservarán el tiempo necesario según la legislación (historia clínica mínimo 5 años). Usted tiene derecho a acceder, rectificar, suprimir, limitar, oponerse y a la portabilidad de sus datos, y a reclamar ante la AEPD.
        </Typography>

        <Alert severity="info" sx={{ mt: 2 }}>
          Esta aplicación no utiliza cookies para almacenar información personal.
        </Alert>

        <Box sx={{ mt: 3 }}>
          <FormControlLabel
            control={<Checkbox checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />}
            label="He leído y acepto la política de privacidad y doy mi consentimiento para el tratamiento de mis datos personales."
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleAccept} color="primary" variant="contained" disabled={!accepted}>
          Aceptar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const PrivacyPolicyConsent = ({ onChange, value, required = true }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <FormControlLabel
        required={required}
        sx={{
          '& .MuiFormControlLabel-asterisk': { color: '#d32f2f', fontWeight: 'bold' },
          '& .MuiTypography-root': { whiteSpace: 'nowrap' },
        }}
        control={
          <Checkbox checked={!!value} onChange={(e) => onChange(e.target.checked)} required={required} />
        }
        label={
          <Typography variant="body2" sx={{ display: 'inline-flex', alignItems: 'center' }}>
            Ha leído y acepta la{' '}
            <Link href="#" onClick={(e) => { e.preventDefault(); setOpen(true); }}>
              política de privacidad
            </Link>{' '}
            y da su consentimiento para el tratamiento de sus datos personales.
          </Typography>
        }
      />
      <PrivacyPolicy open={open} onClose={() => setOpen(false)} onAccept={() => onChange(true)} />
    </>
  );
};

export default PrivacyPolicy;
