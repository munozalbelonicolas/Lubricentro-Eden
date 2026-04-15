'use strict';

const asyncHandler = require('express-async-handler');
const { calcularEnvio } = require('../services/andreani.service');
const AppError = require('../utils/AppError');

/**
 * POST /api/shipping/quote
 *
 * Body:
 * {
 *   cpDestino:      string  (obligatorio)
 *   pesoGramos?:    number  (default 1000)
 *   largoCm?:       number  (default 20)
 *   anchoCm?:       number  (default 15)
 *   altoCm?:        number  (default 10)
 *   valorDeclarado?: number (default 0 — precio del carrito)
 * }
 */
exports.quote = asyncHandler(async (req, res) => {
  const {
    cpDestino,
    pesoGramos    = 1000,
    largoCm       = 20,
    anchoCm       = 15,
    altoCm        = 10,
    valorDeclarado = 0,
  } = req.body;

  // Validar CP: solo números, entre 4 y 8 dígitos
  if (!cpDestino || !/^\d{4,8}$/.test(String(cpDestino).trim())) {
    throw new AppError('Código postal inválido. Ingresá un CP de 4 a 8 dígitos.', 400);
  }

  const result = await calcularEnvio({
    cpDestino: String(cpDestino).trim(),
    pesoGramos:     Number(pesoGramos),
    largoCm:        Number(largoCm),
    anchoCm:        Number(anchoCm),
    altoCm:         Number(altoCm),
    valorDeclarado: Number(valorDeclarado),
  });

  res.json({ ok: true, data: result });
});
