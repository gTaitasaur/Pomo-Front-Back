// src/controllers/auth.controller.js
const UserModel = require('../models/user.model');
const TokenModel = require('../models/token.model');
const { query } = require('../config/db');
const {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} = require('../utils/auth.utils');

class AuthController {
  // Registro de usuario
  static async register(req, res) {
    try {
      const { username, email, password, telefono } = req.body;

      // Verificar si el email ya existe
      if (await UserModel.emailExists(email)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'El email ya está registrado',
            code: 'EMAIL_EXISTS'
          }
        });
      }

      // Verificar si el username ya existe
      if (await UserModel.usernameExists(username)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'El nombre de usuario ya está en uso',
            code: 'USERNAME_EXISTS'
          }
        });
      }

      // Hash de la contraseña
      const password_hash = await hashPassword(password);

      // Crear usuario
      const newUser = await UserModel.create({
        username,
        email,
        password_hash,
        telefono
      });

      // Crear transacción de bienvenida (50 monedas gratis)
      const bonusCoins = 50;
      await query(
        `INSERT INTO transactions 
         (user_id, transaction_type, coin_type, amount_free_coins, description)
         VALUES ($1, 'earn_free_coins', 'free', $2, 'Bonus de bienvenida por registro')`,
        [newUser.user_id, bonusCoins]
      );

      // Actualizar monedas del usuario
      await UserModel.updateCoins(newUser.user_id, bonusCoins, 0);

      res.status(201).json({
        success: true,
        data: {
          user: newUser,
          message: 'Usuario registrado exitosamente. ¡Has recibido 50 monedas de bienvenida!'
        }
      });

    } catch (error) {
      console.error('Error en registro:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Error al registrar usuario',
          code: 'REGISTER_ERROR'
        }
      });
    }
  }

  // Login de usuario
  static async login(req, res) {
    try {
      const { username, password } = req.body;

      // Buscar usuario por username o email
      const user = await UserModel.findByUsernameOrEmail(username);

      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Usuario o contraseña incorrectos',
            code: 'INVALID_CREDENTIALS'
          }
        });
      }

      // Verificar contraseña
      const isValidPassword = await verifyPassword(password, user.password_hash);

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Usuario o contraseña incorrectos',
            code: 'INVALID_CREDENTIALS'
          }
        });
      }

      // Actualizar último login
      await UserModel.updateLastLogin(user.user_id);

      // Generar tokens
      const accessToken = generateAccessToken(user.user_id);
      const refreshToken = generateRefreshToken(user.user_id);

      // Guardar refresh token en BD
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 días

      await TokenModel.create({
        token: refreshToken,
        userId: user.user_id,
        expiresAt,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip
      });

      // Preparar respuesta (sin password_hash)
      const { password_hash, ...userWithoutPassword } = user;

      res.json({
        success: true,
        data: {
          user: userWithoutPassword,
          access_token: accessToken,
          refresh_token: refreshToken,
          token_type: 'Bearer',
          expires_in: 900 // 15 minutos en segundos
        }
      });

    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Error al iniciar sesión',
          code: 'LOGIN_ERROR'
        }
      });
    }
  }

  // Verificar token actual
  static async verifyToken(req, res) {
    try {
      // El usuario ya viene del middleware authenticate
      const user = req.user;

      res.json({
        success: true,
        data: {
          user: user
        }
      });

    } catch (error) {
      console.error('Error al verificar token:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Error al verificar token',
          code: 'VERIFY_ERROR'
        }
      });
    }
  }

  // Refresh token
  static async refreshToken(req, res) {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Refresh token requerido',
            code: 'NO_REFRESH_TOKEN'
          }
        });
      }

      // Verificar refresh token
      const decoded = verifyRefreshToken(refresh_token);
      
      // Buscar token en BD
      const tokenData = await TokenModel.findValidToken(refresh_token);

      if (!tokenData) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Refresh token inválido',
            code: 'INVALID_REFRESH_TOKEN'
          }
        });
      }

      // Generar nuevo access token
      const newAccessToken = generateAccessToken(tokenData.user_id);

      res.json({
        success: true,
        data: {
          access_token: newAccessToken,
          token_type: 'Bearer',
          expires_in: 900
        }
      });

    } catch (error) {
      console.error('Error al refrescar token:', error);
      res.status(401).json({
        success: false,
        error: {
          message: 'Error al refrescar token',
          code: 'REFRESH_ERROR'
        }
      });
    }
  }

  // Logout
  static async logout(req, res) {
    try {
      const { refresh_token } = req.body;

      if (refresh_token) {
        // Revocar el refresh token específico
        await TokenModel.revokeToken(refresh_token);
      }

      res.json({
        success: true,
        data: {
          message: 'Sesión cerrada exitosamente'
        }
      });

    } catch (error) {
      console.error('Error en logout:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Error al cerrar sesión',
          code: 'LOGOUT_ERROR'
        }
      });
    }
  }

  // Logout de todos los dispositivos
  static async logoutAll(req, res) {
    try {
      const userId = req.user.user_id;

      // Revocar todos los refresh tokens del usuario
      await TokenModel.revokeAllUserTokens(userId);

      res.json({
        success: true,
        data: {
          message: 'Sesión cerrada en todos los dispositivos'
        }
      });

    } catch (error) {
      console.error('Error en logout all:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Error al cerrar sesiones',
          code: 'LOGOUT_ALL_ERROR'
        }
      });
    }
  }
}

module.exports = AuthController;