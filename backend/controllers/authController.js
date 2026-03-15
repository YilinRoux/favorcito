import Usuario from "../models/Usuario.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { enviarCodigoVerificacion } from "../services/emailService.js";

// Generar código de 6 dígitos
const generarCodigo = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const registro = async (req, res) => {
  try {
    console.log("📥 Body recibido:", req.body);

    const { nombre_completo, email, password, rol, año_academico } = req.body;

    const existeUsuario = await Usuario.findOne({ email });
    if (existeUsuario) {
      return res.status(400).json({ mensaje: "El usuario ya existe" });
    }

    let matricula = null;

    if (rol === "estudiante") {
      const regexInstitucional = /^a\d+@alumno\.uttehuacan\.edu\.mx$/;

      if (!regexInstitucional.test(email)) {
        return res.status(400).json({
          mensaje: "Debe usar un correo institucional válido.",
        });
      }

      matricula = email.split("@")[0];

      const matriculaExistente = await Usuario.findOne({ matricula });
      if (matriculaExistente) {
        return res.status(400).json({
          mensaje: "Esta matrícula ya está registrada.",
        });
      }
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const codigoVerificacion = generarCodigo();
    const codigoExpiracion = new Date(Date.now() + 10 * 60 * 1000);

   const nuevoUsuario = new Usuario({
  nombre_completo,
  email,
  password: passwordHash,
  rol,
  año_academico,
  ...(rol === "estudiante" && { matricula }),
  verificado: false,
  codigoVerificacion,
  codigoExpiracion,
});

    await nuevoUsuario.save();

    // ✅ TRY/CATCH SOLO PARA EL EMAIL
    try {
      await enviarCodigoVerificacion(email, codigoVerificacion);
    } catch (emailError) {
      console.error("❌ Error enviando email:", emailError.message);
      console.error(emailError.stack);

      await Usuario.findByIdAndDelete(nuevoUsuario._id);

      return res.status(500).json({
        mensaje: "Error al enviar el código de verificación. Intenta de nuevo.",
      });
    }

    res.status(201).json({
      mensaje: "Usuario registrado. Revisa tu correo para verificar tu cuenta.",
      email,
    });

  } catch (error) {
    console.error("❌ ERROR GENERAL:", error.message);
    console.error(error.stack);

    res.status(500).json({
      mensaje: "Error en el servidor",
      error: error.message,
    });
  }
};

// ✅ NUEVA FUNCIÓN: Verificar código
export const verificarCodigo = async (req, res) => {
  try {
    const { email, codigo } = req.body;

    // Buscar usuario incluyendo campos ocultos
    const usuario = await Usuario.findOne({ email })
      .select("+codigoVerificacion +codigoExpiracion");

    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    if (usuario.verificado) {
      return res.status(400).json({ mensaje: "Usuario ya verificado" });
    }

    // Verificar si el código es correcto
    if (usuario.codigoVerificacion !== codigo) {
      return res.status(400).json({ mensaje: "Código incorrecto" });
    }

    // Verificar si el código expiró
    if (new Date() > usuario.codigoExpiracion) {
      return res.status(400).json({ 
        mensaje: "Código expirado. Solicita uno nuevo." 
      });
    }

    // ✅ Marcar como verificado
    usuario.verificado = true;
    usuario.codigoVerificacion = undefined;
    usuario.codigoExpiracion = undefined;
    await usuario.save();

    res.json({ mensaje: "Cuenta verificada exitosamente" });

  } catch (error) {
    res.status(500).json({
      mensaje: "Error en el servidor",
      error: error.message,
    });
  }
};

// ✅ NUEVA FUNCIÓN: Reenviar código
export const reenviarCodigo = async (req, res) => {
  try {
    const { email } = req.body;

    const usuario = await Usuario.findOne({ email });

    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    if (usuario.verificado) {
      return res.status(400).json({ mensaje: "Usuario ya verificado" });
    }

    // Generar nuevo código
    const codigoVerificacion = generarCodigo();
    const codigoExpiracion = new Date(Date.now() + 10 * 60 * 1000);

    usuario.codigoVerificacion = codigoVerificacion;
    usuario.codigoExpiracion = codigoExpiracion;
    await usuario.save();

    // Enviar nuevo código
    await enviarCodigoVerificacion(email, codigoVerificacion);

    res.json({ mensaje: "Código reenviado a tu correo" });

  } catch (error) {
    res.status(500).json({
      mensaje: "Error en el servidor",
      error: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(400).json({ mensaje: "Credenciales inválidas" });
    }

    // ✅ Verificar si el usuario está verificado
    // Permitir login si verificado es undefined (usuarios antiguos)
    if (usuario.verificado === false) {
      return res.status(403).json({
        mensaje: "Debes verificar tu cuenta antes de iniciar sesión. Revisa tu correo.",
      });
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
      },
    });
  } catch (error) {
    res.status(500).json({
      mensaje: "Error en el servidor",
      error: error.message,
    });
  }
};

// Paso 1 — solicitar código
export const solicitarRecuperacion = async (req, res) => {
  try {
    const { email } = req.body;
    const usuario = await Usuario.findOne({ email });
    if (!usuario) return res.status(404).json({ mensaje: "No existe una cuenta con ese correo" });

    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expira = new Date(Date.now() + 15 * 60 * 1000);

    usuario.codigoRecuperacion = codigo;
    usuario.codigoRecuperacionExpira = expira;
    await usuario.save();

    // Usa el mismo servicio que ya tienes
    await enviarCodigoVerificacion(email, codigo);

    res.json({ mensaje: "Código enviado al correo" });
  } catch (err) {
    console.error("❌ Error recuperacion:", err.message);
    res.status(500).json({ mensaje: "Error al enviar el código" });
  }
};
// Paso 2 — verificar código
export const verificarCodigoRecuperacion = async (req, res) => {
  try {
    const { email, codigo } = req.body;
    const usuario = await Usuario.findOne({ email });

    if (!usuario) return res.status(404).json({ mensaje: "Correo no encontrado" });
    if (usuario.codigoRecuperacion !== codigo)
      return res.status(400).json({ mensaje: "Código incorrecto" });
    if (new Date() > usuario.codigoRecuperacionExpira)
      return res.status(400).json({ mensaje: "El código ha expirado" });

    res.json({ mensaje: "Código válido" });
  } catch (err) {
    console.error("❌ Error verificar recuperacion:", err.message);
    res.status(500).json({ mensaje: "Error al verificar el código" });
  }
};

// Paso 3 — cambiar contraseña
export const resetearContrasena = async (req, res) => {
  try {
    const { email, codigo, nuevaContrasena } = req.body;
    const usuario = await Usuario.findOne({ email });

    if (!usuario) return res.status(404).json({ mensaje: "Correo no encontrado" });
    if (usuario.codigoRecuperacion !== codigo)
      return res.status(400).json({ mensaje: "Código inválido" });
    if (new Date() > usuario.codigoRecuperacionExpira)
      return res.status(400).json({ mensaje: "El código ha expirado" });

    usuario.password = await bcrypt.hash(nuevaContrasena, 10);
    usuario.codigoRecuperacion = null;
    usuario.codigoRecuperacionExpira = null;
    await usuario.save();

    res.json({ mensaje: "Contraseña actualizada correctamente" });
  } catch (err) {
    console.error("❌ Error resetear contrasena:", err.message);
    res.status(500).json({ mensaje: "Error al resetear la contraseña" });
  }
};