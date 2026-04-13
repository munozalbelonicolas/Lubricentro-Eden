'use strict';
const { body } = require('express-validator');

exports.registerValidator = [
  body('firstName').trim().notEmpty().withMessage('El nombre es obligatorio.'),
  body('lastName').trim().notEmpty().withMessage('El apellido es obligatorio.'),
  body('email').isEmail().withMessage('Email inválido.').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres.'),
  body('document').isNumeric().withMessage('El documento debe contener solo números.'),
  body('phone').trim().notEmpty().withMessage('El teléfono es obligatorio.'),
  body('birthDate').isISO8601().withMessage('Fecha de nacimiento inválida.'),
];

exports.loginValidator = [
  body('email').isEmail().withMessage('Email inválido.').normalizeEmail(),
  body('password').notEmpty().withMessage('La contraseña es obligatoria.'),
];
