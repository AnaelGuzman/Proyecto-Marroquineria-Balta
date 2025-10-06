import { API_BASE_URL } from './config';

export const ventaService = {
  getAll: () => 
    fetch(`${API_BASE_URL}/ventas`)
      .then(r => r.ok ? r.json() : [])
      .catch(() => []),
  
  getById: (id) => 
    fetch(`${API_BASE_URL}/ventas/${id}`).then(r => r.json()),
  
  registrar: (data) => 
    fetch(`${API_BASE_URL}/ventas`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    }).then(async r => {
      if (!r.ok) {
        const text = await r.text();
        throw new Error(`Error ${r.status}: ${text}`);
      }
      return r.json();
    }),
  
  getPorPeriodo: (inicio, fin) => {
    const params = new URLSearchParams({ inicio, fin });
    return fetch(`${API_BASE_URL}/ventas/periodo?${params}`).then(r => r.json());
  },
  
  getTotalPorPeriodo: (inicio, fin) => {
    const params = new URLSearchParams({ inicio, fin });
    return fetch(`${API_BASE_URL}/ventas/total-periodo?${params}`).then(r => r.json());
  },
  
  delete: (id) => 
    fetch(`${API_BASE_URL}/ventas/${id}`, { method: 'DELETE' })
};