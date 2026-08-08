import { google } from "googleapis";

const {
  EMAIL_USER,
  GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET,
  GMAIL_REFRESH_TOKEN,
} = process.env;

const base64Encode = (value) => Buffer.from(value).toString("base64");

const base64UrlEncode = (value) =>
  Buffer.from(value)
    .toString("base64url")
    .replace(/=+$/g, "");

const requireGmailOAuthConfig = () => {
  const missing = [];

  if (!EMAIL_USER) missing.push("EMAIL_USER");
  if (!GMAIL_CLIENT_ID) missing.push("GMAIL_CLIENT_ID");
  if (!GMAIL_CLIENT_SECRET) missing.push("GMAIL_CLIENT_SECRET");
  if (!GMAIL_REFRESH_TOKEN) missing.push("GMAIL_REFRESH_TOKEN");

  if (missing.length > 0) {
    throw new Error(
      `Faltan variables de Gmail OAuth2: ${missing.join(", ")}`
    );
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
    requestBody: {
      raw,
    },
  });
};

const plantillaCodigoVerificacion = (codigo) => ({
  subject: "Código de Verificación - UT Tehuacán",
  text: [
    "UT Tehuacán",
    "",
    "Tu código de verificación es:",
    "",
    codigo,
    "",
    "Este código expira en 10 minutos.",
    "",
    "Si no solicitaste este código, ignora este mensaje.",
  ].join("\n"),
  html: `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; text-align: center;">UT Tehuacán</h1>
      </div>
      <div style="background: #f7f7f7; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Verificación de cuenta</h2>
        <p style="color: #666; font-size: 16px;">Tu código de verificación es:</p>
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <h1 style="color: #667eea; font-size: 48px; letter-spacing: 10px; margin: 0;">${codigo}</h1>
        </div>
        <p style="color: #666; font-size: 14px;">⏱️ Este código expira en <strong>10 minutos</strong>.</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
          Si no solicitaste este código, ignora este mensaje.
        </p>
      </div>
    </div>
  `,
});

const plantillaNotificacionLocal = (nombreLocal, aprobado) => ({
  subject: aprobado
    ? `✅ Tu local "${nombreLocal}" fue aprobado - UT Tehuacán`
    : `❌ Tu local "${nombreLocal}" fue rechazado - UT Tehuacán`,
  text: aprobado
    ? [
        "UT Tehuacán",
        "",
        `Tu solicitud para el local "${nombreLocal}" ha sido aprobada por el administrador.`,
        "",
        "Ya puedes iniciar sesión y comenzar a gestionar tu menú y recibir pedidos.",
      ].join("\n")
    : [
        "UT Tehuacán",
        "",
        `Tu solicitud para el local "${nombreLocal}" ha sido rechazada por el administrador.`,
        "",
        "Si crees que es un error, puedes enviar una nueva solicitud con información más completa.",
      ].join("\n"),
  html: aprobado
    ? `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; text-align: center;">UT Tehuacán</h1>
        </div>
        <div style="background: #f7f7f7; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">¡Tu local fue aprobado! 🎉</h2>
          <p style="color: #666; font-size: 16px;">
            Tu solicitud para el local <strong>${nombreLocal}</strong> ha sido
            <strong style="color:#10b981">aprobada</strong> por el administrador.
          </p>
          <p style="color: #666; font-size: 16px;">
            Ya puedes iniciar sesión y comenzar a gestionar tu menú y recibir pedidos.
          </p>
          <div style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #065f46; font-size: 14px;">
              ✅ Accede a tu panel de vendedor para agregar productos y configurar tu local.
            </p>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
            Este mensaje fue generado automáticamente por el sistema de UT Tehuacán.
          </p>
        </div>
      </div>
    `
    : `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; text-align: center;">UT Tehuacán</h1>
        </div>
        <div style="background: #f7f7f7; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Solicitud rechazada</h2>
          <p style="color: #666; font-size: 16px;">
            Tu solicitud para el local <strong>${nombreLocal}</strong> ha sido
            <strong style="color:#ef4444">rechazada</strong> por el administrador.
          </p>
          <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b; font-size: 14px;">
              Si crees que es un error, puedes enviar una nueva solicitud con información más completa.
            </p>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
            Este mensaje fue generado automáticamente por el sistema de UT Tehuacán.
          </p>
        </div>
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
    console.log("✅ Email enviado a:", email);
  } catch (error) {
    console.error("❌ Error enviando email:", error);
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
    console.log("✅ Notificación de local enviada a:", email);
  } catch (error) {
    console.error("❌ Error enviando notificación:", error);
    throw error;
  }
};
