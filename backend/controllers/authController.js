import Usuario from "../models/Usuario.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { enviarCodigoVerificacion } from "../services/emailService.js";

const LIMITE_INTENTOS_CODIGO = 5;
const SALT_ROUNDS = 12;

const normalizarEmail = (email) => String(email || "").trim().toLowerCase();
const generarCodigo = () => Math.floor(100000 + Math.random() * 900000).toString();
const esHashBcrypt = (value) => typeof value === "string" && /^\$2[aby]\$\d{2}\$/.test(value);

const hasExpired = (fecha) => Boolean(fecha) && new Date() > new Date(fecha);

const logError = (contexto, error) => {
  if (process.env.NODE_ENV !== "production") {
    console.error(`❌ ${contexto}:`, error.message);
    console.error(error.stack);
    return;
  }

  console.error(`❌ ${contexto}:`, error.message);
};

const enviarCodigoEnSegundoPlano = (email, codigo, contexto) => {
  void enviarCodigoVerificacion(email, codigo).catch((emailError) => {
    logError(`Error enviando email (${contexto})`, emailError);
  });
};

const guardarCodigoSeguro = (codigo) => bcrypt.hash(codigo, SALT_ROUNDS);

const codigoCoincide = async (codigoIngresado, codigoGuardado) => {
  if (!codigoGuardado) return false;

  if (esHashBcrypt(codigoGuardado)) {
    return bcrypt.compare(String(codigoIngresado), codigoGuardado);
  }

  return String(codigoIngresado) === String(codigoGuardado);
};

const limpiarCodigoVerificacion = (usuario) => {
  usuario.codigoVerificacion = null;
  usuario.codigoExpiracion = null;
  usuario.codigoVerificacionIntentos = 0;
};

const limpiarCodigoRecuperacion = (usuario) => {
  usuario.codigoRecuperacion = null;
  usuario.codigoRecuperacionExpira = null;
  usuario.codigoRecuperacionIntentos = 0;
};

