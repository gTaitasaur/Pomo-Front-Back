// src/routes/auth.routes.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const AuthController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Errores de validación',
        code: 'VALIDATION_ERROR',
        details: errors.array()
      }
    });
  }
  next();
};

// Validaciones para registro
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3 })
    .withMessage('El nombre de usuario debe tener al menos 3 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('El nombre de usuario solo puede contener letras, números y guiones bajos'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
  
  body('telefono')
    .optional()
    .trim()
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,5}[-\s\.]?[0-9]{1,5}$/)
    .withMessage('Número de teléfono inválido')
];

// Validaciones para login
const loginValidation = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Usuario o email requerido'),
  
  body('password')
    .notEmpty()
    .withMessage('Contraseña requerida')
];

// Validación para refresh token
const refreshTokenValidation = [
  body('refresh_token')
    .trim()
    .notEmpty()
    .withMessage('Refresh token requerido')
];

// RUTAS PÚBLICAS

// Registro
router.post(
  '/register',
  registerValidation,
  handleValidationErrors,
  AuthController.register
);

// Login
router.post(
  '/login',
  loginValidation,
  handleValidationErrors,
  AuthController.login
);

// Refresh token
router.post(
  '/refresh',
  refreshTokenValidation,
  handleValidationErrors,
  AuthController.refreshToken
);

// RUTAS PROTEGIDAS (requieren autenticación)

// Verificar token actual
router.get(
  '/verify',
  authenticate,
  AuthController.verifyToken
);

// Logout
router.post(
  '/logout',
  AuthController.logout
);

// Logout de todos los dispositivos
router.post(
  '/logout-all',
  authenticate,
  AuthController.logoutAll
);

module.exports = router;