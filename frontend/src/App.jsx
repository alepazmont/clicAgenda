import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useInstance } from './context/InstanceContext';
import { isInstanceHost, getInstancePaths } from './utils/instanceHost';
import Login from './pages/panel/Login';
import InstanceList from './pages/panel/InstanceList';
import CreateInstance from './pages/panel/CreateInstance';
import Debug from './pages/panel/Debug';
import SuperadminEntry from './pages/instance/SuperadminEntry';
import InstanceLogin from './pages/instance/InstanceLogin';
import Dashboard from './pages/instance/Dashboard';
import Citas from './pages/instance/Citas';
import CitaForm from './pages/instance/CitaForm';
import Pacientes from './pages/instance/Pacientes';
import PacienteDetalle from './pages/instance/PacienteDetalle';
import PacienteForm from './pages/instance/PacienteForm';
import Servicios from './pages/instance/Servicios';
import ServiceForm from './pages/instance/ServiceForm';
import ServiciosAsignar from './pages/instance/ServiciosAsignar';
import Tratamientos from './pages/instance/Tratamientos';
import MedicalTreatmentForm from './pages/instance/MedicalTreatmentForm';
import Configuracion from './pages/instance/Configuracion';
import PortalPacientePlaceholder from './pages/instance/PortalPacientePlaceholder';
import PortalPublico from './pages/instance/PortalPublico';
import Layout from './components/Layout';
import InstanceLayout from './components/InstanceLayout';
import { DebugProvider } from './context/DebugContext';
import { InstanceProvider } from './context/InstanceContext';
import { InstanceCompanyProvider } from './context/InstanceCompanyContext';

function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();
  if (loading) return <div style={{ padding: 20 }}>Cargando...</div>;
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function InstanceProtectedRoute({ children }) {
  const { token, slug } = useInstance();
  const paths = getInstancePaths();
  if (!token || !slug) return <Navigate to={paths.loginPath} replace />;
  return children;
}

function InstanceAppRoot() {
  const { token, slug } = useInstance();
  const paths = getInstancePaths();
  if (token && slug) return <Navigate to={paths.dashboardPath} replace />;
  return <Navigate to={paths.loginPath} replace />;
}

function InstanceApp() {
  return (
    <InstanceProvider>
      <Routes>
        <Route path="/" element={<InstanceAppRoot />} />
        <Route path="/auth/superadmin" element={<SuperadminEntry />} />
        <Route path="/login" element={<InstanceLogin />} />
        <Route path="/portal" element={<PortalPublico />} />
        <Route element={<InstanceProtectedRoute><InstanceCompanyProvider><InstanceLayout /></InstanceCompanyProvider></InstanceProtectedRoute>}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="citas" element={<Citas />} />
          <Route path="citas/nueva" element={<CitaForm />} />
          <Route path="citas/editar/:id" element={<CitaForm />} />
          <Route path="pacientes" element={<Pacientes />} />
          <Route path="pacientes/nuevo" element={<PacienteForm />} />
          <Route path="pacientes/editar/:id" element={<PacienteForm />} />
          <Route path="pacientes/detalle/:id" element={<PacienteDetalle />} />
          <Route path="servicios" element={<Servicios />} />
          <Route path="servicios/nuevo" element={<ServiceForm />} />
          <Route path="servicios/editar/:id" element={<ServiceForm />} />
          <Route path="servicios/asignar" element={<ServiciosAsignar />} />
          <Route path="tratamientos" element={<Tratamientos />} />
          <Route path="tratamientos/nuevo" element={<MedicalTreatmentForm />} />
          <Route path="tratamientos/editar/:id" element={<MedicalTreatmentForm />} />
          <Route path="admin/configuracion" element={<Configuracion />} />
          <Route path="mis-citas" element={<PortalPacientePlaceholder title="Mis Citas" />} />
          <Route path="mi-perfil" element={<PortalPacientePlaceholder title="Mi Perfil" />} />
          <Route path="contacto" element={<PortalPacientePlaceholder title="Contacto" />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </InstanceProvider>
  );
}

function PanelApp() {
  const paths = getInstancePaths();
  return (
    <InstanceProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/auth/superadmin" element={<SuperadminEntry />} />
        <Route path="/app" element={<Outlet />}>
          <Route index element={<PanelInstanceRedirect />} />
          <Route path="login" element={<InstanceLogin />} />
          <Route path="portal" element={<PortalPublico />} />
          <Route element={<InstanceProtectedRoute><InstanceCompanyProvider><InstanceLayout /></InstanceCompanyProvider></InstanceProtectedRoute>}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="citas" element={<Citas />} />
            <Route path="citas/nueva" element={<CitaForm />} />
            <Route path="citas/editar/:id" element={<CitaForm />} />
            <Route path="pacientes" element={<Pacientes />} />
            <Route path="pacientes/nuevo" element={<PacienteForm />} />
            <Route path="pacientes/editar/:id" element={<PacienteForm />} />
            <Route path="pacientes/detalle/:id" element={<PacienteDetalle />} />
            <Route path="servicios" element={<Servicios />} />
            <Route path="servicios/nuevo" element={<ServiceForm />} />
            <Route path="servicios/editar/:id" element={<ServiceForm />} />
            <Route path="servicios/asignar" element={<ServiciosAsignar />} />
            <Route path="tratamientos" element={<Tratamientos />} />
            <Route path="tratamientos/nuevo" element={<MedicalTreatmentForm />} />
            <Route path="tratamientos/editar/:id" element={<MedicalTreatmentForm />} />
            <Route path="admin/configuracion" element={<Configuracion />} />
            <Route path="mis-citas" element={<PortalPacientePlaceholder title="Mis Citas" />} />
            <Route path="mi-perfil" element={<PortalPacientePlaceholder title="Mi Perfil" />} />
            <Route path="contacto" element={<PortalPacientePlaceholder title="Contacto" />} />
          </Route>
        </Route>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DebugProvider>
                <Layout />
              </DebugProvider>
            </ProtectedRoute>
          }
        >
          <Route index element={<InstanceList />} />
          <Route path="instances/new" element={<CreateInstance />} />
          <Route path="debug" element={<Debug />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </InstanceProvider>
  );
}

function PanelInstanceRedirect() {
  const { token, slug } = useInstance();
  if (token && slug) return <Navigate to="/app/dashboard" replace />;
  return <Navigate to="/app/login" replace />;
}

export default function App() {
  const instanceOnly = isInstanceHost();
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {instanceOnly ? <InstanceApp /> : <PanelApp />}
    </BrowserRouter>
  );
}
