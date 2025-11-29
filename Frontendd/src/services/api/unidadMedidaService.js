import { API_BASE_URL } from './config';

const handleResponse = async (response) => {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Error ${response.status}: ${response.statusText}`);
  }
  if (response.status === 204) { 
    return { success: true };
  }
  
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};
export const unidadMedidaService = {
  getAll: () => 
    fetch(`${API_BASE_URL}/unidades-medida`)
      .then(handleResponse)
      .catch(err => {
        console.error('Error en getAll unidades medida:', err);
        return [];
      }),
  
  getById: (id) => 
    fetch(`${API_BASE_URL}/unidades-medida/${id}`).then(handleResponse),
  
  create: (data) => 
    fetch(`${API_BASE_URL}/unidades-medida`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse),
  
  update: (id, data) => 
    fetch(`${API_BASE_URL}/unidades-medida/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse),
  
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/unidades-medida/${id}`, { 
      method: 'DELETE' 
    });
    
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Error ${response.status}: ${response.statusText}`);
    }
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return { success: true };
  }
};