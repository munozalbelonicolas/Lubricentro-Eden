'use strict';

const nodemailer = require('nodemailer');

/**
 * Configuración de transporte para Zoho Mail
 */
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtppro.zoho.com',
  port: process.env.EMAIL_PORT || 465,
  secure: true, // true para 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Enviar email de verificación
 */
exports.sendVerificationEmail = async (user, token) => {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: `"Lubricentro Eden" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: 'Verificá tu cuenta - Lubricentro Eden',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #ff6b00; text-align: center;">¡Bienvenido a Lubricentro Eden!</h2>
        <p>Hola <strong>${user.firstName}</strong>,</p>
        <p>Gracias por registrarte. Para empezar a usar tu cuenta y realizar compras, necesitamos que verifiques tu dirección de correo electrónico.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="background-color: #ff6b00; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verificar mi Cuenta</a>
        </div>
        <p style="font-size: 0.8rem; color: #666;">Si el botón no funciona, copia y pega este link en tu navegador:</p>
        <p style="font-size: 0.8rem; color: #ff6b00;">${verifyUrl}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 0.7rem; color: #999; text-align: center;">Este es un mensaje automático, por favor no lo respondas.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};
