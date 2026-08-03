import express from "express";
import { protegerRuta } from "../middlewares/authMiddleware.js";
import { guardarPreferencias, obtenerPreferencias, guardarHabitos } from "../controllers/usuarioController.js";

const router = express.Router();

router.put("/preferencias", protegerRuta, guardarPreferencias);
router.get("/preferencias", protegerRuta, obtenerPreferencias);
router.put("/habitos", protegerRuta, guardarHabitos);

export default router;