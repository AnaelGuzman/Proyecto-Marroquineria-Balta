// src/services/api/authService.js

const API_BASE_URL = 'http://localhost:8080/api';

const authService = {
  // Iniciar sesión
  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al iniciar sesión');
    }
    
    const data = await response.json();
    
    // Guardar token si viene del backend
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    
    return data;
  },

  // Registrar nuevo usuario
  registro: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/registro`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al registrar usuario');
    }
    
    const data = await response.json();
    
    // Guardar token si viene del backend
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    
    return data;
  },

  // Verificar si un correo ya existe
  verificarCorreo: async (correo) => {
    const response = await fetch(`${API_BASE_URL}/auth/verificar-correo?correo=${encodeURIComponent(correo)}`);
    
    if (!response.ok) {
      throw new Error('Error al verificar correo');
    }
    
    return await response.json();
  },

  // Verificar si un RUT ya existe
  verificarRut: async (rut) => {
    const response = await fetch(`${API_BASE_URL}/auth/verificar-rut?rut=${encodeURIComponent(rut)}`);
    
    if (!response.ok) {
      throw new Error('Error al verificar RUT');
    }
    
    return await response.json();
  },

  // Cambiar contraseña
  cambiarPassword: async (data) => {
    const response = await fetch(`${API_BASE_URL}/auth/cambiar-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al cambiar contraseña');
    }
    
    return await response.json();
  },

  // Obtener token JWT
  getToken: () => {
    return localStorage.getItem('token');
  },

  // Validar si el token es válido (no expirado)
  isTokenValid: () => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    try {
      // Decodificar el payload del JWT
      const payload = JSON.parse(atob(token.split('.')[1]));
      // Verificar si no ha expirado
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  },

  // Cerrar sesión
  logout: () => {
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
  },

  // Obtener usuario actual del localStorage
  getUsuarioActual: () => {
    const usuario = localStorage.getItem('usuario');
    return usuario ? JSON.parse(usuario) : null;
  },

  // Verificar si el usuario está autenticado
  estaAutenticado: () => {
    return localStorage.getItem('usuario') !== null;
  }
};

export default authService;