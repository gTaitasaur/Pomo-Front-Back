// server.js
const app = require('./src/app');
const { testConnection } = require('./src/config/db');

// Puerto del servidor
const PORT = process.env.PORT || 3001;

// Función para iniciar el servidor
const startServer = async () => {
  try {
    // Verificar conexión a la base de datos
    console.log('🔌 Conectando a la base de datos...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      throw new Error('No se pudo conectar a la base de datos');
    }
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log('🚀 Servidor corriendo en puerto', PORT);
      console.log(`📍 URL: http://localhost:${PORT}`);
      console.log('🌟 Ambiente:', process.env.NODE_ENV || 'development');
      console.log('✅ Servidor listo para recibir peticiones');
    });
    
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error.message);
    process.exit(1);
  }
};

// Manejo de señales para cerrar correctamente
process.on('SIGTERM', () => {
  console.log('📴 SIGTERM recibido. Cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📴 SIGINT recibido. Cerrando servidor...');
  process.exit(0);
});

// Iniciar el servidor
startServer();