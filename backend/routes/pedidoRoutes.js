import express from "express";
import {
  crearPedido,
  obtenerPedidosVendedor,
  obtenerMisPedidos,
  obtenerPedidosFavorcito,
  aceptarPedido,
  cambiarEstadoPedido,
  verPedidosDisponiblesFavorcito,
  aceptarFavorcito,
  confirmarEntrega,
  cancelarPedido,
  cancelarPedidoVendedor,
  obtenerPedidoPorId
} from "../controllers/pedidoController.js";

import { protegerRuta } from "../middlewares/authMiddleware.js";
import { soloEstudiante, soloVendedor } from "../middlewares/roleMiddleware.js";

const router = express.Router();

// FAVORCITO — primero para que no los atrape /:id
router.get("/favorcito/disponibles", protegerRuta, verPedidosDisponiblesFavorcito);
router.get("/favorcito/mis-entregas", protegerRuta, obtenerPedidosFavorcito);
router.put("/favorcito/:pedidoId/aceptar", protegerRuta, aceptarFavorcito);
router.put("/favorcito/:pedidoId/entregar", protegerRuta, confirmarEntrega);

// ESTUDIANTE
router.post("/", protegerRuta, soloEstudiante, crearPedido);
router.get("/mis-pedidos", protegerRuta, soloEstudiante, obtenerMisPedidos);
router.put("/:pedidoId/cancelar", protegerRuta, soloEstudiante, cancelarPedido);

// VENDEDOR
router.get("/vendedor", protegerRuta, soloVendedor, obtenerPedidosVendedor);
router.put("/:pedidoId/aceptar", protegerRuta, soloVendedor, aceptarPedido);
router.put("/:pedidoId/estado", protegerRuta, soloVendedor, cambiarEstadoPedido);
router.put("/:pedidoId/cancelar-vendedor", protegerRuta, soloVendedor, cancelarPedidoVendedor);

// OBTENER POR ID — siempre al final
router.get("/:id", protegerRuta, obtenerPedidoPorId);

export default router;