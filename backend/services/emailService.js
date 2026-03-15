import nodemailer from "nodemailer";

export const enviarCodigoVerificacion = async (email, codigo) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Código de Verificación - UT Tehuacán",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; text-align: center;">UT Tehuacán</h1>
        </div>
        
        <div style="background: #f7f7f7; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Verificación de Cuenta</h2>
          <p style="color: #666; font-size: 16px;">Tu código de verificación es:</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h1 style="color: #667eea; font-size: 48px; letter-spacing: 10px; margin: 0;">
              ${codigo}
            </h1>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            ⏱️ Este código expira en <strong>10 minutos</strong>.
          </p>
          
          <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
            Si no solicitaste este código, ignora este mensaje.
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Email enviado a:", email);
  } catch (error) {
    console.error("❌ Error enviando email:", error);
    throw error;
  }
};
export const enviarNotificacionLocal = async (email, nombreLocal, aprobado) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: aprobado
      ? `✅ Tu local "${nombreLocal}" fue aprobado - UT Tehuacán`
      : `❌ Tu local "${nombreLocal}" fue rechazado - UT Tehuacán`,
    html: aprobado ? `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; text-align: center;">UT Tehuacán</h1>
        </div>
        <div style="background: #f7f7f7; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">¡Tu local fue aprobado! 🎉</h2>
          <p style="color: #666; font-size: 16px;">
            Tu solicitud para el local <strong>${nombreLocal}</strong> ha sido <strong style="color:#10b981">aprobada</strong> por el administrador.
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
    ` : `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; text-align: center;">UT Tehuacán</h1>
        </div>
        <div style="background: #f7f7f7; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Solicitud rechazada</h2>
          <p style="color: #666; font-size: 16px;">
            Tu solicitud para el local <strong>${nombreLocal}</strong> ha sido <strong style="color:#ef4444">rechazada</strong> por el administrador.
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
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Notificación de local enviada a:", email);
  } catch (error) {
    console.error("❌ Error enviando notificación:", error);
    throw error;
  }
};