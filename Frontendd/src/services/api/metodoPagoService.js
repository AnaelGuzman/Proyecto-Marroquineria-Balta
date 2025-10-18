import { API_BASE_URL } from './config';

export const metodoPagoService = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/metodos-pago`);
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${text}`);
    }
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error('Respuesta inválida del servidor: ' + text);
    }
  },
  
  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/metodos-pago/${id}`);
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${text}`);
    }
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error('Respuesta inválida del servidor: ' + text);
    }
  },
  
  create: async (data) => {
    const response = await fetch(`${API_BASE_URL}/metodos-pago`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${text}`);
    }
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error('Respuesta inválida del servidor: ' + text);
    }
  },
  
  update: async (id, data) => {
    const response = await fetch(`${API_BASE_URL}/metodos-pago/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${text}`);
    }
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error('Respuesta inválida del servidor: ' + text);
    }
  },
  
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/metodos-pago/${id}`, { 
      method: 'DELETE' 
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${text}`);
    }
    return true;
  },

  verificarEnUso: async (id) => {
    const response = await fetch(`${API_BASE_URL}/metodos-pago/${id}/en-uso`);
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${text}`);
    }
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error('Respuesta inválida del servidor: ' + text);
    }
  }
};