export const registro = async (req, res) => {
  try {
    const {
      nombre_completo,
      email,
      password,
      rol,
      año_academico,
    } = req.body;

    const emailNormalizado = normalizarEmail(email);
    const nombreNormalizado = String(nombre_completo || "").trim();

    const existeUsuario = await Usuario.findOne({ email: emailNormalizado });
    if (existeUsuario) {
      return res.status(400).json({ mensaje: "El usuario ya existe" });
    }

    let matricula = null;

    if (rol === "estudiante") {
      const regexInstitucional = /^a\d+@alumno\.uttehuacan\.edu\.mx$/;

      if (!regexInstitucional.test(emailNormalizado)) {
        return res.status(400).json({
          mensaje: "Debe usar un correo institucional válido.",
        });
      }

      matricula = emailNormalizado.split("@")[0];

      const matriculaExistente = await Usuario.findOne({ matricula });
      if (matriculaExistente) {
        return res.status(400).json({
          mensaje: "Esta matrícula ya está registrada.",
        });
      }
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const codigoVerificacion = generarCodigo();
    const codigoExpiracion = new Date(Date.now() + 10 * 60 * 1000);

    const nuevoUsuario = new Usuario({
      nombre_completo: nombreNormalizado,
      email: emailNormalizado,
      password: passwordHash,
      rol,
      año_academico,
      ...(rol === "estudiante" && { matricula }),
      verificado: false,
      codigoVerificacion: await guardarCodigoSeguro(codigoVerificacion),
      codigoExpiracion,
      codigoVerificacionIntentos: 0,
    });

    await nuevoUsuario.save();

    enviarCodigoEnSegundoPlano(emailNormalizado, codigoVerificacion, "registro");

    res.status(201).json({
      mensaje: "Usuario registrado. Revisa tu correo para verificar tu cuenta.",
      email: emailNormalizado,
    });
  } catch (error) {
    logError("ERROR GENERAL registro", error);

    res.status(500).json({
      mensaje: "Error en el servidor",
    });
  }
};

export const verificarCodigo = async (req, res) => {
  try {
    const { email, codigo } = req.body;
    const emailNormalizado = normalizarEmail(email);

    const usuario = await Usuario.findOne({ email: emailNormalizado }).select(
      "+codigoVerificacion +codigoExpiracion +codigoVerificacionIntentos"
    );

    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    if (usuario.verificado) {
      return res.status(400).json({ mensaje: "Usuario ya verificado" });
    }

    if (hasExpired(usuario.codigoExpiracion)) {
      limpiarCodigoVerificacion(usuario);
      await usuario.save();
      return res.status(400).json({
        mensaje: "Código expirado. Solicita uno nuevo.",
      });
    }

    if ((usuario.codigoVerificacionIntentos || 0) >= LIMITE_INTENTOS_CODIGO) {
      limpiarCodigoVerificacion(usuario);
      await usuario.save();
      return res.status(429).json({
        mensaje: "Has excedido los intentos permitidos. Solicita un nuevo código.",
      });
    }

    const codigoValido = await codigoCoincide(codigo, usuario.codigoVerificacion);

    if (!codigoValido) {
      usuario.codigoVerificacionIntentos = (usuario.codigoVerificacionIntentos || 0) + 1;

      if (usuario.codigoVerificacionIntentos >= LIMITE_INTENTOS_CODIGO) {
        limpiarCodigoVerificacion(usuario);
        await usuario.save();
        return res.status(429).json({
          mensaje: "Has excedido los intentos permitidos. Solicita un nuevo código.",
        });
      }

      await usuario.save();
      return res.status(400).json({ mensaje: "Código incorrecto" });
    }

    usuario.verificado = true;
    limpiarCodigoVerificacion(usuario);
    await usuario.save();

    res.json({ mensaje: "Cuenta verificada exitosamente" });
  } catch (error) {
    logError("ERROR GENERAL verificarCodigo", error);

    res.status(500).json({
      mensaje: "Error en el servidor",
    });
  }
};

export const reenviarCodigo = async (req, res) => {
  try {
    const { email } = req.body;
    const emailNormalizado = normalizarEmail(email);

    const usuario = await Usuario.findOne({ email: emailNormalizado });

    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    if (usuario.verificado) {
      return res.status(400).json({ mensaje: "Usuario ya verificado" });
    }

    const codigoVerificacion = generarCodigo();
    const codigoExpiracion = new Date(Date.now() + 10 * 60 * 1000);

    usuario.codigoVerificacion = await guardarCodigoSeguro(codigoVerificacion);
    usuario.codigoExpiracion = codigoExpiracion;
    usuario.codigoVerificacionIntentos = 0;
    await usuario.save();

    enviarCodigoEnSegundoPlano(emailNormalizado, codigoVerificacion, "reenviar");

    res.json({ mensaje: "Código reenviado a tu correo" });
  } catch (error) {
    logError("ERROR GENERAL reenviarCodigo", error);

    res.status(500).json({
      mensaje: "Error en el servidor",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const emailNormalizado = normalizarEmail(email);

    const usuario = await Usuario.findOne({ email: emailNormalizado });
    if (!usuario) {
      return res.status(400).json({ mensaje: "Credenciales inválidas" });
    }

    if (!usuario.activo) {
      return res.status(403).json({
        mensaje: "Cuenta suspendida. Contacte a la administración.",
      });
    }

    const passwordValido = await bcrypt.compare(password, usuario.password);
    if (!passwordValido) {
      return res.status(400).json({ mensaje: "Credenciales inválidas" });
    }

    if (usuario.verificado === false) {
      return res.status(403).json({
        mensaje: "Debes verificar tu cuenta antes de iniciar sesión. Revisa tu correo.",
      });
    }

    const token = jwt.sign(
      { id: usuario._id, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      mensaje: "Login exitoso",
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre_completo,
        email: usuario.email,
        rol: usuario.rol,
        onboardingCompletado: usuario.onboardingCompletado,
      },
    });
  } catch (error) {
    logError("ERROR GENERAL login", error);

    res.status(500).json({
      mensaje: "Error en el servidor",
    });
  }
};

export const solicitarRecuperacion = async (req, res) => {
  try {
    const { email } = req.body;
    const emailNormalizado = normalizarEmail(email);

    const usuario = await Usuario.findOne({ email: emailNormalizado });
    if (!usuario) {
      return res.status(404).json({ mensaje: "No existe una cuenta con ese correo" });
    }

    const codigo = generarCodigo();
    const expira = new Date(Date.now() + 15 * 60 * 1000);

    usuario.codigoRecuperacion = await guardarCodigoSeguro(codigo);
    usuario.codigoRecuperacionExpira = expira;
    usuario.codigoRecuperacionIntentos = 0;
    await usuario.save();

    enviarCodigoEnSegundoPlano(emailNormalizado, codigo, "recuperacion");

    res.json({ mensaje: "Código enviado al correo" });
  } catch (error) {
    logError("ERROR recuperacion", error);

    res.status(500).json({ mensaje: "Error al enviar el código" });
  }
};

export const verificarCodigoRecuperacion = async (req, res) => {
  try {
    const { email, codigo } = req.body;
    const emailNormalizado = normalizarEmail(email);

    const usuario = await Usuario.findOne({ email: emailNormalizado }).select(
      "+codigoRecuperacion +codigoRecuperacionExpira +codigoRecuperacionIntentos"
    );

    if (!usuario) {
      return res.status(404).json({ mensaje: "Correo no encontrado" });
    }

    if (hasExpired(usuario.codigoRecuperacionExpira)) {
      limpiarCodigoRecuperacion(usuario);
      await usuario.save();
      return res.status(400).json({ mensaje: "El código ha expirado" });
    }

    if ((usuario.codigoRecuperacionIntentos || 0) >= LIMITE_INTENTOS_CODIGO) {
      limpiarCodigoRecuperacion(usuario);
      await usuario.save();
      return res.status(429).json({
        mensaje: "Has excedido los intentos permitidos. Solicita un nuevo código.",
      });
    }

    const codigoValido = await codigoCoincide(codigo, usuario.codigoRecuperacion);

    if (!codigoValido) {
      usuario.codigoRecuperacionIntentos = (usuario.codigoRecuperacionIntentos || 0) + 1;

      if (usuario.codigoRecuperacionIntentos >= LIMITE_INTENTOS_CODIGO) {
        limpiarCodigoRecuperacion(usuario);
        await usuario.save();
        return res.status(429).json({
          mensaje: "Has excedido los intentos permitidos. Solicita un nuevo código.",
        });
      }

      await usuario.save();
      return res.status(400).json({ mensaje: "Código incorrecto" });
    }

    res.json({ mensaje: "Código válido" });
  } catch (error) {
    logError("ERROR verificar recuperacion", error);

    res.status(500).json({ mensaje: "Error al verificar el código" });
  }
};

export const resetearContrasena = async (req, res) => {
  try {
    const { email, codigo, nuevaContrasena } = req.body;
    const emailNormalizado = normalizarEmail(email);

    const usuario = await Usuario.findOne({ email: emailNormalizado }).select(
      "+codigoRecuperacion +codigoRecuperacionExpira +codigoRecuperacionIntentos"
    );

    if (!usuario) {
      return res.status(404).json({ mensaje: "Correo no encontrado" });
    }

    if (hasExpired(usuario.codigoRecuperacionExpira)) {
      limpiarCodigoRecuperacion(usuario);
      await usuario.save();
      return res.status(400).json({ mensaje: "El código ha expirado" });
    }

    const codigoValido = await codigoCoincide(codigo, usuario.codigoRecuperacion);
    if (!codigoValido) {
      usuario.codigoRecuperacionIntentos = (usuario.codigoRecuperacionIntentos || 0) + 1;

      if (usuario.codigoRecuperacionIntentos >= LIMITE_INTENTOS_CODIGO) {
        limpiarCodigoRecuperacion(usuario);
        await usuario.save();
        return res.status(429).json({
          mensaje: "Has excedido los intentos permitidos. Solicita un nuevo código.",
        });
      }

      await usuario.save();
      return res.status(400).json({ mensaje: "Código inválido" });
    }

    usuario.password = await bcrypt.hash(nuevaContrasena, SALT_ROUNDS);
    limpiarCodigoRecuperacion(usuario);
    await usuario.save();

    res.json({ mensaje: "Contraseña actualizada correctamente" });
  } catch (error) {
    logError("ERROR resetear contrasena", error);

    res.status(500).json({ mensaje: "Error al resetear la contraseña" });
  }
};
