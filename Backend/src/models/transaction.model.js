// src/models/transaction.model.js
const { query, getClient } = require('../config/db');

class TransactionModel {
  // Crear transacción (con actualización automática de monedas)
  static async create(transactionData) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');

      const {
        user_id,
        transaction_type,
        coin_type = null,
        amount_free_coins = 0,
        amount_paid_coins = 0,
        money_paid = 0,
        related_id = null,
        related_type = null,
        description
      } = transactionData;

      // Insertar transacción
      const insertSql = `
        INSERT INTO transactions (
          user_id, transaction_type, coin_type, 
          amount_free_coins, amount_paid_coins, money_paid,
          related_id, related_type, description
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const values = [
        user_id,
        transaction_type,
        coin_type,
        amount_free_coins,
        amount_paid_coins,
        money_paid,
        related_id,
        related_type,
        description
      ];

      const transactionResult = await client.query(insertSql, values);
      const transaction = transactionResult.rows[0];

      // Actualizar monedas del usuario según el tipo de transacción
      let updateCoinsSql = '';
      let coinValues = [];

      if (transaction_type === 'earn_free_coins' || transaction_type === 'buy_paid_coins') {
        // Sumar monedas
        updateCoinsSql = `
          UPDATE usuarios 
          SET free_coins = free_coins + $1,
              paid_coins = paid_coins + $2
          WHERE user_id = $3
          RETURNING free_coins, paid_coins
        `;
        coinValues = [amount_free_coins, amount_paid_coins, user_id];
      } else if (transaction_type === 'spend_free_coins' || transaction_type === 'spend_paid_coins' || transaction_type === 'premium_purchase') {
        // Restar monedas
        updateCoinsSql = `
          UPDATE usuarios 
          SET free_coins = GREATEST(0, free_coins - $1),
              paid_coins = GREATEST(0, paid_coins - $2)
          WHERE user_id = $3
          RETURNING free_coins, paid_coins
        `;
        coinValues = [amount_free_coins, amount_paid_coins, user_id];
      }

      let newBalance = { free_coins: 0, paid_coins: 0 };
      if (updateCoinsSql) {
        const balanceResult = await client.query(updateCoinsSql, coinValues);
        newBalance = balanceResult.rows[0];
      }

      await client.query('COMMIT');

      return {
        transaction,
        newBalance
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Crear transacción de Pomodoro específicamente
  static async createPomodoroTransaction(userId, freeCoins, pomodoroMinutes) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');

      // Crear sesión de pomodoro
      const sessionSql = `
        INSERT INTO pomo_hist (
          user_id, duration_minutes, pomo_type, 
          start_time, end_time, completed, coins_earned
        ) VALUES ($1, $2, 'work', $3, $4, true, $5)
        RETURNING session_id
      `;

      const now = new Date();
      const startTime = new Date(now.getTime() - (pomodoroMinutes * 60 * 1000));
      
      const sessionResult = await client.query(sessionSql, [
        userId,
        pomodoroMinutes,
        startTime,
        now,
        freeCoins
      ]);

      const sessionId = sessionResult.rows[0].session_id;

      // Crear transacción
      const transactionData = {
        user_id: userId,
        transaction_type: 'earn_free_coins',
        coin_type: 'free',
        amount_free_coins: freeCoins,
        amount_paid_coins: 0,
        description: `Pomodoro de ${pomodoroMinutes} minutos completado`,
        related_type: 'pomodoro_session',
        related_id: sessionId
      };

      const result = await this.create(transactionData);

      // Actualizar lifetime_session del usuario
      await client.query(
        `UPDATE usuarios 
         SET lifetime_session = lifetime_session + $1 
         WHERE user_id = $2`,
        [pomodoroMinutes, userId]
      );

      await client.query('COMMIT');

      return result;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Obtener transacciones de un usuario
  static async getUserTransactions(userId, limit = 50, offset = 0) {
    const sql = `
      SELECT * FROM transactions 
      WHERE user_id = $1 
      ORDER BY transaction_date DESC 
      LIMIT $2 OFFSET $3
    `;

    const result = await query(sql, [userId, limit, offset]);
    return result.rows;
  }

  // Obtener todas las transacciones
  static async getAll(limit = 50, offset = 0) {
    const sql = `
      SELECT t.*, u.username, u.email 
      FROM transactions t
      JOIN usuarios u ON t.user_id = u.user_id
      ORDER BY t.transaction_date DESC 
      LIMIT $1 OFFSET $2
    `;

    const result = await query(sql, [limit, offset]);
    return result.rows;
  }

  // Obtener transacción por ID
  static async findById(transactionId) {
    const sql = `
      SELECT * FROM transactions 
      WHERE transaction_id = $1
    `;

    const result = await query(sql, [transactionId]);
    return result.rows[0];
  }

  // Obtener estadísticas de transacciones
  static async getUserStats(userId) {
    const sql = `
      SELECT 
        COUNT(*) as total_transactions,
        SUM(amount_free_coins) FILTER (WHERE transaction_type = 'earn_free_coins') as total_earned_free,
        SUM(amount_paid_coins) FILTER (WHERE transaction_type = 'buy_paid_coins') as total_bought_paid,
        SUM(amount_free_coins) FILTER (WHERE transaction_type = 'spend_free_coins') as total_spent_free,
        SUM(amount_paid_coins) FILTER (WHERE transaction_type = 'spend_paid_coins') as total_spent_paid,
        SUM(money_paid) as total_money_spent
      FROM transactions 
      WHERE user_id = $1
    `;

    const result = await query(sql, [userId]);
    return result.rows[0];
  }
}

module.exports = TransactionModel;