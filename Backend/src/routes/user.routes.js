// src/routes/user.routes.js
const express = require('express');
const { body } = require('express-validator');
const UserController = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = require('express-validator').validationResult(req);
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

// Validaciones para actualización de perfil
const updateProfileValidation = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage('El nombre de usuario debe tener al menos 3 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('El nombre de usuario solo puede contener letras, números y guiones bajos'),
  
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail(),
  
  body('telefono')
    .optional()
    .trim()
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,5}[-\s\.]?[0-9]{1,5}$/)
    .withMessage('Número de teléfono inválido'),
  
  body('imagen_perfil')
    .optional()
    .trim()
    .isURL()
    .withMessage('URL de imagen inválida')
];

// Validaciones para cambio de contraseña
const changePasswordValidation = [
  body('current_password')
    .notEmpty()
    .withMessage('La contraseña actual es requerida'),
  
  body('new_password')
    .isLength({ min: 6 })
    .withMessage('La nueva contraseña debe tener al menos 6 caracteres')
    .custom((value, { req }) => value !== req.body.current_password)
    .withMessage('La nueva contraseña debe ser diferente a la actual')
];

// TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN

// Obtener perfil del usuario actual
router.get(
  '/profile',
  authenticate,
  UserController.getProfile
);

// Actualizar perfil
router.put(
  '/profile',
  authenticate,
  updateProfileValidation,
  handleValidationErrors,
  UserController.updateProfile
);

// Cambiar contraseña
router.post(
  '/:userId/change-password',
  authenticate,
  changePasswordValidation,
  handleValidationErrors,
  UserController.changePassword
);

// Obtener balance del usuario
router.get(
  '/:userId/balance',
  authenticate,
  UserController.getBalance
);

// Obtener estadísticas de Pomodoros
router.get(
  '/:userId/pomodoro-stats',
  authenticate,
  UserController.getPomodoroStats
);

module.exports = router;