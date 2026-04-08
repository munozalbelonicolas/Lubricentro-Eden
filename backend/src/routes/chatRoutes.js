// src/routes/chatRoutes.js
const express     = require("express");
const rateLimit   = require("express-rate-limit");
const { body, validationResult } = require("express-validator");
const {
  sendMessage,
  selectMotor,
  getSession,
} = require("../controllers/chatController");

const router = express.Router();

// Rate limiter específico para el chat: 30 mensajes por IP por minuto
const chatLimiter = rateLimit({
  windowMs:  60 * 1000,
  max:        30,
  message:   { error: "Demasiadas consultas. Esperá un momento antes de continuar." },
  standardHeaders: true,
  legacyHeaders:   false,
});

// Middleware de validación
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

// POST /api/chat/message
router.post(
  "/message",
  chatLimiter,
  [
    body("message")
      .trim()
      .notEmpty().withMessage("El mensaje no puede estar vacío.")
      .isLength({ max: 500 }).withMessage("Mensaje demasiado largo (máx 500 caracteres)."),
    body("sessionId")
      .optional()
      .isUUID().withMessage("sessionId inválido."),
  ],
  validate,
  sendMessage
);

// POST /api/chat/select-motor
router.post(
  "/select-motor",
  chatLimiter,
  [
    body("sessionId").notEmpty().isUUID().withMessage("sessionId inválido."),
    body("motor").trim().notEmpty().withMessage("Motor requerido.")
      .isLength({ max: 100 }).withMessage("Nombre de motor demasiado largo."),
  ],
  validate,
  selectMotor
);

// GET /api/chat/session/:sessionId
router.get("/session/:sessionId", getSession);

module.exports = router;
