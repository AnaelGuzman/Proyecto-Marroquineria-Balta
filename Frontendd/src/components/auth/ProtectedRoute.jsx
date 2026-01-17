import React from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../../services/api/authService';

/**
 * Componente para proteger rutas que requieren autenticación
 * Redirige al login si el usuario no está autenticado
 */
export default function ProtectedRoute({ children }) {
  const estaAutenticado = authService.estaAutenticado();

  if (!estaAutenticado) {
    // Redirigir al login si no está autenticado
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado, renderizar el componente hijo
  return children;
}
