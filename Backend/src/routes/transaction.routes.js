// src/routes/transaction.routes.js
const express = require('express');
const { body, param, query } = require('express-validator');
const TransactionController = require('../controllers/transaction.controller');
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

// Validaciones para crear transacción de Pomodoro
const pomodoroTransactionValidation = [
  body('user_id')
    .isInt({ min: 1 })
    .withMessage('ID de usuario inválido'),
  
  body('amount_free_coins')
    .isInt({ min: 1 })
    .withMessage('La cantidad de monedas debe ser mayor a 0'),
  
  body('pomodoro_minutes')
    .isInt({ min: 1, max: 120 })
    .withMessage('Los minutos del pomodoro deben estar entre 1 y 120')
];

// Validaciones para parámetros de consulta
const paginationValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe estar entre 1 y 100'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El offset debe ser mayor o igual a 0')
];

// Validación de userId en params
const userIdParamValidation = [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('ID de usuario inválido')
];

// TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN

// Crear transacción de Pomodoro completado
router.post(
  '/pomodoro',
  authenticate,
  pomodoroTransactionValidation,
  handleValidationErrors,
  TransactionController.createPomodoroTransaction
);

// Obtener transacciones de un usuario
router.get(
  '/user/:userId',
  authenticate,
  userIdParamValidation,
  paginationValidation,
  handleValidationErrors,
  TransactionController.getUserTransactions
);

// Obtener estadísticas de transacciones del usuario
router.get(
  '/user/:userId/stats',
  authenticate,
  userIdParamValidation,
  handleValidationErrors,
  TransactionController.getUserTransactionStats
);

// Comprar monedas (por implementar)
router.post(
  '/purchase-coins',
  authenticate,
  TransactionController.purchaseCoins
);

// Comprar premium (por implementar)
router.post(
  '/purchase-premium',
  authenticate,
  TransactionController.purchasePremium
);

// Desbloquear característica (por implementar)
router.post(
  '/unlock-feature',
  authenticate,
  TransactionController.unlockFeature
);

// Obtener todas las transacciones (admin - por implementar)
router.get(
  '/',
  authenticate,
  paginationValidation,
  handleValidationErrors,
  TransactionController.getAllTransactions
);

module.exports = router;