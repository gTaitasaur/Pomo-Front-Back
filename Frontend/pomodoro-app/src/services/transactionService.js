import { api } from './authService';

class TransactionService {
  // Transacción de Freemodoros ganados por Pomodoro
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

  // Historial de transacciones del usuario
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

  // Balance actual del usuario
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

  // Estadísticas de Pomodoros del usuario
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
}

export default TransactionService;