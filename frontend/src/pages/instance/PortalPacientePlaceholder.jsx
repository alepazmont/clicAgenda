import { Box, Container, Typography, Paper } from '@mui/material';

export default function PortalPacientePlaceholder({ title = 'Portal del paciente' }) {
  return (
    <Container maxWidth="sm">
      <Paper sx={{ p: 4, mt: 4, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>{title}</Typography>
        <Typography color="text.secondary">Proximamente. Esta seccion estara disponible cuando el portal del paciente este activo.</Typography>
      </Paper>
    </Container>
  );
}
