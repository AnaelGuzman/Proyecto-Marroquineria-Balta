import { API_BASE_URL } from './config';

export const ventaService = {
  getAll: () => 
    fetch(`${API_BASE_URL}/ventas`)
      .then(async r => {
        if (!r.ok) {
          const text = await r.text();
          throw new Error(`Error ${r.status}: ${text}`);
        }
        return r.json();
      })
      .catch(() => []),
  
  getById: (id) => 
    fetch(`${API_BASE_URL}/ventas/${id}`)
      .then(async r => {
        if (!r.ok) {
          const text = await r.text();
          throw new Error(`Error ${r.status}: ${text}`);
        }
        return r.json();
      }),
  
  registrar: (data) => 
    fetch(`${API_BASE_URL}/ventas`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    }).then(async r => {
      const text = await r.text();
      if (!r.ok) {
        throw new Error(`Error ${r.status}: ${text}`);
      }
      try {
        return JSON.parse(text);
      } catch (e) {
        throw new Error('Respuesta inválida del servidor: ' + text);
      }
    }),
  
  getPorPeriodo: (inicio, fin) => {
    const params = new URLSearchParams({ inicio, fin });
    return fetch(`${API_BASE_URL}/ventas/periodo?${params}`)
      .then(async r => {
        if (!r.ok) {
          const text = await r.text();
          throw new Error(`Error ${r.status}: ${text}`);
        }
        return r.json();
      });
  },
  
  getTotalPorPeriodo: (inicio, fin) => {
    const params = new URLSearchParams({ inicio, fin });
    return fetch(`${API_BASE_URL}/ventas/total-periodo?${params}`)
      .then(async r => {
        if (!r.ok) {
          const text = await r.text();
          throw new Error(`Error ${r.status}: ${text}`);
        }
        return r.json();
      });
  },

  actualizar: (id, data) =>
    fetch(`${API_BASE_URL}/ventas/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    }).then(async r => {
      const text = await r.text();
      if (!r.ok) {
        throw new Error(`Error ${r.status}: ${text}`);
      }
      try {
        return JSON.parse(text);
      } catch (e) {
        throw new Error('Respuesta inválida del servidor: ' + text);
      }
    }),
  
  delete: (id) => 
    fetch(`${API_BASE_URL}/ventas/${id}`, { method: 'DELETE' })
      .then(async r => {
        if (!r.ok) {
          const text = await r.text();
          throw new Error(`Error ${r.status}: ${text}`);
        }
        return true;
      }),
      
  getTotalPorMetodoPago: (idMetodoPago, inicio, fin) => {
  const params = new URLSearchParams({ 
    idMetodoPago, 
    inicio: inicio.toISOString(), 
    fin: fin.toISOString() 
  });
  return fetch(`${API_BASE_URL}/ventas/total-metodo-pago?${params}`)
    .then(async r => {
      if (!r.ok) {
        const text = await r.text();
        throw new Error(`Error ${r.status}: ${text}`);
      }
      return r.json();
    });
}
};