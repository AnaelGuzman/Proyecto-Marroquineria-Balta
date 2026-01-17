import { apiFetch } from './api';

const decodeToken = (token) => {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    const jsonPayload = atob(padded);
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

const isTokenExpired = (token, skewSeconds = 30) => {
  const payload = decodeToken(token);
  if (!payload || typeof payload.exp !== 'number') return false;
  const now = Math.floor(Date.now() / 1000);
  return now >= payload.exp - skewSeconds;
};

const authService = {

  login: async (credentials) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });

    if (data.token) {
      localStorage.setItem('token', data.token);
    }

    if (data.usuario) {
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
    }

    return data;
  },

  registro: async (userData) => {
    const data = await apiFetch('/auth/registro', {
      method: 'POST',
      body: JSON.stringify(userData)
    });

    if (data.token) {
      localStorage.setItem('token', data.token);
    }

    if (data.usuario) {
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
    }

    return data;
  },

  verificarCorreo: (correo) =>
    apiFetch(`/auth/verificar-correo?correo=${encodeURIComponent(correo)}`),

  verificarRut: (rut) =>
    apiFetch(`/auth/verificar-rut?rut=${encodeURIComponent(rut)}`),

  cambiarPassword: (data) =>
    apiFetch('/auth/cambiar-password', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getToken: () => localStorage.getItem('token'),

  logout: () => {
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
  },

  getUsuarioActual: () => {
    const usuario = localStorage.getItem('usuario');
    return usuario ? JSON.parse(usuario) : null;
  },

  estaAutenticado: () => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    return !isTokenExpired(token);
  },

  isTokenExpired
};

export default authService;
