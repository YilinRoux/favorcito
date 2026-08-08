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
import {
  loginLimiter,
  registroLimiter,
  reenviarCodigoLimiter,
  resetearContrasenaLimiter,
  solicitarRecuperacionLimiter,
  verificarCodigoLimiter,
  verificarRecuperacionLimiter,
} from "../middlewares/authRateLimiters.js";
import {
  validarLogin,
  validarRegistro,
  validarReenviarCodigo,
  validarResetearContrasena,
  validarSolicitarRecuperacion,
  validarVerificarCodigo,
  validarVerificarRecuperacion,
} from "../validators/authValidators.js";

const router = express.Router();

// Auth
router.post("/login", loginLimiter, validarLogin, login);
router.post("/registro", registroLimiter, validarRegistro, registro);

// Verificación
router.post("/verificar-codigo", verificarCodigoLimiter, validarVerificarCodigo, verificarCodigo);
router.post("/reenviar-codigo", reenviarCodigoLimiter, validarReenviarCodigo, reenviarCodigo);

// Recuperación de contraseña
router.post("/recuperar-contrasena", solicitarRecuperacionLimiter, validarSolicitarRecuperacion, solicitarRecuperacion);
router.post("/verificar-recuperacion", verificarRecuperacionLimiter, validarVerificarRecuperacion, verificarCodigoRecuperacion);
router.post("/resetear-contrasena", resetearContrasenaLimiter, validarResetearContrasena, resetearContrasena);


export default router;
