// src/services/transactionService.js
import { api } from './authService';

class TransactionService {
  // Crear transacción de Freemodoros ganados por Pomodoro
  static async createPomodoroTransaction(userId, amount, pomodoroMinutes) {
    try {
      const response = await api.post('/transactions/pomodoro', {
        user_id: userId,
        amount_free_coins: amount,
        pomodoro_minutes: pomodoroMinutes
      });

      return response.data;
    } catch (error) {
      if (error.success === false) {
        return error;
      }
      
      return {
        success: false,
        error: {
          message: 'Error al crear transacción',
          code: 'TRANSACTION_ERROR'
        }
      };
    }
  }

  // Obtener historial de transacciones del usuario
  static async getUserTransactions(userId, limit = 50) {
    try {
      const response = await api.get(`/transactions/user/${userId}`, {
        params: { limit }
      });

      return response.data;
    } catch (error) {
      if (error.success === false) {
        return error;
      }
      
      return {
        success: false,
        error: {
          message: 'Error al obtener transacciones',
          code: 'FETCH_ERROR'
        }
      };
    }
  }

  // Obtener balance actual del usuario
  static async getUserBalance(userId) {
    try {
      const response = await api.get(`/users/${userId}/balance`);

      return response.data;
    } catch (error) {
      if (error.success === false) {
        return error;
      }
      
      return {
        success: false,
        error: {
          message: 'Error al obtener balance',
          code: 'BALANCE_ERROR'
        }
      };
    }
  }

  // Obtener estadísticas de Pomodoros del usuario
  static async getPomodoroStats(userId) {
    try {
      const response = await api.get(`/users/${userId}/pomodoro-stats`);

      return response.data;
    } catch (error) {
      if (error.success === false) {
        return error;
      }
      
      return {
        success: false,
        error: {
          message: 'Error al obtener estadísticas',
          code: 'STATS_ERROR'
        }
      };
    }
  }

  // Comprar monedas (para implementar después)
  static async purchaseCoins(userId, packageId, paymentData) {
    try {
      const response = await api.post('/transactions/purchase-coins', {
        user_id: userId,
        package_id: packageId,
        payment_data: paymentData
      });

      return response.data;
    } catch (error) {
      if (error.success === false) {
        return error;
      }
      
      return {
        success: false,
        error: {
          message: 'Error al procesar compra',
          code: 'PURCHASE_ERROR'
        }
      };
    }
  }

  // Comprar premium (para implementar después)
  static async purchasePremium(userId, packageId, useCoins = true) {
    try {
      const response = await api.post('/transactions/purchase-premium', {
        user_id: userId,
        package_id: packageId,
        use_coins: useCoins
      });

      return response.data;
    } catch (error) {
      if (error.success === false) {
        return error;
      }
      
      return {
        success: false,
        error: {
          message: 'Error al comprar premium',
          code: 'PREMIUM_ERROR'
        }
      };
    }
  }

  // Desbloquear feature (para implementar después)
  static async unlockFeature(userId, featureId) {
    try {
      const response = await api.post('/transactions/unlock-feature', {
        user_id: userId,
        feature_id: featureId
      });

      return response.data;
    } catch (error) {
      if (error.success === false) {
        return error;
      }
      
      return {
        success: false,
        error: {
          message: 'Error al desbloquear característica',
          code: 'UNLOCK_ERROR'
        }
      };
    }
  }
}

export default TransactionService;