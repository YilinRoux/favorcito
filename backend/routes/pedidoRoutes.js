import express from "express";
import { solicitarDevolucion, obtenerDevoluciones, recibirDevolucion } from "../controllers/devolucionController.js";
import { obtenerReposicionesPendientes, resolverReposicion } from "../controllers/reposicionController.js";
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
router.get("/favorcito/disponibles", protegerRuta, soloEstudiante, verPedidosDisponiblesFavorcito);
router.get("/favorcito/mis-entregas", protegerRuta, soloEstudiante, obtenerPedidosFavorcito);
router.put("/favorcito/:pedidoId/aceptar", protegerRuta, soloEstudiante, aceptarFavorcito);
router.put("/favorcito/:pedidoId/entregar", protegerRuta, soloEstudiante, confirmarEntrega);

// ESTUDIANTE
router.put("/:pedidoId/devolucion", protegerRuta, soloEstudiante, solicitarDevolucion);
router.post("/", protegerRuta, soloEstudiante, crearPedido);
router.get("/mis-pedidos", protegerRuta, soloEstudiante, obtenerMisPedidos);
router.put("/:pedidoId/cancelar", protegerRuta, soloEstudiante, cancelarPedido);

// VENDEDOR
router.get("/devoluciones-pendientes", protegerRuta, soloVendedor, obtenerDevoluciones);
router.put("/:pedidoId/devolucion/recibir", protegerRuta, soloVendedor, recibirDevolucion);
router.get("/reposiciones-pendientes", protegerRuta, soloVendedor, obtenerReposicionesPendientes);
router.put("/:pedidoId/reposicion", protegerRuta, soloVendedor, resolverReposicion);
router.get("/vendedor", protegerRuta, soloVendedor, obtenerPedidosVendedor);
router.put("/:pedidoId/aceptar", protegerRuta, soloVendedor, aceptarPedido);
router.put("/:pedidoId/estado", protegerRuta, soloVendedor, cambiarEstadoPedido);
router.put("/:pedidoId/cancelar-vendedor", protegerRuta, soloVendedor, cancelarPedidoVendedor);

// OBTENER POR ID — siempre al final
router.get("/:id", protegerRuta, obtenerPedidoPorId);

export default router;