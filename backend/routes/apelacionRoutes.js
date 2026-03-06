import express from "express";
import { crearApelacion, obtenerApelaciones, resolverApelacion } from "../controllers/apelacionController.js";
import { protegerRuta, soloAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Pública — no requiere token porque el usuario está suspendido
router.post("/", crearApelacion);

// Admin
router.get("/", protegerRuta, soloAdmin, obtenerApelaciones);
router.put("/:id/resolver", protegerRuta, soloAdmin, resolverApelacion);

export default router;