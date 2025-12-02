import { categoriaService } from './categoriaService';
import { productoService } from './productoService';
import { inventarioService } from './inventarioService';
import { ventaService } from './ventaService';
import { compraService } from './compraService';
import { gastoService } from './gastoService';
import { metodoPagoService } from './metodoPagoService';
import { materialService } from './materialService';
import { unidadMedidaService } from './unidadMedidaService';
import { inventarioMaterialService } from './inventarioMaterialService.js';
import { recetaService } from './recetaService';

const API_BASE_URL = 'http://localhost:8080/api';

// Helper para manejar respuestas
const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  
  if (!response.ok) {
    if (contentType && contentType.includes('application/json')) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Error en el servidor');
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

// Servicios de Autenticación
const authService = {
  // Iniciar sesión
  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al iniciar sesión');
    }
    
    return await response.json();
  },

  // Registrar nuevo usuario
  registro: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/registro`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al registrar usuario');
    }
    
    return await response.json();
  },

  // Verificar si un correo ya existe
  verificarCorreo: async (correo) => {
    const response = await fetch(`${API_BASE_URL}/auth/verificar-correo?correo=${encodeURIComponent(correo)}`);
    
    if (!response.ok) {
      throw new Error('Error al verificar correo');
    }
    
    return await response.json();
  },

  // Verificar si un RUT ya existe
  verificarRut: async (rut) => {
    const response = await fetch(`${API_BASE_URL}/auth/verificar-rut?rut=${encodeURIComponent(rut)}`);
    
    if (!response.ok) {
      throw new Error('Error al verificar RUT');
    }
    
    return await response.json();
  },

  // Cambiar contraseña
  cambiarPassword: async (data) => {
    const response = await fetch(`${API_BASE_URL}/auth/cambiar-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al cambiar contraseña');
    }
    
    return await response.json();
  },

  // Cerrar sesión (local)
  logout: () => {
    localStorage.removeItem('usuario');
  },

  // Obtener usuario actual
  getUsuarioActual: () => {
    const usuario = localStorage.getItem('usuario');
    return usuario ? JSON.parse(usuario) : null;
  },

  // Verificar si el usuario está autenticado
  estaAutenticado: () => {
    return localStorage.getItem('usuario') !== null;
  }
};

export const api = {
  auth: authService,
  categorias: categoriaService,
  productos: productoService,
  inventario: inventarioService,
  ventas: ventaService,
  compras: compraService,
  gastos: gastoService,
  metodosPago: metodoPagoService,
  materiales: materialService,
  unidadesMedida: unidadMedidaService,
  inventarioMateriales: inventarioMaterialService,
  recetas: recetaService
};

// Mantener compatibilidad con el código anterior
export const getCategorias = categoriaService.getAll;
export const getProductos = productoService.getAll;
export const getInventario = inventarioService.getAll;
export const getVentas = ventaService.getAll;
export const getCompras = compraService.getAll;
export const getGastos = gastoService.getAll;
export const getMetodosPago = metodoPagoService.getAll;

export { handleResponse };
