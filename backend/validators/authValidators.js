import { body } from "express-validator";
import validarRequest from "../middlewares/validateRequest.js";

const normalizarEmail = (value) => String(value || "").trim().toLowerCase();

const campoEmail = body("email")
  .customSanitizer(normalizarEmail)
  .isEmail()
  .withMessage("Correo electrónico inválido");

const campoCodigo = body("codigo")
  .trim()
  .matches(/^\d{6}$/)
  .withMessage("El código debe tener 6 dígitos");

const campoPassword = body("password")
  .isString()
  .isLength({ min: 8, max: 128 })
  .withMessage("La contraseña debe tener entre 8 y 128 caracteres");

const campoNuevaPassword = body("nuevaContrasena")
  .isString()
  .isLength({ min: 8, max: 128 })
  .withMessage("La nueva contraseña debe tener entre 8 y 128 caracteres");

export const validarRegistro = [
  body("nombre_completo")
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("El nombre completo debe tener entre 3 y 100 caracteres"),
  campoEmail,
  campoPassword,
  body("rol")
    .isIn(["estudiante", "vendedor", "admin"])
    .withMessage("El rol enviado no es válido"),
  body("año_academico")
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1, max: 5 })
    .withMessage("El año académico debe estar entre 1 y 5")
    .toInt(),
  validarRequest,
];

export const validarLogin = [campoEmail, campoPassword, validarRequest];

export const validarVerificarCodigo = [campoEmail, campoCodigo, validarRequest];

export const validarReenviarCodigo = [campoEmail, validarRequest];

export const validarSolicitarRecuperacion = [campoEmail, validarRequest];

export const validarVerificarRecuperacion = [campoEmail, campoCodigo, validarRequest];

export const validarResetearContrasena = [
  campoEmail,
  campoCodigo,
  campoNuevaPassword,
  validarRequest,
];
