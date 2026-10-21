import express from "express";
import rateLimit from "express-rate-limit";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import localRoutes from "./routes/localRoutes.js";
import productoRoutes from "./routes/productoRoutes.js";
import pedidoRoutes from "./routes/pedidoRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import reporteRoutes from "./routes/reporteRoutes.js";
import { protegerRuta } from "./middlewares/authMiddleware.js";
import autorizarRoles from "./middlewares/roleMiddleware.js";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import Usuario from "./models/Usuario.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Pedido from "./models/Pedido.js";
import Local from "./models/Local.js";
import apelacionRoutes from "./routes/apelacionRoutes.js";
import usuarioRoutes from "./routes/usuarioRoutes.js";

dotenv.config();
connectDB();

const isDev = process.env.NODE_ENV !== "production";

const app = express();
app.set("trust proxy", 1);

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",").map(x => x.trim()) : false },
});

app.set("io", io);

const usuariosOnline = new Map();
const publicarUsuariosOnline = () => io.emit("usuariosOnline", Array.from(usuariosOnline.keys()));

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Autenticación requerida"));
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    const usuario = await Usuario.findById(decoded.id).select("_id rol activo verificado");
    if (!usuario || !usuario.activo || !usuario.verificado) return next(new Error("No autorizado"));
    socket.data.usuario = usuario;
    next();
  } catch {
    next(new Error("No autorizado"));
  }
});

io.on("connection", (socket) => {
  const joinPedidoAutorizado = async (pedidoId) => {
    try {
      if (!mongoose.isValidObjectId(pedidoId)) return;
      const pedido = await Pedido.findById(pedidoId).select("estudiante local repartidor").populate("local", "vendedor");
      if (!pedido) return;
      const userId = String(socket.data.usuario._id);
      const autorizado = String(pedido.estudiante) === userId ||
        String(pedido.repartidor) === userId ||
        String(pedido.local?.vendedor) === userId ||
        socket.data.usuario.rol === "admin";
      if (autorizado) socket.join(String(pedido._id));
    } catch (err) {
      if (isDev) console.error("Error validando sala de pedido", err);
    }
  };
  if (isDev) {
    console.log("Usuario conectado:", socket.id);
  }

  socket.on("unirsePedido", async (pedidoId) => {
    await joinPedidoAutorizado(pedidoId);

    if (isDev) {
      console.log(`Socket ${socket.id} se unio al pedido ${pedidoId}`);
    }
  });

  socket.on("join_pedido", async (pedidoId) => {
    await joinPedidoAutorizado(pedidoId);
  });

  socket.on("escribiendo", ({ pedidoId } = {}) => {
    if (typeof pedidoId === "string" && socket.rooms.has(pedidoId)) socket.to(pedidoId).emit("usuarioEscribiendo", { id: String(socket.data.usuario._id) });
  });

  socket.on("registrarUsuario", async () => {
    const usuarioId = String(socket.data.usuario._id);
    const conexiones = usuariosOnline.get(usuarioId) || new Set();
    conexiones.add(socket.id);
    usuariosOnline.set(usuarioId, conexiones);
    publicarUsuariosOnline();
    const usuario = socket.data.usuario;
    let pedidos = [];
    if (usuario.rol === "estudiante") pedidos = await Pedido.find({ estudiante: usuarioId }).select("_id");
    if (usuario.rol === "vendedor") {
      const locales = await Local.find({ vendedor: usuarioId }).select("_id");
      pedidos = await Pedido.find({ local: { $in: locales.map(l => l._id) } }).select("_id");
    }
    if (usuario.rol === "estudiante") {
      pedidos.push(...await Pedido.find({ repartidor: usuarioId }).select("_id"));
    }
    for (const pedido of pedidos) await joinPedidoAutorizado(String(pedido._id));
  });

  socket.on("disconnect", () => {
    const usuarioId = String(socket.data.usuario._id);
    const conexiones = usuariosOnline.get(usuarioId);
    if (conexiones) {
      conexiones.delete(socket.id);
      if (conexiones.size === 0) usuariosOnline.delete(usuarioId);
    }
    publicarUsuariosOnline();
  });
});

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com"],
        connectSrc: ["'self'", "https:", "wss:"],
      },
    },
  })
);
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",").map(x => x.trim()) : false }));
app.use(express.json({ limit: "100kb" }));
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { mensaje: "Demasiadas solicitudes. Intenta más tarde." },
});
app.use("/api/auth", authLimiter);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const frontendDistPath = path.resolve(__dirname, "../frontend/dist");
if (existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));

  app.get(/^\/(?!api\/|uploads\/).*/, (req, res) => {
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
}

app.get("/", (req, res) => res.json({ mensaje: "API funcionando 🚀" }));

app.use("/api/auth", authRoutes);
app.use("/api/locales", localRoutes);
app.use("/api/productos", productoRoutes);
app.use("/api/pedidos", pedidoRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/reportes", reporteRoutes);
app.use("/api/apelaciones", apelacionRoutes);
app.use("/api/usuarios", usuarioRoutes);

app.get("/api/protegido", protegerRuta, (req, res) => {
  res.json({ mensaje: "Ruta protegida accesible", usuario: req.usuario });
});

app.get("/api/admin-test", protegerRuta, autorizarRoles("admin"), (req, res) => {
  res.json({ mensaje: "Bienvenido admin" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ mensaje: "Error interno del servidor" });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT} 🔥`);
});
