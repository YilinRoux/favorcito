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