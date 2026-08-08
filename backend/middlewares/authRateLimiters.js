import rateLimit from "express-rate-limit";

const buildKey = (req) => {
  const email = typeof req.body?.email === "string"
    ? req.body.email.trim().toLowerCase()
    : "";

  return email || req.ip || req.socket?.remoteAddress || "unknown";
};

const buildLimiter = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: buildKey,
    message: { mensaje: message },
  });

export const loginLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Demasiados intentos de inicio de sesión. Inténtalo más tarde.",
});

export const registroLimiter = buildLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: "Demasiados registros seguidos. Inténtalo más tarde.",
});

export const verificarCodigoLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Has hecho demasiados intentos de verificación. Espera unos minutos.",
});

export const reenviarCodigoLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Has solicitado demasiados reenvíos. Espera unos minutos.",
});

export const solicitarRecuperacionLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Has hecho demasiadas solicitudes de recuperación. Inténtalo más tarde.",
});

export const verificarRecuperacionLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Has hecho demasiados intentos de recuperación. Espera unos minutos.",
});

export const resetearContrasenaLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Has hecho demasiados intentos para cambiar la contraseña. Inténtalo más tarde.",
});
