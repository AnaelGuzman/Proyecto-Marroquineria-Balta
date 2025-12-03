import { API_BASE_URL } from './config';

const handleJsonResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();
  let payload = null;

  if (text) {
    if (contentType.includes('application/json')) {
      try {
        payload = JSON.parse(text);
      } catch (error) {
        console.warn('No se pudo parsear JSON, usando texto plano.', error);
        payload = text;
      }
    } else {
      payload = text;
    }
  }

  if (!response.ok) {
    const message = typeof payload === 'string'
      ? payload
      : payload?.message || payload?.error || response.statusText;
    throw new Error(message || 'Error al procesar la solicitud');
  }

  if (!text) {
    return null;
  }

  return payload;
};

const jsonHeaders = { 'Content-Type': 'application/json' };

export const agendamientoService = {
  getAll: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/agendamientos`);
      const data = await handleJsonResponse(response);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error al obtener agendamientos:', error);
      return [];
    }
  },

  create: (payload) =>
    fetch(`${API_BASE_URL}/agendamientos`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(payload)
    }).then(handleJsonResponse),

  update: (id, payload) =>
    fetch(`${API_BASE_URL}/agendamientos/${id}`, {
      method: 'PUT',
      headers: jsonHeaders,
      body: JSON.stringify(payload)
    }).then(handleJsonResponse),

  remove: (id) =>
    fetch(`${API_BASE_URL}/agendamientos/${id}`, {
      method: 'DELETE'
    }).then(handleJsonResponse)
};
