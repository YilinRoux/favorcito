const autorizarRoles = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        mensaje: "No tienes permiso para acceder a esta ruta",
      });
    }
    next();
  };
};

export default autorizarRoles;

export const soloEstudiante = (req, res, next) => {
  if (req.usuario.rol !== "estudiante") {
    return res.status(403).json({ mensaje: "Acceso solo para estudiantes" });
  }
  next();
};

export const soloVendedor = (req, res, next) => {
  if (req.usuario.rol !== "vendedor") {
    return res.status(403).json({ mensaje: "Acceso solo para vendedores" });
  }
  next();
};

export const soloAdmin = (req, res, next) => {
  if (req.usuario.rol !== "admin") {
    return res.status(403).json({ mensaje: "Acceso solo para admin" });
  }
  next();
};