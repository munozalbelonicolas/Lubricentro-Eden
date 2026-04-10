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

/**
 * Enviar Reporte de Servicio Técnico + Invitación (Bienvenida)
 */
exports.sendServiceReportEmail = async (user, task) => {
  const loginUrl = `${process.env.FRONTEND_URL}/login`;
  const logoUrl = `${process.env.FRONTEND_URL}/logos/Logo-Eden.png`;
  const registerUrl = `${process.env.FRONTEND_URL}/register?email=${user.email}`;

  const mailOptions = {
    from: `"Lubricentro Eden" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: `Reporte de Servicio: ${task.plate || 'Tu Vehículo'} - Lubricentro Eden 🔧`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .container { font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; color: #111827; }
          .header { background: #111827; padding: 40px; text-align: center; }
          .body { padding: 40px; }
          .title { color: #f97316; font-size: 24px; font-weight: 800; margin-bottom: 24px; }
          .report-card { background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 12px; padding: 24px; margin-bottom: 30px; }
          .data-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #edf2f7; }
          .data-label { color: #6b7280; font-size: 14px; }
          .data-value { font-weight: 700; color: #111827; }
          .promo-box { border: 2px dashed #f97316; background: #fff7ed; padding: 24px; border-radius: 12px; text-align: center; }
          .btn { background: #f97316; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; display: inline-block; margin-top: 15px; }
          .footer { background: #f9fafb; padding: 30px; text-align: center; font-size: 12px; color: #9ca3af; }
        </style>
      </head>
      <body style="background-color: #f3f4f6; padding: 20px;">
        <div class="container">
          <div class="header">
            <img src="${logoUrl}" alt="Lubricentro Eden" style="height: 70px;">
          </div>
          <div class="body">
            <h1 class="title">¡Hola ${user.firstName}!</h1>
            <p>Gracias por confiar en <strong>Lubricentro Eden</strong>. Ya finalizamos el servicio de tu vehículo y aquí tenés un resumen técnico de lo realizado:</p>
            
            <div class="report-card">
              <h3 style="margin-top: 0; font-size: 16px; border-bottom: 2px solid #f97316; padding-bottom: 8px; display: inline-block;">Resumen del Service</h3>
              <div style="margin-top: 15px;">
                <div class="data-row">
                  <span class="data-label">Vehículo</span>
                  <span class="data-value">${task.title}</span>
                </div>
                <div class="data-row">
                  <span class="data-label">Patente</span>
                  <span class="data-value">${task.plate || '---'}</span>
                </div>
                <div class="data-row">
                  <span class="data-label">KM Actual</span>
                  <span class="data-value">${task.currentKm?.toLocaleString() || '---'} KM</span>
                </div>
                <div style="margin-top: 15px; background: #fff; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; text-align: center;">
                  <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: 700;">Próximo Cambio Sugerido</p>
                  <p style="margin: 5px 0 0; color: #f97316; font-size: 28px; font-weight: 900;">${task.nextChangeKm?.toLocaleString() || '---'} <span style="font-size: 14px;">KM</span></p>
                </div>
              </div>
            </div>

            <div class="promo-box">
              <h4 style="margin-top: 0; color: #f97316;">🚀 Gestioná tu vehículo online</h4>
              <p style="font-size: 14px; margin-bottom: 0;">Hemos creado un perfil temporal para vos. Registrate formalmente para acceder a tu historial completo, recibir ofertas exclusivas y agendar turnos más rápido.</p>
              <a href="${registerUrl}" class="btn">ACTIVAR MI CUENTA</a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px; text-align: center;">Si tenés alguna duda sobre el servicio, no dudes en contactarnos.</p>
          </div>
          <div class="footer">
            <p><strong>Lubricentro Eden - Servicio Integral Automotor</strong></p>
            <p>Santa Fe, Argentina - Tel: 342-xxxxxxx</p>
            <p>© 2024 Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  return transporter.sendMail(mailOptions);
};
