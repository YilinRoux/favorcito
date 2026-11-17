import express from "express";
import rateLimit from "express-rate-limit";
import { protegerRuta } from "../middlewares/authMiddleware.js";
import { soloEstudiante } from "../middlewares/roleMiddleware.js";
import { crearReporte, crearReportePedido, miReportePedido } from "../controllers/reporteController.js";

const router = express.Router();

const limitarReportes = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { mensaje: "Demasiados reportes, intenta más tarde" },
});

router.post("/", protegerRuta, limitarReportes, crearReporte);
router.post("/pedido/:pedidoId", protegerRuta, soloEstudiante, limitarReportes, crearReportePedido);
router.get("/pedido/:pedidoId/mio", protegerRuta, soloEstudiante, miReportePedido);

export default router;
