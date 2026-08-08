import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import SidebarAdmin from "./components/layout/SidebarAdmin";

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

function LayoutAdmin({ children }) {
  return (
    <div className="flex">
      <SidebarAdmin />
      <div className="ml-56 flex-1 min-h-screen bg-gray-50">{children}</div>
    </div>
  );
}

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
          <Route path="/menu" element={<MenuLocales />} />
          <Route path="/local/:id" element={<DetalleLocal />} />
          <Route path="/confirmar" element={<ConfirmarPedido />} />
          <Route path="/mis-pedidos" element={<MisPedidos />} />
          <Route path="/rastreo/:id" element={<RastreoPedido />} />
          <Route path="/calificar/:id" element={<CalificarPedido />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/onboarding/habitos" element={<OnboardingHabitos />} />
          <Route path="/onboarding/confirmacion" element={<OnboardingConfirmacion />} />

          {/* VENDEDOR */}
          <Route path="/vendedor/dashboard" element={<DashboardVendedor />} />
          <Route path="/vendedor/menu" element={<GestionMenu />} />
          <Route path="/vendedor/solicitar" element={<SolicitarAlta />} />
          <Route path="/vendedor/estado" element={<EstadoSolicitud />} />
          <Route path="/vendedor/promocion" element={<PromocionAnuncios />} />

          {/* REPARTIDOR */}
          <Route path="/favorcito" element={<Favorcito />} />
          <Route path="/pedido/:id" element={<DetallePedido />} />
          <Route path="/mis-entregas" element={<MisEntregas />} />

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
