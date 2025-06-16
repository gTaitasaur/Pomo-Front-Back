const UserModel = require('../models/user.model');
const { hashPassword, verifyPassword } = require('../utils/auth.utils');

class UserController {
  // Cambiar contraseña
  static async changePassword(req, res) {
    try {
      const userId = parseInt(req.params.userId);
      const { current_password, new_password } = req.body;

      // Verificar que el usuario existe
      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Usuario no encontrado',
            code: 'USER_NOT_FOUND'
          }
        });
      }

      // Verificar que el usuario autenticado es el propietario
      if (userId !== req.user.user_id) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'No tienes permiso para cambiar la contraseña de otro usuario',
            code: 'FORBIDDEN'
          }
        });
      }

      // Verificar contraseña actual
      const isValidPassword = await verifyPassword(current_password, user.password_hash);
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'La contraseña actual es incorrecta',
            code: 'INVALID_PASSWORD'
          }
        });
      }

      // Hash de la nueva contraseña
      const newPasswordHash = await hashPassword(new_password);

      // Actualizar contraseña
      await UserModel.updatePassword(userId, newPasswordHash);

      res.json({
        success: true,
        data: {
          message: 'Contraseña actualizada exitosamente'
        }
      });

    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Error al cambiar la contraseña',
          code: 'PASSWORD_CHANGE_ERROR',
          details: error.message
        }
      });
    }
  }
}

module.exports = UserController; 