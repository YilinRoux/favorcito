import express from "express";
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
import Usuario from "./models/Usuario.js";
import Pedido from "./models/Pedido.js";
import Local from "./models/Local.js";
import apelacionRoutes from "./routes/apelacionRoutes.js";


dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

app.set("io", io);

const usuariosOnline = new Map();

io.on("connection", (socket) => {
  console.log("Usuario conectado:", socket.id);

  socket.on("unirsePedido", (pedidoId) => {
    socket.join(pedidoId);
    console.log(`Socket ${socket.id} se unió al pedido ${pedidoId}`);
  });

  socket.on("join_pedido", (pedidoId) => {
    socket.join(pedidoId);
  });

  socket.on("escribiendo", ({ pedidoId, usuario }) => {
    socket.to(pedidoId).emit("usuarioEscribiendo", usuario);
  });

  socket.on("registrarUsuario", async (usuarioId) => {
    usuariosOnline.set(usuarioId, socket.id);
    io.emit("usuariosOnline", Array.from(usuariosOnline.keys()));

    // Unir al usuario a todos sus pedidos activos automáticamente
    try {
      const usuario = await Usuario.findById(usuarioId);
      if (!usuario) return;

      let pedidos = [];

      if (usuario.rol === "estudiante") {
        pedidos = await Pedido.find({ estudiante: usuarioId });
      }

      if (usuario.rol === "vendedor") {
        const locales = await Local.find({ vendedor: usuarioId });
        const localesIds = locales.map((l) => l._id);
        pedidos = await Pedido.find({ local: { $in: localesIds } });
      }

      pedidos.forEach((p) => {
        socket.join(p._id.toString());
      });

      console.log(`Usuario ${usuarioId} (${usuario.rol}) unido a ${pedidos.length} pedidos`);
    } catch (err) {
      console.error("Error uniendo usuario a pedidos:", err);
    }
  });

  socket.on("disconnect", () => {
    for (let [userId, socketId] of usuariosOnline.entries()) {
      if (socketId === socket.id) {
        usuariosOnline.delete(userId);
        break;
      }
    }
    io.emit("usuariosOnline", Array.from(usuariosOnline.keys()));
  });
});

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => res.json({ mensaje: "API funcionando 🚀" }));

app.use("/api/auth", authRoutes);
app.use("/api/locales", localRoutes);
app.use("/api/productos", productoRoutes);
app.use("/api/pedidos", pedidoRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/reportes", reporteRoutes);
app.use("/api/apelaciones", apelacionRoutes);

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
