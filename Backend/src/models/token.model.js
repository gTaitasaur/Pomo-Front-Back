const { query } = require('../config/db');

class TokenModel {
  static async create(tokenData) {
    const {
      token,
      userId,
      expiresAt,
      userAgent = null,
      ipAddress = null
    } = tokenData;

    const sql = `
      INSERT INTO refresh_tokens (token, user_id, expires_at, user_agent, ip_address)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING token_id, token, user_id, issued_at, expires_at
    `;

    const values = [token, userId, expiresAt, userAgent, ipAddress];
    const result = await query(sql, values);
    return result.rows[0];
  }

  static async findValidToken(token) {
    const sql = `
      SELECT rt.*, u.username, u.email, u.is_active
      FROM refresh_tokens rt
      JOIN usuarios u ON rt.user_id = u.user_id
      WHERE rt.token = $1 
        AND rt.is_revoked = false 
        AND rt.expires_at > CURRENT_TIMESTAMP
        AND u.is_active = true
    `;
    
    const result = await query(sql, [token]);
    return result.rows[0];
  }

  static async revokeToken(token) {
    const sql = `
      UPDATE refresh_tokens 
      SET is_revoked = true 
      WHERE token = $1
      RETURNING token_id
    `;
    
    const result = await query(sql, [token]);
    return result.rows[0];
  }

  static async revokeAllUserTokens(userId) {
    const sql = `
      UPDATE refresh_tokens 
      SET is_revoked = true 
      WHERE user_id = $1 AND is_revoked = false
      RETURNING token_id
    `;
    
    const result = await query(sql, [userId]);
    return result.rows;
  }

  static async cleanExpiredTokens() {
    const sql = `
      DELETE FROM refresh_tokens 
      WHERE expires_at < CURRENT_TIMESTAMP 
        OR (is_revoked = true AND issued_at < CURRENT_TIMESTAMP - INTERVAL '7 days')
      RETURNING token_id
    `;
    
    const result = await query(sql);
    return result.rows.length;
  }

  static async countActiveTokens(userId) {
    const sql = `
      SELECT COUNT(*) as count
      FROM refresh_tokens 
      WHERE user_id = $1 
        AND is_revoked = false 
        AND expires_at > CURRENT_TIMESTAMP
    `;
    
    const result = await query(sql, [userId]);
    return parseInt(result.rows[0].count);
  }
}

module.exports = TokenModel;