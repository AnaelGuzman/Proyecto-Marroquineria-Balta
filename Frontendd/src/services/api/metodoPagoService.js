const API_BASE_URL = 'http://localhost:8080/api';

export const metodoPagoService = {
  getAll: () => 
    fetch(`${API_BASE_URL}/metodos-pago`).then(r => r.json()),
  
  getById: (id) => 
    fetch(`${API_BASE_URL}/metodos-pago/${id}`).then(r => r.json()),
  
  create: (data) => 
    fetch(`${API_BASE_URL}/metodos-pago`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  
  update: (id, data) => 
    fetch(`${API_BASE_URL}/metodos-pago/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  
  delete: (id) => 
    fetch(`${API_BASE_URL}/metodos-pago/${id}`, { method: 'DELETE' })
};