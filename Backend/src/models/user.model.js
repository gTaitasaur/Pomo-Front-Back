// src/models/user.model.js
const { query } = require('../config/db');

class UserModel {
  // Buscar usuario por ID
  static async findById(userId) {
    const sql = `
      SELECT user_id, username, email, telefono, imagen_perfil, 
             provider, provider_id, created_at, updated_at,
             premium, premium_expiration, free_coins, paid_coins,
             lifetime_session, last_login, is_active
      FROM usuarios 
      WHERE user_id = $1 AND is_active = true
    `;
    const result = await query(sql, [userId]);
    return result.rows[0];
  }

  // Buscar usuario por email
  static async findByEmail(email) {
    const sql = `
      SELECT * FROM usuarios 
      WHERE LOWER(email) = LOWER($1) AND is_active = true
    `;
    const result = await query(sql, [email]);
    return result.rows[0];
  }

  // En user.model.js
  static async findByIdWithPassword(userId) {
    const result = await query(
      'SELECT user_id, username, email, password_hash, telefono, imagen_perfil FROM usuarios WHERE user_id = $1', 
      [userId]
    );
    return result.rows[0];
  }

  // Buscar usuario por username
  static async findByUsername(username) {
    const sql = `
      SELECT * FROM usuarios 
      WHERE LOWER(username) = LOWER($1) AND is_active = true
    `;
    const result = await query(sql, [username]);
    return result.rows[0];
  }

  // Buscar por username o email (para login)
  static async findByUsernameOrEmail(identifier) {
    const sql = `
      SELECT * FROM usuarios 
      WHERE (LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)) 
      AND is_active = true
    `;
    const result = await query(sql, [identifier]);
    return result.rows[0];
  }

  // Crear nuevo usuario
  static async create(userData) {
    const {
      username,
      email,
      password_hash,
      telefono = null,
      imagen_perfil = null,
      provider = 'email',
      provider_id = null
    } = userData;

    const sql = `
      INSERT INTO usuarios (
        username, email, password_hash, telefono, imagen_perfil,
        provider, provider_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING user_id, username, email, telefono, imagen_perfil,
                provider, created_at, premium, free_coins, paid_coins
    `;

    const values = [
      username,
      email.toLowerCase(),
      password_hash,
      telefono,
      imagen_perfil || `https://ui-avatars.com/api/?name=${username}&background=random`,
      provider,
      provider_id
    ];

    const result = await query(sql, values);
    return result.rows[0];
  }

  // Actualizar último login
  static async updateLastLogin(userId) {
    const sql = `
      UPDATE usuarios 
      SET last_login = CURRENT_TIMESTAMP 
      WHERE user_id = $1
      RETURNING last_login
    `;
    const result = await query(sql, [userId]);
    return result.rows[0];
  }

  // Actualizar monedas del usuario
  static async updateCoins(userId, freeCoins = null, paidCoins = null) {
    let sql = 'UPDATE usuarios SET ';
    const values = [];
    let paramCount = 1;

    if (freeCoins !== null) {
      sql += `free_coins = $${paramCount}`;
      values.push(freeCoins);
      paramCount++;
    }

    if (paidCoins !== null) {
      if (freeCoins !== null) sql += ', ';
      sql += `paid_coins = $${paramCount}`;
      values.push(paidCoins);
      paramCount++;
    }

    sql += ` WHERE user_id = $${paramCount} RETURNING free_coins, paid_coins`;
    values.push(userId);

    const result = await query(sql, values);
    return result.rows[0];
  }

  // Actualizar información del usuario
  static async update(userId, updates) {
    const allowedUpdates = [
      'username', 'email', 'telefono', 'imagen_perfil',
      'premium', 'premium_expiration'
    ];

    const updateFields = [];
    const values = [];
    let paramCount = 1;

    // Construir query dinámicamente
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key) && updates[key] !== undefined) {
        updateFields.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    if (updateFields.length === 0) {
      throw new Error('No hay campos válidos para actualizar');
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    
    const sql = `
      UPDATE usuarios 
      SET ${updateFields.join(', ')}
      WHERE user_id = $${paramCount}
      RETURNING *
    `;
    
    values.push(userId);
    const result = await query(sql, values);
    return result.rows[0];
  }

  // Verificar si existe usuario con email
  static async emailExists(email) {
    const sql = 'SELECT 1 FROM usuarios WHERE LOWER(email) = LOWER($1)';
    const result = await query(sql, [email]);
    return result.rows.length > 0;
  }

  // Verificar si existe usuario con username
  static async usernameExists(username) {
    const sql = 'SELECT 1 FROM usuarios WHERE LOWER(username) = LOWER($1)';
    const result = await query(sql, [username]);
    return result.rows.length > 0;
  }
}

module.exports = UserModel;