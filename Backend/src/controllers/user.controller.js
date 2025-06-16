const UserModel = require('../models/user.model');
const TransactionModel = require('../models/transaction.model');
const { query } = require('../config/db');
const { hashPassword, verifyPassword } = require('../utils/auth.utils');

class UserController {
  // Obtener perfil del usuario actual
  static async getProfile(req, res) {
    try {
      const userId = req.user.user_id;
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

      // No enviar password_hash
      const { password_hash, ...userWithoutPassword } = user;

      res.json({
        success: true,
        data: userWithoutPassword
      });

    } catch (error) {
      console.error('Error al obtener perfil:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Error al obtener perfil',
          code: 'PROFILE_ERROR'
        }
      });
    }
  }

  // Actualizar perfil
  static async updateProfile(req, res) {
    try {
      const userId = req.user.user_id;
      const { username, email, telefono, imagen_perfil } = req.body;

      if (email && email !== req.user.email) {
        const existingUser = await UserModel.findByEmail(email);
        if (existingUser && existingUser.user_id !== userId) {
          return res.status(400).json({
            success: false,
            error: {
              message: 'El email ya está en uso',
              code: 'EMAIL_EXISTS'
            }
          });
        }
      }

      if (username && username !== req.user.username) {
        const existingUser = await UserModel.findByUsername(username);
        if (existingUser && existingUser.user_id !== userId) {
          return res.status(400).json({
            success: false,
            error: {
              message: 'El nombre de usuario ya está en uso',
              code: 'USERNAME_EXISTS'
            }
          });
        }
      }

      const updatedUser = await UserModel.update(userId, {
        username,
        email,
        telefono,
        imagen_perfil
      });

      const { password_hash, ...userWithoutPassword } = updatedUser;

      res.json({
        success: true,
        data: {
          user: userWithoutPassword,
          message: 'Perfil actualizado exitosamente'
        }
      });

    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Error al actualizar perfil',
          code: 'UPDATE_ERROR'
        }
      });
    }
  }

  // Cambiar contraseña
  static async changePassword(req, res) {
    try {
      const userId = req.user.user_id;
      const { current_password, new_password } = req.body;
  
      if (!current_password || !new_password) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Todos los campos son obligatorios',
            code: 'MISSING_FIELDS'
          }
        });
      }
  
      // Obtener usuario con el password_hash
      const user = await UserModel.findByIdWithPassword(userId);
  
      if (!user || !user.password_hash) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Usuario no encontrado o sin contraseña registrada',
            code: 'USER_NOT_FOUND'
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
    await query(
      'UPDATE usuarios SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
      [newPasswordHash, userId]
    );

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
        message: 'Error al cambiar contraseña',
        code: 'PASSWORD_CHANGE_ERROR'
      }
    });
  }
}

  // Obtener balance del usuario
  static async getBalance(req, res) {
    try {
      const userId = parseInt(req.params.userId);

      // Verificar que el usuario solo pueda ver su propio balance
      if (userId !== req.user.user_id) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'No tienes permiso para ver este balance',
            code: 'FORBIDDEN'
          }
        });
      }

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

      res.json({
        success: true,
        data: {
          free_coins: user.free_coins,
          paid_coins: user.paid_coins,
          is_premium: user.premium,
          premium_expiration: user.premium_expiration
        }
      });

    } catch (error) {
      console.error('Error al obtener balance:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Error al obtener balance',
          code: 'BALANCE_ERROR'
        }
      });
    }
  }

  // Obtener estadísticas de Pomodoros
  static async getPomodoroStats(req, res) {
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

      // Obtener estadísticas de sesiones
      const sessionStatsSql = `
        SELECT 
          COUNT(*) as total_sessions,
          COUNT(*) FILTER (WHERE completed = true) as completed_sessions,
          COUNT(*) FILTER (WHERE pomo_type = 'work') as work_sessions,
          COUNT(*) FILTER (WHERE pomo_type = 'rest') as rest_sessions,
          COUNT(*) FILTER (WHERE pomo_type = 'long_rest') as long_rest_sessions,
          SUM(duration_minutes) FILTER (WHERE completed = true) as total_minutes,
          SUM(coins_earned) as total_coins_earned,
          AVG(duration_minutes) FILTER (WHERE completed = true) as avg_session_length
        FROM pomo_hist 
        WHERE user_id = $1
      `;

      const sessionResult = await query(sessionStatsSql, [userId]);
      const sessionStats = sessionResult.rows[0];

      // Obtener estadísticas por día (últimos 7 días)
      const dailyStatsSql = `
        SELECT 
          DATE(start_time) as date,
          COUNT(*) as sessions_count,
          SUM(duration_minutes) as total_minutes
        FROM pomo_hist 
        WHERE user_id = $1 
          AND completed = true
          AND start_time >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY DATE(start_time)
        ORDER BY date DESC
      `;

      const dailyResult = await query(dailyStatsSql, [userId]);
      const dailyStats = {};
      
      // Inicializar últimos 7 días con 0
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        dailyStats[dateKey] = 0;
      }

      dailyResult.rows.forEach(row => {
        const dateKey = row.date.toISOString().split('T')[0];
        dailyStats[dateKey] = parseInt(row.sessions_count);
      });

      const completionRate = sessionStats.total_sessions > 0 
        ? ((parseInt(sessionStats.completed_sessions) / parseInt(sessionStats.total_sessions)) * 100).toFixed(2)
        : 0;

      res.json({
        success: true,
        data: {
          totalPomodoros: parseInt(sessionStats.completed_sessions),
          totalFreemodoros: parseInt(sessionStats.total_coins_earned) || 0,
          dailyStats,
          avgPomodorosPerDay: (parseInt(sessionStats.completed_sessions) / 7).toFixed(2),
          totalMinutes: parseInt(sessionStats.total_minutes) || 0,
          completionRate: parseFloat(completionRate),
          workSessions: parseInt(sessionStats.work_sessions),
          restSessions: parseInt(sessionStats.rest_sessions),
          longRestSessions: parseInt(sessionStats.long_rest_sessions)
        }
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

module.exports = UserController;