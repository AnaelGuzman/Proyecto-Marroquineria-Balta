import { API_BASE_URL } from './config';

export const compraService = {
  getAll: () => 
    fetch(`${API_BASE_URL}/compras`).then(r => r.json()),
  
  getById: (id) => 
    fetch(`${API_BASE_URL}/compras/${id}`).then(r => r.json()),
  
  registrar: (data) => 
    fetch(`${API_BASE_URL}/compras`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  
  update: (id, data) => 
    fetch(`${API_BASE_URL}/compras/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  
  getTotalPorPeriodo: (inicio, fin) => {
    const params = new URLSearchParams({ inicio, fin });
    return fetch(`${API_BASE_URL}/compras/total-periodo?${params}`).then(r => r.json());
  },
  
  delete: (id) => 
    fetch(`${API_BASE_URL}/compras/${id}`, { method: 'DELETE' })
};