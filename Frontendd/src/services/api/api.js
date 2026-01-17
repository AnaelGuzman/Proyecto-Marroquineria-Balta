import { API_BASE_URL } from './config';

export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 401 || response.status === 403) {
    console.warn('No autorizado');
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('auth:logout'));
    if (window.location.hash !== '#/login') {
      window.location.hash = '#/login';
    }
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Error en la petición');
  }

  return response.status !== 204 ? response.json() : null;
};
