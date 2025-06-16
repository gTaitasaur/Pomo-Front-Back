import axios from 'axios';
import toast from 'react-hot-toast';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Interceptor para requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para responses
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (!error.response) {
      toast.error('Error de conexión con el servidor');
      return Promise.reject({
        success: false,
        error: {
          message: 'No se pudo conectar con el servidor',
          code: 'NETWORK_ERROR'
        }
      });
    }

    if (error.response.status === 401 && 
        !originalRequest._retry &&
        !originalRequest.url.includes('/auth/login') &&
        !originalRequest.url.includes('/auth/refresh')) {
      
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');

      if (!refreshToken) {
        // No hay refresh token, limpiar y redirigir al login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/';
        return Promise.reject(error);
      }

      try {
        const response = await apiClient.post('/auth/refresh', {
          refresh_token: refreshToken
        });

        const { access_token } = response.data.data;
        localStorage.setItem('access_token', access_token);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        
        processQueue(null, access_token);
        
        // Reintentar la petición original
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return apiClient(originalRequest);

      } catch (refreshError) {
        processQueue(refreshError, null);
        
        // Refresh falló, limpiar todo
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        toast.error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        
        // Redirigir al home después de un delay
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response.status >= 500) {
      toast.error('Error del servidor. Por favor, intenta más tarde.');
    }

    return Promise.reject({
      success: false,
      error: error.response.data.error || {
        message: 'Error desconocido',
        code: 'UNKNOWN_ERROR'
      }
    });
  }
);

export default apiClient;