'use strict';
const { body } = require('express-validator');

exports.productValidator = [
  body('name').trim().notEmpty().withMessage('El nombre del producto es obligatorio.'),
  body('category').trim().notEmpty().withMessage('La categoría es obligatoria.'),
  body('price').isNumeric().withMessage('El precio debe ser un número.')
    .custom(value => value >= 0).withMessage('El precio no puede ser negativo.'),
  body('stock').optional().isNumeric().withMessage('El stock debe ser un número.')
    .custom(value => value >= 0).withMessage('El stock no puede ser negativo.'),
  body('brand').optional().trim(),
];
