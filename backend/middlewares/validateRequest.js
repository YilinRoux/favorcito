import { validationResult } from "express-validator";

const validarRequest = (req, res, next) => {
  const errores = validationResult(req);

  if (errores.isEmpty()) {
    return next();
  }

  return res.status(400).json({
    mensaje: errores.array()[0]?.msg || "Datos inválidos",
    errores: errores.array(),
  });
};

export default validarRequest;
