// src/app.js
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Crear aplicación Express
const app = express();

// Middlewares globales
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // URL de tu frontend Vite
  credentials: true, // Permitir cookies/credenciales
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json()); // Para parsear JSON
app.use(express.urlencoded({ extended: true })); // Para parsear formularios

// Middleware para logs de peticiones (útil para desarrollo)
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    message: 'API Pomodoro funcionando',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Ruta de health check
app.get('/health', async (req, res) => {
  const { testConnection } = require('./config/db');
  const dbStatus = await testConnection();
  
  res.status(dbStatus ? 200 : 503).json({
    status: dbStatus ? 'healthy' : 'unhealthy',
    database: dbStatus ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Importar rutas
const authRoutes = require('./routes/auth.routes');
// const userRoutes = require('./routes/user.routes');
// const pomodoroRoutes = require('./routes/pomodoro.routes');
// const featureRoutes = require('./routes/feature.routes');
// const transactionRoutes = require('./routes/transaction.routes');

// Usar las rutas
app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/pomodoros', pomodoroRoutes);
// app.use('/api/features', featureRoutes);
// app.use('/api/transactions', transactionRoutes);

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    message: `La ruta ${req.method} ${req.path} no existe`,
    timestamp: new Date().toISOString()
  });
});

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  
  // Si es un error de validación
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Error de validación',
      details: err.errors,
      timestamp: new Date().toISOString()
    });
  }
  
  // Si es un error de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token inválido',
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }
  
  // Error genérico
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;