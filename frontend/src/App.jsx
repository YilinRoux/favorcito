import Inicio from "./pages/Inicio";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import SidebarAdmin from "./components/layout/SidebarAdmin";

/* AUTH */
import Login from "./pages/auth/Login";
import Registro from "./pages/auth/Registro";
import VerificarCodigo from "./pages/auth/VerificarCodigo";

/* ESTUDIANTE */
import Perfil from "./pages/estudiante/Perfil";
import MenuLocales from "./pages/estudiante/MenuLocales";
import DetalleLocal from "./pages/estudiante/DetalleLocal";
import ConfirmarPedido from "./pages/estudiante/ConfirmarPedido";
import MisPedidos from "./pages/estudiante/MisPedidos";
import RastreoPedido from "./pages/estudiante/RastreoPedido";
import CalificarPedido from "./pages/estudiante/CalificarPedido";

/* VENDEDOR */
import DashboardVendedor from "./pages/vendedor/DashboardVendedor";
import GestionMenu from "./pages/vendedor/GestionMenu";
import SolicitarAlta from "./pages/vendedor/SolicitarAlta";
import EstadoSolicitud from "./pages/vendedor/EstadoSolicitud";
import PromocionAnuncios from "./pages/vendedor/PromocionAnuncios";

/* REPARTIDOR */
import Favorcito from "./pages/repartidor/Favorcito";
import DetallePedido from "./pages/repartidor/DetallePedido";
import MisEntregas from "./pages/repartidor/MisEntregas";

/* ADMIN */
import DashboardAdmin from "./pages/admin/DashboardAdmin";
import ValidarLocales from "./pages/admin/ValidarLocales";
import DetalleValidacion from "./pages/admin/DetalleValidacion";
import UsuariosSospechosos from "./pages/admin/UsuariosSospechosos";
import GestionReportes from "./pages/admin/GestionReportes";
import Estadisticas from "./pages/admin/Estadisticas";

/* CHAT */
import ChatPedido from "./pages/chat/ChatPedido";

function LayoutAdmin({ children }) {
  return (
    <div className="flex">
      <SidebarAdmin />
      <div className="ml-56 flex-1 min-h-screen bg-gray-50">
        {children}
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Inicio />} />

        {/* AUTH */}
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/verificar-codigo" element={<VerificarCodigo />} />

        {/* ESTUDIANTE */}
        <Route path="/menu" element={<MenuLocales />} />
        <Route path="/local/:id" element={<DetalleLocal />} />
        <Route path="/confirmar" element={<ConfirmarPedido />} />
        <Route path="/mis-pedidos" element={<MisPedidos />} />
        <Route path="/rastreo/:id" element={<RastreoPedido />} />
        <Route path="/calificar/:id" element={<CalificarPedido />} />
        <Route path="/perfil" element={<Perfil />} />

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

        {/* CHAT */}
        <Route path="/chat/:pedidoId" element={<ChatPedido />} />
      </Routes>
    </Router>
  );
}

export default App;