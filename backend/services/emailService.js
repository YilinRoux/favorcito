import nodemailer from "nodemailer";

const isDev = process.env.NODE_ENV !== "production";

let transporter = null;

const getTransporter = () => {
  const user = process.env.EMAIL_USER?.trim();
  const pass = process.env.EMAIL_PASS?.replace(/\s/g, "");

  if (!user || !pass) {
    throw new Error("Faltan variables SMTP: EMAIL_USER, EMAIL_PASS");
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
  }
  return transporter;
};

const enviarConGmailApi = async ({ to, subject, text, html }) => {
  await getTransporter().sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
    html,
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
