const express = require('express');
const { body } = require('express-validator');
const UserController = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// Validaciones para cambio de contraseña
const changePasswordValidation = [
  body('current_password')
    .notEmpty()
    .withMessage('La contraseña actual es requerida'),
  
  body('new_password')
    .isLength({ min: 6 })
    .withMessage('La nueva contraseña debe tener al menos 6 caracteres')
];

// RUTAS PROTEGIDAS
router.use(authenticate);

// Cambiar contraseña
router.post(
  '/:userId/change-password',
  changePasswordValidation,
  UserController.changePassword
);

module.exports = router;