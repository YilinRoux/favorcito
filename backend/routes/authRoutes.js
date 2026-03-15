import express from "express";
import { 
  registro, 
  login, 
  verificarCodigo, 
  reenviarCodigo,
  solicitarRecuperacion,
  verificarCodigoRecuperacion,
  resetearContrasena
} from "../controllers/authController.js";

const router = express.Router();

// Auth
router.post("/login", login);
router.post("/registro", registro);

// Verificación
router.post("/verificar-codigo", verificarCodigo);
router.post("/reenviar-codigo", reenviarCodigo);

// Recuperación de contraseña
router.post("/recuperar-contrasena", solicitarRecuperacion);
router.post("/verificar-recuperacion", verificarCodigoRecuperacion);
router.post("/resetear-contrasena", resetearContrasena);


export default router;
