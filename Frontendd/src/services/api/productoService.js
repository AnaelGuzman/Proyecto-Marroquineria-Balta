import { API_BASE_URL } from './config';

const handleResponse = async (response) => {
  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }
  const text = await response.text();
  return text ? JSON.parse(text) : [];
};

export const productoService = {
  getAll: () => 
    fetch(`${API_BASE_URL}/productos`)
      .then(handleResponse)
      .catch(err => {
        console.error('Error en getAll productos:', err);
        return [];
      }),
  
  getById: (id) => 
    fetch(`${API_BASE_URL}/productos/${id}`).then(handleResponse),
  
  create: (data) => 
    fetch(`${API_BASE_URL}/productos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse),
  
  update: (id, data) => 
    fetch(`${API_BASE_URL}/productos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse),
  
  delete: (id) => 
    fetch(`${API_BASE_URL}/productos/${id}`, { method: 'DELETE' }),
  
  buscar: (nombre) => 
    fetch(`${API_BASE_URL}/productos/buscar?nombre=${nombre}`).then(handleResponse),
  
  getPorCategoria: (idCategoria) => 
    fetch(`${API_BASE_URL}/productos/categoria/${idCategoria}`).then(handleResponse),
  
  // NUEVA FUNCIÓN - Productos más vendidos
  getMasVendidos: (inicio, fin) => 
    fetch(`${API_BASE_URL}/productos/mas-vendidos?inicio=${inicio.toISOString()}&fin=${fin.toISOString()}`)
      .then(handleResponse)
      .catch(err => {
        console.error('Error en getMasVendidos:', err);
        return [];
      })
};