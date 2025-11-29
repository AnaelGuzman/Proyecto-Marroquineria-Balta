import { API_BASE_URL } from './config';

const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  
  if (!response.ok) {
    if (contentType && contentType.includes('application/json')) {
      const error = await response.json();
      throw new Error(error.message || JSON.stringify(error) || 'Error en el servidor');
    } else {
      const text = await response.text();
      throw new Error(text || `Error ${response.status}: ${response.statusText}`);
    }
  }
  
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  
  return response.text();
};

export const compraService = {
  getAll: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/compras`);
      return handleResponse(response);
    } catch (error) {
      console.error('Error en getAll compras:', error);
      throw error;
    }
  },
  
  getById: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/compras/${id}`);
      return handleResponse(response);
    } catch (error) {
      console.error('Error en getById compra:', error);
      throw error;
    }
  },
  
  registrar: async (data) => {
    try {
      // Validar que data sea un objeto válido
      if (!data || typeof data !== 'object') {
        throw new Error('Los datos de la compra son inválidos');
      }

      // Limpiar el objeto de propiedades undefined o null innecesarias
      const cleanData = {
        fecha: data.fecha,
        metodoPago: {
          idMetodoPago: parseInt(data.metodoPago?.idMetodoPago)
        },
        tipoDocumento: data.tipoDocumento || 'sin-documento',
        observaciones: data.observaciones || '',
        detalles: (data.detalles || []).map(detalle => ({
          descripcion: detalle.descripcion,
          cantidad: parseInt(detalle.cantidad),
          precioUnitario: parseFloat(detalle.precioUnitario),
          subtotal: parseFloat(detalle.subtotal)
        }))
      };

      console.log('🔍 Datos limpios a enviar:', JSON.stringify(cleanData, null, 2));

      const response = await fetch(`${API_BASE_URL}/compras`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(cleanData)
      });

      return handleResponse(response);
    } catch (error) {
      console.error('❌ Error en registrar compra:', error);
      console.error('Datos que causaron el error:', data);
      throw error;
    }
  },
  
  update: async (id, data) => {
    try {
      const response = await fetch(`${API_BASE_URL}/compras/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error en update compra:', error);
      throw error;
    }
  },
  
  getTotalPorPeriodo: async (inicio, fin) => {
    try {
      const params = new URLSearchParams({ inicio, fin });
      const response = await fetch(`${API_BASE_URL}/compras/total-periodo?${params}`);
      return handleResponse(response);
    } catch (error) {
      console.error('Error en getTotalPorPeriodo:', error);
      throw error;
    }
  },
  
  eliminar: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/compras/${id}`, { 
        method: 'DELETE' 
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      // DELETE puede devolver texto o nada
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      }
      return response.text();
    } catch (error) {
      console.error('Error en eliminar compra:', error);
      throw error;
    }
  },

  // Alias para compatibilidad
  delete: function(id) {
    return this.eliminar(id);
  },

  registrarCompraMaterial: async (compraData, materiales) => {
    try {
      const data = {
        compra: {
          fecha: compraData.fecha,
          metodoPago: compraData.metodoPago,
          observaciones: compraData.observaciones,
          tipoDocumento: "compra-material"
        },
        materiales: materiales.map(m => ({
          material: { idMaterial: m.material.idMaterial },
          cantidad: parseInt(m.cantidad),
          precioUnitario: parseFloat(m.precioUnitario)
        }))
      };

      const response = await fetch(`${API_BASE_URL}/compras/materiales`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      return handleResponse(response);
    } catch (error) {
      console.error('❌ Error en registrarCompraMaterial:', error);
      throw error;
    }
  },
  
  getMaterialesPorCompra: async (idCompra) => {
    try {
      const response = await fetch(`${API_BASE_URL}/compras/${idCompra}/materiales`);
      return handleResponse(response);
    } catch (error) {
      console.error('Error en getMaterialesPorCompra:', error);
      throw error;
    }
  }
};