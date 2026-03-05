import express from "express";
import { protegerRuta } from "../middlewares/authMiddleware.js";
import autorizarRoles from "../middlewares/roleMiddleware.js";
import {
  crearLocal,
  aprobarLocal,
  obtenerLocales,
  obtenerMiLocal,
  obtenerPendientes,
  obtenerLocalPublico, // ✅ Cambiado aquí
  actualizarPromocion,
  eliminarImagenAnuncio,
  calificarLocal,
  comentarLocal
} from "../controllers/localController.js";
import { upload } from "../config/multer.js";

const router = express.Router();

// 🔹 Obtener locales pendientes (Admin)
router.get(
  "/pendientes",
  protegerRuta,
  autorizarRoles("admin"),
  obtenerPendientes
);

// 🔹 Obtener mi local (Vendedor)
router.get(
  "/mi-local",
  protegerRuta,
  autorizarRoles("vendedor"),
  obtenerMiLocal
);

// 🔹 Actualizar promoción (Vendedor)
router.put(
  "/mi-local/promocion",
  protegerRuta,
  autorizarRoles("vendedor"),
  upload.array("imagenesAnuncios", 5),
  actualizarPromocion
);

// 🔹 Eliminar imagen de anuncio (Vendedor)
router.put(
  "/mi-local/eliminar-imagen",
  protegerRuta,
  autorizarRoles("vendedor"),
  eliminarImagenAnuncio
);

// 🔹 Obtener todos los locales
router.get("/", obtenerLocales);

// 🔹 Obtener local público por ID ✅
router.get("/:id", obtenerLocalPublico);

// 🔹 Crear local (Vendedor)
router.post(
  "/",
  protegerRuta,
  autorizarRoles("vendedor"),
  upload.array("fotos", 3),
  crearLocal
);

// 🔹 Aprobar local (Admin)
router.put(
  "/:id/aprobar",
  protegerRuta,
  autorizarRoles("admin"),
  aprobarLocal
);

// ⭐ Calificar local (Estudiante)
router.post(
  "/:id/calificar",
  protegerRuta,
  autorizarRoles("estudiante"),
  calificarLocal
);

// ⭐ Comentar local (Estudiante)
router.post(
  "/:id/comentar",
  protegerRuta,
  autorizarRoles("estudiante"),
  comentarLocal
);

export default router;