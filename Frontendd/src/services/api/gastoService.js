const API_BASE_URL = 'http://localhost:8080/api';

export const gastoService = {
  getAll: () => 
    fetch(`${API_BASE_URL}/gastos`).then(r => r.json()),
  
  getById: (id) => 
    fetch(`${API_BASE_URL}/gastos/${id}`).then(r => r.json()),
  
  registrar: (data) => 
    fetch(`${API_BASE_URL}/gastos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  
  update: (id, data) => 
    fetch(`${API_BASE_URL}/gastos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  
  getTotalPorPeriodo: (inicio, fin) => {
    const params = new URLSearchParams({ inicio, fin });
    return fetch(`${API_BASE_URL}/gastos/total-periodo?${params}`).then(r => r.json());
  },
  
  delete: (id) => 
    fetch(`${API_BASE_URL}/gastos/${id}`, { method: 'DELETE' })
};