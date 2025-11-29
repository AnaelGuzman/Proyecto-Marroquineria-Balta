import { API_BASE_URL } from './config';

const handleResponse = async (response) => {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Error ${response.status}: ${response.statusText}`);
  }
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

export const inventarioMaterialService = {
  registrarMovimiento: (data) => 
    fetch(`${API_BASE_URL}/inventario-materiales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse),
  
  registrarEntrada: (idMaterial, cantidad, costoUnitario, observaciones = '') => {
    const params = new URLSearchParams({
      idMaterial,
      cantidad,
      costoUnitario,
      ...(observaciones && { observaciones })
    });
    
    return fetch(`${API_BASE_URL}/inventario-materiales/entrada?${params}`, {
      method: 'POST'
    }).then(handleResponse);
  },
  
  registrarSalida: (idMaterial, cantidad, observaciones = '') => {
    const params = new URLSearchParams({
      idMaterial,
      cantidad,
      ...(observaciones && { observaciones })
    });
    
    return fetch(`${API_BASE_URL}/inventario-materiales/salida?${params}`, {
      method: 'POST'
    }).then(handleResponse);
  },
  
  getMovimientosPorMaterial: (idMaterial) => 
    fetch(`${API_BASE_URL}/inventario-materiales/material/${idMaterial}`)
      .then(handleResponse),
  
  getUltimosMovimientos: (idMaterial) => 
    fetch(`${API_BASE_URL}/inventario-materiales/material/${idMaterial}/ultimos`)
      .then(handleResponse),
  
  getStockActual: (idMaterial) => 
    fetch(`${API_BASE_URL}/inventario-materiales/material/${idMaterial}/stock`)
      .then(handleResponse),
  
  getCostoPromedio: (idMaterial) => 
    fetch(`${API_BASE_URL}/inventario-materiales/material/${idMaterial}/costo`)
      .then(handleResponse)
};