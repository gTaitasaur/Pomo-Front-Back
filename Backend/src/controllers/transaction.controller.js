// src/controllers/transaction.controller.js
const TransactionModel = require('../models/transaction.model');
const UserModel = require('../models/user.model');

class TransactionController {
  // Crear transacción de Pomodoro completado
  static async createPomodoroTransaction(req, res) {
    try {
      const { user_id, amount_free_coins, pomodoro_minutes } = req.body;

      // Verificar que el usuario solo pueda crear transacciones para sí mismo
      if (user_id !== req.user.user_id) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'No tienes permiso para crear transacciones para otro usuario',
            code: 'FORBIDDEN'
          }
        });
      }

      // Crear transacción y actualizar balance
      const result = await TransactionModel.createPomodoroTransaction(
        user_id,
        amount_free_coins,
        pomodoro_minutes
      );

      res.status(201).json({
        success: true,
        data: {
          transaction: result.transaction,
          newBalance: result.newBalance
        }
      });

    } catch (error) {
      console.error('Error al crear transacción de pomodoro:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Error al crear transacción',
          code: 'TRANSACTION_ERROR'
        }
      });
    }
  }

  // Obtener transacciones del usuario
  static async getUserTransactions(req, res) {
    try {
      const userId = parseInt(req.params.userId);
      const { limit = 50, offset = 0 } = req.query;

      // Verificar permisos
      if (userId !== req.user.user_id) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'No tienes permiso para ver estas transacciones',
            code: 'FORBIDDEN'
          }
        });
      }

      const transactions = await TransactionModel.getUserTransactions(
        userId,
        parseInt(limit),
        parseInt(offset)
      );

      res.json({
        success: true,
        data: transactions
      });

    } catch (error) {
      console.error('Error al obtener transacciones:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Error al obtener transacciones',
          code: 'FETCH_ERROR'
        }
      });
    }
  }

  // Obtener todas las transacciones (admin - para implementar después)
  static async getAllTransactions(req, res) {
    try {
      const { limit = 50, offset = 0 } = req.query;

      // TODO: Verificar si es admin
      
      const transactions = await TransactionModel.getAll(
        parseInt(limit),
        parseInt(offset)
      );

      res.json({
        success: true,
        data: transactions
      });

    } catch (error) {
      console.error('Error al obtener todas las transacciones:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Error al obtener transacciones',
          code: 'FETCH_ERROR'
        }
      });
    }
  }

  // Comprar monedas (para implementar después con pasarela de pago)
  static async purchaseCoins(req, res) {
    try {
      const { user_id, package_id, payment_data } = req.body;

      // Verificar permisos
      if (user_id !== req.user.user_id) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'No tienes permiso para realizar esta compra',
            code: 'FORBIDDEN'
          }
        });
      }

      // TODO: Implementar lógica de pago
      // Por ahora solo retornamos un mensaje
      res.status(501).json({
        success: false,
        error: {
          message: 'Funcionalidad de compra aún no implementada',
          code: 'NOT_IMPLEMENTED'
        }
      });

    } catch (error) {
      console.error('Error al procesar compra:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Error al procesar compra',
          code: 'PURCHASE_ERROR'
        }
      });
    }
  }

  // Comprar premium con monedas
  static async purchasePremium(req, res) {
    try {
      const { user_id, package_id, use_coins = true } = req.body;

      // Verificar permisos
      if (user_id !== req.user.user_id) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'No tienes permiso para realizar esta compra',
            code: 'FORBIDDEN'
          }
        });
      }

      // TODO: Implementar lógica de compra premium
      res.status(501).json({
        success: false,
        error: {
          message: 'Funcionalidad de premium aún no implementada',
          code: 'NOT_IMPLEMENTED'
        }
      });

    } catch (error) {
      console.error('Error al comprar premium:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Error al comprar premium',
          code: 'PREMIUM_ERROR'
        }
      });
    }
  }

  // Desbloquear característica
  static async unlockFeature(req, res) {
    try {
      const { user_id, feature_id } = req.body;

      // Verificar permisos
      if (user_id !== req.user.user_id) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'No tienes permiso para desbloquear características para otro usuario',
            code: 'FORBIDDEN'
          }
        });
      }

      // TODO: Implementar lógica de desbloqueo de características
      res.status(501).json({
        success: false,
        error: {
          message: 'Funcionalidad de características aún no implementada',
          code: 'NOT_IMPLEMENTED'
        }
      });

    } catch (error) {
      console.error('Error al desbloquear característica:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Error al desbloquear característica',
          code: 'UNLOCK_ERROR'
        }
      });
    }
  }

  // Obtener estadísticas de transacciones del usuario
  static async getUserTransactionStats(req, res) {
    try {
      const userId = parseInt(req.params.userId);

      // Verificar permisos
      if (userId !== req.user.user_id) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'No tienes permiso para ver estas estadísticas',
            code: 'FORBIDDEN'
          }
        });
      }

      const stats = await TransactionModel.getUserStats(userId);

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Error al obtener estadísticas',
          code: 'STATS_ERROR'
        }
      });
    }
  }
}

module.exports = TransactionController;