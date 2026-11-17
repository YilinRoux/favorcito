import MarcoEstudiante from "./components/estudiante/MarcoEstudiante";
import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import LayoutAdmin from "./components/admin/LayoutAdmin";

const Inicio = lazy(() => import("./pages/Inicio"));

/* AUTH */
const Login = lazy(() => import("./pages/auth/Login"));
const Registro = lazy(() => import("./pages/auth/Registro"));
const VerificarCodigo = lazy(() => import("./pages/auth/VerificarCodigo"));
const RecuperarContrasena = lazy(() => import("./pages/auth/RecuperarContrasena"));

/* ESTUDIANTE */
const Perfil = lazy(() => import("./pages/estudiante/Perfil"));
const MenuLocales = lazy(() => import("./pages/estudiante/MenuLocales"));
const DetalleLocal = lazy(() => import("./pages/estudiante/DetalleLocal"));
const ConfirmarPedido = lazy(() => import("./pages/estudiante/ConfirmarPedido"));
const MisPedidos = lazy(() => import("./pages/estudiante/MisPedidos"));
const RastreoPedido = lazy(() => import("./pages/estudiante/RastreoPedido"));
const CalificarPedido = lazy(() => import("./pages/estudiante/CalificarPedido"));
const Onboarding = lazy(() => import("./pages/estudiante/Onboarding"));
const OnboardingHabitos = lazy(() => import("./pages/estudiante/OnboardingHabitos"));
const OnboardingConfirmacion = lazy(() => import("./pages/estudiante/OnboardingConfirmacion"));

/* VENDEDOR */
const DashboardVendedor = lazy(() => import("./pages/vendedor/DashboardVendedor"));
const GestionMenu = lazy(() => import("./pages/vendedor/GestionMenu"));
const SolicitarAlta = lazy(() => import("./pages/vendedor/SolicitarAlta"));
const EstadoSolicitud = lazy(() => import("./pages/vendedor/EstadoSolicitud"));
const PromocionAnuncios = lazy(() => import("./pages/vendedor/PromocionAnuncios"));

/* REPARTIDOR */
const Favorcito = lazy(() => import("./pages/repartidor/Favorcito"));
const DetallePedido = lazy(() => import("./pages/repartidor/DetallePedido"));
const MisEntregas = lazy(() => import("./pages/repartidor/MisEntregas"));

/* ADMIN */
const DashboardAdmin = lazy(() => import("./pages/admin/DashboardAdmin"));
const ValidarLocales = lazy(() => import("./pages/admin/ValidarLocales"));
const DetalleValidacion = lazy(() => import("./pages/admin/DetalleValidacion"));
const UsuariosSospechosos = lazy(() => import("./pages/admin/UsuariosSospechosos"));
const GestionReportes = lazy(() => import("./pages/admin/GestionReportes"));
const Estadisticas = lazy(() => import("./pages/admin/Estadisticas"));
const Apelaciones = lazy(() => import("./pages/admin/Apelaciones"));

/* CHAT */
const ChatPedido = lazy(() => import("./pages/chat/ChatPedido"));

function LoadingView() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-white/70">
        Cargando...
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Navbar />
      <Suspense fallback={<LoadingView />}>
        <Routes>
          <Route path="/" element={<Inicio />} />

          {/* AUTH */}
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/verificar-codigo" element={<VerificarCodigo />} />
          <Route path="/recuperar-contrasena" element={<RecuperarContrasena />} />

          {/* ESTUDIANTE */}
          <Route path="/menu" element={<MarcoEstudiante><MenuLocales /></MarcoEstudiante>} />
          <Route path="/local/:id" element={<MarcoEstudiante><DetalleLocal /></MarcoEstudiante>} />
          <Route path="/confirmar" element={<MarcoEstudiante><ConfirmarPedido /></MarcoEstudiante>} />
          <Route path="/mis-pedidos" element={<MarcoEstudiante><MisPedidos /></MarcoEstudiante>} />
          <Route path="/rastreo/:id" element={<MarcoEstudiante><RastreoPedido /></MarcoEstudiante>} />
          <Route path="/calificar/:id" element={<MarcoEstudiante><CalificarPedido /></MarcoEstudiante>} />
          <Route path="/perfil" element={<MarcoEstudiante><Perfil /></MarcoEstudiante>} />
          <Route path="/onboarding" element={<MarcoEstudiante><Onboarding /></MarcoEstudiante>} />
          <Route path="/onboarding/habitos" element={<MarcoEstudiante><OnboardingHabitos /></MarcoEstudiante>} />
          <Route path="/onboarding/confirmacion" element={<MarcoEstudiante><OnboardingConfirmacion /></MarcoEstudiante>} />

          {/* VENDEDOR */}
          <Route path="/vendedor/dashboard" element={<DashboardVendedor />} />
          <Route path="/vendedor/menu" element={<GestionMenu />} />
          <Route path="/vendedor/solicitar" element={<SolicitarAlta />} />
          <Route path="/vendedor/estado" element={<EstadoSolicitud />} />
          <Route path="/vendedor/promocion" element={<PromocionAnuncios />} />

          {/* REPARTIDOR */}
          <Route path="/favorcito" element={<MarcoEstudiante><Favorcito /></MarcoEstudiante>} />
          <Route path="/pedido/:id" element={<MarcoEstudiante><DetallePedido /></MarcoEstudiante>} />
          <Route path="/mis-entregas" element={<MarcoEstudiante><MisEntregas /></MarcoEstudiante>} />

          {/* ADMIN */}
          <Route path="/admin/dashboard" element={<LayoutAdmin><DashboardAdmin /></LayoutAdmin>} />
          <Route path="/admin/validar" element={<LayoutAdmin><ValidarLocales /></LayoutAdmin>} />
          <Route path="/admin/validacion/:id" element={<LayoutAdmin><DetalleValidacion /></LayoutAdmin>} />
          <Route path="/admin/sospechosos" element={<LayoutAdmin><UsuariosSospechosos /></LayoutAdmin>} />
          <Route path="/admin/reportes" element={<LayoutAdmin><GestionReportes /></LayoutAdmin>} />
          <Route path="/admin/estadisticas" element={<LayoutAdmin><Estadisticas /></LayoutAdmin>} />
          <Route path="/admin/apelaciones" element={<LayoutAdmin><Apelaciones /></LayoutAdmin>} />

          {/* CHAT */}
          <Route path="/chat/:pedidoId" element={<ChatPedido />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
