import express from "express";
import { protegerRuta } from "../middlewares/authMiddleware.js";
import { crearReporte } from "../controllers/reporteController.js";

const router = express.Router();

router.post("/", protegerRuta, crearReporte);

export default router;