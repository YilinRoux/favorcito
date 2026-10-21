import jwt from "jsonwebtoken";
import Usuario from "../models/Usuario.js";

export const protegerRuta = async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (typeof authorization !== "string" || !/^Bearer\s+\S+$/i.test(authorization)) {
    return res.status(401).json({ mensaje: "No autorizado, token requerido" });
  }

  try {
    const token = authorization.split(/\s+/)[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    if (!decoded || typeof decoded.id !== "string") {
      return res.status(401).json({ mensaje: "Token inválido" });
    }
    const usuario = await Usuario.findById(decoded.id).select("-password -codigoVerificacion -codigoRecuperacion");
    if (!usuario || !usuario.activo || !usuario.verificado) {
      return res.status(401).json({ mensaje: "Cuenta no autorizada" });
    }
    req.usuario = usuario;
    return next();
  } catch {
    return res.status(401).json({ mensaje: "Token inválido" });
  }
};

export const soloAdmin = (req, res, next) => {
  if (req.usuario?.rol !== "admin") {
    return res.status(403).json({ mensaje: "Acceso solo para administrador" });
  }
  return next();
};
