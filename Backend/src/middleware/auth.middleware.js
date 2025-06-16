const { verifyAccessToken, extractTokenFromHeader } = require('../utils/auth.utils');
const UserModel = require('../models/user.model');

// Middleware para verificar autenticación
const authenticate = async (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Token no proporcionado',
          code: 'NO_TOKEN'
        }
      });
    }

    const decoded = verifyAccessToken(token);
    const user = await UserModel.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Usuario no encontrado',
          code: 'USER_NOT_FOUND'
        }
      });
    }

    // Adjunta usuario a la request
    const { password_hash, ...userWithoutPassword } = user;
    req.user = userWithoutPassword;
    
    next();
  } catch (error) {
    console.error('Error de autenticación:', error.message);
    
    return res.status(401).json({
      success: false,
      error: {
        message: error.message || 'Token inválido',
        code: 'INVALID_TOKEN'
      }
    });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (token) {
      const decoded = verifyAccessToken(token);
      const user = await UserModel.findById(decoded.userId);
      
      if (user) {
        const { password_hash, ...userWithoutPassword } = user;
        req.user = userWithoutPassword;
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};

// Middleware para verificar si es premium
const requirePremium = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Autenticación requerida',
        code: 'AUTH_REQUIRED'
      }
    });
  }

  if (!req.user.premium || 
      (req.user.premium_expiration && new Date(req.user.premium_expiration) < new Date())) {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Se requiere cuenta premium',
        code: 'PREMIUM_REQUIRED'
      }
    });
  }

  next();
};

// Middleware para verificar propiedad de recursos
const checkOwnership = (resourceUserIdField = 'user_id') => {
  return (req, res, next) => {
    const resourceUserId = req.body[resourceUserIdField] || 
                          req.params[resourceUserIdField] ||
                          req.query[resourceUserIdField];
    
    if (!resourceUserId) {
      return next();
    }

    if (parseInt(resourceUserId) !== req.user.user_id) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'No tienes permiso para acceder a este recurso',
          code: 'FORBIDDEN'
        }
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  optionalAuth,
  requirePremium,
  checkOwnership
};