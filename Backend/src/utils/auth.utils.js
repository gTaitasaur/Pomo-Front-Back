// src/utils/auth.utils.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Configuración
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_EXPIRE = process.env.JWT_EXPIRE || '15m';
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '30d';
const SALT_ROUNDS = 10;

// Hash de contraseña
const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

// Verificar contraseña
const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// Generar Access Token
const generateAccessToken = (userId) => {
  const payload = {
    userId,
    type: 'access'
  };
  
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRE
  });
};

// Generar Refresh Token
const generateRefreshToken = (userId) => {
  const payload = {
    userId,
    type: 'refresh'
  };
  
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRE
  });
};

// Verificar Access Token
const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'access') {
      throw new Error('Token inválido');
    }
    return decoded;
  } catch (error) {
    throw new Error('Token inválido o expirado');
  }
};

// Verificar Refresh Token
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    if (decoded.type !== 'refresh') {
      throw new Error('Token inválido');
    }
    return decoded;
  } catch (error) {
    throw new Error('Refresh token inválido o expirado');
  }
};

// Extraer token del header Authorization
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};

module.exports = {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  extractTokenFromHeader
};