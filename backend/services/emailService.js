import { google } from "googleapis";

const {
  EMAIL_USER,
  GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET,
  GMAIL_REFRESH_TOKEN,
} = process.env;

const isDev = process.env.NODE_ENV !== "production";

const base64Encode = (value) => Buffer.from(value).toString("base64");
const base64UrlEncode = (value) =>
  Buffer.from(value).toString("base64url").replace(/=+$/g, "");

const requireGmailOAuthConfig = () => {
  const missing = [];

  if (!EMAIL_USER) missing.push("EMAIL_USER");
  if (!GMAIL_CLIENT_ID) missing.push("GMAIL_CLIENT_ID");
  if (!GMAIL_CLIENT_SECRET) missing.push("GMAIL_CLIENT_SECRET");
  if (!GMAIL_REFRESH_TOKEN) missing.push("GMAIL_REFRESH_TOKEN");

  if (missing.length > 0) {
    throw new Error(`Faltan variables de Gmail OAuth2: ${missing.join(", ")}`);
  }
};

const crearGmailClient = () => {
  requireGmailOAuthConfig();

  const oauth2Client = new google.auth.OAuth2(
    GMAIL_CLIENT_ID,
    GMAIL_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    refresh_token: GMAIL_REFRESH_TOKEN,
  });

  return google.gmail({ version: "v1", auth: oauth2Client });
};

let gmailClient = null;

const getGmailClient = () => {
  if (!gmailClient) {
    gmailClient = crearGmailClient();
  }

  return gmailClient;
};

const construirMensajeMime = ({ from, to, subject, text, html }) => {
  const boundary = `favorcito_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  return [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${base64Encode(subject)}?=`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    text,
    "",
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    html,
    "",
    `--${boundary}--`,
    "",
  ].join("\r\n");
};

const enviarConGmailApi = async ({ to, subject, text, html }) => {
  const message = construirMensajeMime({
    from: EMAIL_USER,
    to,
    subject,
    text,
    html,
  });

  const raw = base64UrlEncode(message);
  const gmail = getGmailClient();

  await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });
};

const plantillaCodigoVerificacion = (codigo) => ({
  subject: "Codigo de verificacion - Favorcito",
  text: [
    "Favorcito",
    "",
    "Tu codigo de verificacion es:",
    "",
    codigo,
    "",
    "Este codigo expira en 10 minutos.",
    "",
    "Si no solicitaste este codigo, ignora este mensaje.",
  ].join("\n"),
  html: `
    <div style="font-family: Arial, sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; color: #111;">
      <h1 style="margin: 0 0 12px; font-size: 24px;">Favorcito</h1>
      <p style="font-size: 16px; margin: 0 0 12px;">Tu codigo de verificacion es:</p>
      <div style="background: #111; color: #fff; padding: 18px 24px; border-radius: 12px; display: inline-block; font-size: 34px; letter-spacing: 8px; font-weight: 700;">
        ${codigo}
      </div>
      <p style="margin-top: 16px; font-size: 14px; color: #555;">Este codigo expira en 10 minutos.</p>
      <p style="font-size: 12px; color: #777;">Si no solicitaste este codigo, puedes ignorar este mensaje.</p>
    </div>
  `,
});

const plantillaNotificacionLocal = (nombreLocal, aprobado) => ({
  subject: aprobado
    ? `Tu local "${nombreLocal}" fue aprobado - Favorcito`
    : `Tu local "${nombreLocal}" fue rechazado - Favorcito`,
  text: aprobado
    ? [
        "Favorcito",
        "",
        `Tu solicitud para el local "${nombreLocal}" ha sido aprobada por el administrador.`,
        "",
        "Ya puedes iniciar sesion y comenzar a gestionar tu menu y recibir pedidos.",
      ].join("\n")
    : [
        "Favorcito",
        "",
        `Tu solicitud para el local "${nombreLocal}" ha sido rechazada por el administrador.`,
        "",
        "Si crees que es un error, puedes enviar una nueva solicitud con informacion mas completa.",
      ].join("\n"),
  html: aprobado
    ? `
      <div style="font-family: Arial, sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; color: #111;">
        <h1 style="margin: 0 0 12px; font-size: 24px;">Favorcito</h1>
        <h2 style="margin: 0 0 12px; color: #0f9d58;">Tu local fue aprobado</h2>
        <p style="font-size: 16px;">Tu solicitud para el local <strong>${nombreLocal}</strong> ha sido aprobada.</p>
        <p style="font-size: 14px; color: #555;">Ya puedes iniciar sesion y comenzar a recibir pedidos.</p>
      </div>
    `
    : `
      <div style="font-family: Arial, sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; color: #111;">
        <h1 style="margin: 0 0 12px; font-size: 24px;">Favorcito</h1>
        <h2 style="margin: 0 0 12px; color: #d93025;">Solicitud rechazada</h2>
        <p style="font-size: 16px;">Tu solicitud para el local <strong>${nombreLocal}</strong> ha sido rechazada.</p>
        <p style="font-size: 14px; color: #555;">Si crees que es un error, puedes enviar una nueva solicitud con informacion mas completa.</p>
      </div>
    `,
});

export const enviarCodigoVerificacion = async (email, codigo) => {
  const plantilla = plantillaCodigoVerificacion(codigo);

  try {
    await enviarConGmailApi({
      to: email,
      subject: plantilla.subject,
      text: plantilla.text,
      html: plantilla.html,
    });

    if (isDev) {
      console.log("Email enviado a:", email);
    }
  } catch (error) {
    console.error("Error enviando email:", error.message);
    throw error;
  }
};

export const enviarNotificacionLocal = async (email, nombreLocal, aprobado) => {
  const plantilla = plantillaNotificacionLocal(nombreLocal, aprobado);

  try {
    await enviarConGmailApi({
      to: email,
      subject: plantilla.subject,
      text: plantilla.text,
      html: plantilla.html,
    });

    if (isDev) {
      console.log("Notificacion de local enviada a:", email);
    }
  } catch (error) {
    console.error("Error enviando notificacion:", error.message);
    throw error;
  }
};
