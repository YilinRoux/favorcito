import express from "express";
import { protegerRuta } from "../middlewares/authMiddleware.js";
import autorizarRoles from "../middlewares/roleMiddleware.js";
import {
  crearProducto,
  obtenerProductosPorLocal,
  editarProducto,
  eliminarProducto,
  toggleProducto
} from "../controllers/productoController.js";
import { upload } from "../config/multer.js";

const router = express.Router();

// 🔹 Obtener productos por local
router.get("/local/:localId", obtenerProductosPorLocal);

// 🔹 Crear producto (Vendedor)
router.post(
  "/",
  protegerRuta,
  autorizarRoles("vendedor"),
  upload.single("imagen"),
  crearProducto
);

// 🔹 Editar producto (Vendedor)
router.put(
  "/:id",
  protegerRuta,
  autorizarRoles("vendedor"),
  upload.single("imagen"),
  editarProducto
);

// 🔹 Activar / Desactivar producto (Vendedor)
router.put(
  "/:id/toggle",
  protegerRuta,
  autorizarRoles("vendedor"),
  toggleProducto
);

// 🔹 Eliminar producto (Vendedor)
router.delete(
  "/:id",
  protegerRuta,
  autorizarRoles("vendedor"),
  eliminarProducto
);

export default router;