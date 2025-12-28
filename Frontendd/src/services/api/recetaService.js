// recetaService.js - VERSIÓN CORREGIDA
import { API_BASE_URL } from './config';

const handleResponse = async (response) => {
  const text = await response.text();
  
  // Si la respuesta no es exitosa, lanzar error
  if (!response.ok) {
    // Intentar parsear el error como JSON
    try {
      const errorData = JSON.parse(text);
      throw new Error(errorData.message || text || `Error ${response.status}`);
    } catch {
      // Si no es JSON, usar el texto plano
      throw new Error(text || `Error ${response.status}: ${response.statusText}`);
    }
  }
  
  // Si no hay contenido, retornar null
  if (!text || text.trim() === '') {
    return null;
  }
  
  // Intentar parsear como JSON
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error('Error parsing JSON:', text);
    console.error('Parse error:', err);
    // Si no se puede parsear, retornar el texto
    return text;
  }
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
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Error ${response.status}: ${response.statusText}`);
    }
    
    return { success: true, message: 'Receta actualizada exitosamente' };
  },
  
  eliminarMaterial: async (id) => {
    const response = await fetch(`${API_BASE_URL}/recetas/${id}`, { 
      method: 'DELETE' 
    });
    
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Error ${response.status}: ${response.statusText}`);
    }
    
    const text = await response.text();
    if (!text || text.trim() === '') {
      return { success: true };
    }
    
    try {
      return JSON.parse(text);
    } catch {
      return { success: true, message: text };
    }
  }
};