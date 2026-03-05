import express from "express";
import { protegerRuta } from "../middlewares/authMiddleware.js";
import { 
  enviarMensaje, 
  obtenerMensajes,
  marcarComoLeido,
  contarNoLeidos
} from "../controllers/chatController.js";

const router = express.Router();

router.post("/:pedidoId", protegerRuta, enviarMensaje);
router.get("/:pedidoId", protegerRuta, obtenerMensajes);
router.put("/:pedidoId/leido", protegerRuta, marcarComoLeido);
router.get("/:pedidoId/no-leidos", protegerRuta, contarNoLeidos);

export default router;