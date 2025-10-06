import { API_BASE_URL } from './config';

export const inventarioService = {
  getAll: () => 
    fetch(`${API_BASE_URL}/inventario`).then(r => r.json()),
  
  getById: (id) => 
    fetch(`${API_BASE_URL}/inventario/${id}`).then(r => r.json()),
  
  getPorProducto: (idProducto) => 
    fetch(`${API_BASE_URL}/inventario/producto/${idProducto}`).then(r => r.json()),
  
  registrar: (data) => 
    fetch(`${API_BASE_URL}/inventario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  
  actualizar: (id, data) => 
    fetch(`${API_BASE_URL}/inventario/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  
  ajustarCantidad: (idProducto, cantidad) => 
    fetch(`${API_BASE_URL}/inventario/ajustar/${idProducto}?cantidad=${cantidad}`, {
      method: 'PUT'
    }).then(r => r.json()),
  
  getBajoStock: (minimo = 10) => 
    fetch(`${API_BASE_URL}/inventario/bajo-stock?minimo=${minimo}`).then(r => r.json()),
  
  delete: (id) => 
    fetch(`${API_BASE_URL}/inventario/${id}`, { method: 'DELETE' })
};