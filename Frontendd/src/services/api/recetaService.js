// recetaService.js - VERSIÓN SIMPLIFICADA
import { API_BASE_URL } from './config';

const handleResponse = async (response) => {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Error ${response.status}: ${response.statusText}`);
  }
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

export const recetaService = {
  agregarMaterial: (data) => 
    fetch(`${API_BASE_URL}/recetas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse),
  
  getMaterialesPorProducto: (idProducto) => 
    fetch(`${API_BASE_URL}/recetas/producto/${idProducto}`)
      .then(handleResponse)
      .catch(err => {
        console.error('Error en getMaterialesPorProducto:', err);
        return [];
      }),
  
  getProductosPorMaterial: (idMaterial) => 
    fetch(`${API_BASE_URL}/recetas/material/${idMaterial}`)
      .then(handleResponse),
  
  getCostoProducto: (idProducto) => 
    fetch(`${API_BASE_URL}/recetas/producto/${idProducto}/costo`)
      .then(handleResponse),
  
  actualizarReceta: async (idProducto, materiales) => {
    const response = await fetch(`${API_BASE_URL}/recetas/producto/${idProducto}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(materiales)
    });
    
    // Solo verificar si hay error, si no, asumir éxito
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Error ${response.status}: ${response.statusText}`);
    }
    
    // Para actualizarReceta, solo nos importa que no haya error
    // No necesitamos leer la respuesta si es exitosa
    return { success: true, message: 'Receta actualizada exitosamente' };
  },
  
  eliminarMaterial: (id) => 
    fetch(`${API_BASE_URL}/recetas/${id}`, { method: 'DELETE' })
      .then(handleResponse)
};