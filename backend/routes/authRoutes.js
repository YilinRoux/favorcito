import express from "express";
import { 
  registro, 
  login, 
  verificarCodigo, 
  reenviarCodigo 
} from "../controllers/authController.js";

const router = express.Router();

router.post("/login", login);
router.post("/registro", registro);
router.post("/verificar-codigo", verificarCodigo);
router.post("/reenviar-codigo", reenviarCodigo);

export default router;