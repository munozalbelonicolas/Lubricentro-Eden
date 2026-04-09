'use strict';

require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.zoho.com',
  port: process.env.EMAIL_PORT || 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

console.log('Testing email transport...');
console.log('User:', process.env.EMAIL_USER);
console.log('Pass length:', process.env.EMAIL_PASS?.length);

transporter.verify((error, success) => {
  if (error) {
    console.error('Verify error:', error);
  } else {
    console.log('Server is ready to take our messages');
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // self test
      subject: 'Test Email',
      text: 'If you see this, email sending works.',
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error('Send error:', err);
      } else {
        console.log('Email sent:', info.response);
      }
    });
  }
});
