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
  const logoUrl = `${process.env.FRONTEND_URL}/logos/Logo-Eden.png`;
  
  const mailOptions = {
    from: `"Lubricentro Eden" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: '¡Bienvenido! Verificá tu cuenta en Lubricentro Eden 🚀',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .container {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 600px;
            margin: auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 24px rgba(0,0,0,0.1);
            color: #1a1a1a;
          }
          .header {
            background-color: #1a1a1a;
            padding: 40px 20px;
            text-align: center;
          }
          .body {
            padding: 40px;
            line-height: 1.6;
          }
          .welcome-text {
            color: #ff6b00;
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 20px;
            text-align: center;
          }
          .btn-container {
            text-align: center;
            margin: 35px 0;
          }
          .btn {
            background-color: #ff6b00;
            color: #ffffff !important;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 700;
            font-size: 16px;
            box-shadow: 0 4px 12px rgba(255,107,0,0.3);
            display: inline-block;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 30px;
            text-align: center;
            font-size: 12px;
            color: #999;
          }
          .link-alt {
            word-break: break-all;
            color: #ff6b00;
            font-size: 11px;
          }
        </style>
      </head>
      <body style="background-color: #f4f4f4; padding: 20px;">
        <div class="container">
          <div class="header">
            <img src="${logoUrl}" alt="Lubricentro Eden" style="height: 80px; width: auto;">
          </div>
          <div class="body">
            <h1 class="welcome-text">¡Hola ${user.firstName}!</h1>
            <p style="font-size: 16px; text-align: center;">Estamos muy felices de tenerte con nosotros. Para activar tu cuenta y comenzar a disfrutar de todos nuestros servicios y promociones, por favor confirma tu email pulsando el siguiente botón:</p>
            
            <div class="btn-container">
              <a href="${verifyUrl}" class="btn">VERIFICAR MI CUENTA</a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 40px;">Si el botón no funciona, podés copiar y pegar este enlace en tu navegador:</p>
            <p class="link-alt">${verifyUrl}</p>
          </div>
          <div class="footer">
            <p style="margin-bottom: 10px;"><strong>Lubricentro Eden</strong><br>Servicio Integral Automotor</p>
            <p>Este es un mensaje automático. Por favor no lo respondas.<br>© 2024 Lubricentro Eden</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  return transporter.sendMail(mailOptions);
};
/**
 * Enviar email de bienvenida para usuario creado por Admin
 */
exports.sendAdminCreatedUserEmail = async (user, tempPassword) => {
  const loginUrl = `${process.env.FRONTEND_URL}/login`;
  const logoUrl = `${process.env.FRONTEND_URL}/logos/Logo-Eden.png`;

  const mailOptions = {
    from: `"Lubricentro Eden" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: '¡Tu cuenta ha sido creada! - Lubricentro Eden 🛠️',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .container { font-family: sans-serif; max-width: 600px; margin: auto; background: #fff; border-radius: 12px; overflow: hidden; color: #333; border: 1px solid #eee; }
          .header { background: #1a1a1a; padding: 30px; text-align: center; }
          .body { padding: 40px; }
          .highlight { color: #ff6b00; font-weight: bold; }
          .cred-box { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #eee; }
          .btn { background: #ff6b00; color: #fff !important; padding: 14px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; }
          .footer { background: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #888; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${logoUrl}" alt="Logo" style="height: 60px;">
          </div>
          <div class="body">
            <h2 style="margin-top: 0;">¡Hola ${user.firstName}!</h2>
            <p>El administrador de <strong>Lubricentro Eden</strong> ha creado una cuenta para vos. Ahora podés acceder a tu historial de servicios, realizar compras y agendar turnos de forma más simple.</p>
            
            <p>Tus credenciales de acceso son:</p>
            <div class="cred-box">
              <p style="margin: 5px 0;"><strong>Email:</strong> ${user.email}</p>
              <p style="margin: 5px 0;"><strong>Contraseña Temporal:</strong> <span class="highlight">${tempPassword}</span></p>
            </div>
            
            <p style="color: #666; font-size: 14px;">⚠️ Te recomendamos cambiar esta contraseña desde tu perfil una vez que inicies sesión.</p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${loginUrl}" class="btn">INICIAR SESIÓN</a>
            </div>
          </div>
          <div class="footer">
            <p>Lubricentro Eden - Servicio Integral Automotor</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  return transporter.sendMail(mailOptions);
};
