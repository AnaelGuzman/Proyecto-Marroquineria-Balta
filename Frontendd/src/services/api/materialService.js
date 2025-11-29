
import { API_BASE_URL } from './config';

const handleResponse = async (response) => {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Error ${response.status}: ${response.statusText}`);
  }
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

export const materialService = {
  getAll: () => 
    fetch(`${API_BASE_URL}/materiales`)
      .then(handleResponse)
      .catch(err => {
        console.error('Error en getAll materiales:', err);
        return [];
      }),
  
  getById: (id) => 
    fetch(`${API_BASE_URL}/materiales/${id}`).then(handleResponse),
  
  create: (data) => 
    fetch(`${API_BASE_URL}/materiales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse),
  
  update: (id, data) => 
    fetch(`${API_BASE_URL}/materiales/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse),
  
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/materiales/${id}`, { 
      method: 'DELETE' 
    });
    
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Error ${response.status}: ${response.statusText}`);
    }
    
    // Para DELETE, no intentar parsear JSON si la respuesta es texto plano
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    
    // Si es texto plano, devolver éxito
    return { success: true };
  },
  
  buscar: (nombre) => 
    fetch(`${API_BASE_URL}/materiales/buscar?nombre=${encodeURIComponent(nombre)}`)
      .then(handleResponse),
  
  getBajoStock: () => 
    fetch(`${API_BASE_URL}/materiales/bajo-stock`)
      .then(handleResponse)
      .catch(err => {
        console.error('Error en getBajoStock:', err);
        return [];
      }),
  
  getStock: (id) => 
    fetch(`${API_BASE_URL}/materiales/${id}/stock`)
      .then(handleResponse)
};
