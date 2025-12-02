import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/UI';
import { Logout, Person } from '@mui/icons-material';

/**
 * Componente de encabezado con información del usuario y botón de logout
 */
export default function Header() {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

  const handleLogout = () => {
    // Confirmar antes de cerrar sesión
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      localStorage.removeItem('usuario');
      navigate('/login');
    }
  };

  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 2rem',
      background: 'linear-gradient(135deg, var(--brand), var(--brand-2))',
      color: 'white',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: '1.5rem', 
          fontWeight: '700' 
        }}>
          Marroquinería Balta
        </h1>
      </div>

      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '1rem' 
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '8px',
          backdropFilter: 'blur(10px)'
        }}>
          <Person sx={{ fontSize: 20 }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ 
              fontWeight: '600', 
              fontSize: '0.95rem' 
            }}>
              {usuario.nombre || 'Usuario'}
            </span>
            <span style={{ 
              fontSize: '0.8rem', 
              opacity: 0.9 
            }}>
              {usuario.rol || 'USUARIO'}
            </span>
          </div>
        </div>

        <Button
          variant="ghost"
          onClick={handleLogout}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            border: '2px solid rgba(255, 255, 255, 0.3)'
          }}
        >
          <Logout sx={{ fontSize: 20 }} />
          Cerrar Sesión
        </Button>
      </div>
    </header>
  );
}
