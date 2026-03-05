import express from "express";
import { protegerRuta, soloAdmin } from "../middlewares/authMiddleware.js";
import {
  obtenerUsuarios,
  obtenerUsuariosSospechosos,
  suspenderUsuario,
  reactivarUsuario,
} from "../controllers/usuarioController.js";
import {
  obtenerPendientes,
  aprobarLocal,
  obtenerLocalPorId,
} from "../controllers/localController.js";
import {
  obtenerResumen,
  obtenerEstadisticas,
} from "../controllers/adminController.js";
import { obtenerReportes, resolverReporte } from "../controllers/reporteController.js";

const router = express.Router();

// Usuarios
router.get("/usuarios", protegerRuta, soloAdmin, obtenerUsuarios);
router.get("/usuarios/sospechosos", protegerRuta, soloAdmin, obtenerUsuariosSospechosos);
router.put("/usuarios/:usuarioId/suspender", protegerRuta, soloAdmin, suspenderUsuario);
router.put("/usuarios/:usuarioId/reactivar", protegerRuta, soloAdmin, reactivarUsuario);

// Locales
router.get("/locales-pendientes", protegerRuta, soloAdmin, obtenerPendientes);
router.get("/local/:id", protegerRuta, soloAdmin, obtenerLocalPorId);
router.put("/aprobar/:id", protegerRuta, soloAdmin, aprobarLocal);

// Resumen y estadísticas
router.get("/resumen", protegerRuta, soloAdmin, obtenerResumen);
router.get("/estadisticas", protegerRuta, soloAdmin, obtenerEstadisticas);

// Reportes
router.get("/reportes", protegerRuta, soloAdmin, obtenerReportes);
router.put("/reportes/:id/resolver", protegerRuta, soloAdmin, resolverReporte);

export default router;