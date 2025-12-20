import React, { useState, useEffect } from 'react';
import { Card, Button, Table } from '../components/UI.jsx';
import { api } from '../services/api/index.js';
import { PersonAdd, Delete, Edit, Security, Check, Key } from '@mui/icons-material';

// Permisos disponibles
const PERMISOS_DISPONIBLES = [
  { id: 'INICIO', label: 'Inicio', icon: '🏠' },
  { id: 'VENTA', label: 'Venta', icon: '💰' },
  { id: 'COMPRA', label: 'Compra', icon: '🛒' },
  { id: 'INVENTARIO', label: 'Inventario', icon: '📦' },
  { id: 'ESTADISTICAS', label: 'Estadísticas', icon: '📊' },
  { id: 'CONFIGURACION', label: 'Configuración', icon: '⚙️' }
];

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    rut: '',
    nombre: '',
    correoElectronico: '',
    password: '',
    rol: 'USUARIO'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editandoUsuario, setEditandoUsuario] = useState(null);
  const [nuevoRol, setNuevoRol] = useState('');
  const [editandoPermisos, setEditandoPermisos] = useState(null);
  const [permisosSeleccionados, setPermisosSeleccionados] = useState([]);
  const [editandoPassword, setEditandoPassword] = useState(null);
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');

  const usuarioActual = api.auth.getUsuarioActual();
  const esAdmin = usuarioActual?.rol === 'ADMIN';

  useEffect(() => {
    if (esAdmin) {
      cargarUsuarios();
    }
  }, [esAdmin]);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8080/api/usuarios');
      const data = await response.json();
      setUsuarios(data);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarPermisos = (rut) => {
    const permisos = localStorage.getItem(`permisos_${rut}`);
    if (permisos) {
      try {
        return JSON.parse(permisos);
      } catch (e) {
        return ['INICIO'];
      }
    }
    return ['INICIO'];
  };

  const guardarPermisos = (rut, permisos) => {
    localStorage.setItem(`permisos_${rut}`, JSON.stringify(permisos));
  };

  const formatearRut = (rut) => {
    let rutLimpio = rut.replace(/\./g, '').replace(/-/g, '');
    if (rutLimpio.length > 9) rutLimpio = rutLimpio.substring(0, 9);
    if (rutLimpio.length > 1) {
      const cuerpo = rutLimpio.slice(0, -1);
      const dv = rutLimpio.slice(-1);
      return `${cuerpo}-${dv}`;
    }
    return rutLimpio;
  };

  const handleChange = (campo, valor) => {
    if (campo === 'rut') {
      valor = formatearRut(valor);
    }
    setFormData(prev => ({ ...prev, [campo]: valor }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!formData.rut || !formData.nombre || !formData.correoElectronico || !formData.password) {
        throw new Error('Todos los campos son obligatorios');
      }

      if (formData.password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      const correoExiste = await api.auth.verificarCorreo(formData.correoElectronico);
      if (correoExiste.existe) {
        throw new Error('El correo electrónico ya está registrado');
      }

      const rutExiste = await api.auth.verificarRut(formData.rut);
      if (rutExiste.existe) {
        throw new Error('El RUT ya está registrado');
      }

      await api.auth.registro({
        rut: formData.rut,
        nombre: formData.nombre,
        correoElectronico: formData.correoElectronico,
        password: formData.password,
        rol: formData.rol
      });

      if (formData.rol === 'USUARIO') {
        guardarPermisos(formData.rut, ['INICIO']);
      }

      setSuccess('Usuario creado exitosamente');
      setFormData({
        rut: '',
        nombre: '',
        correoElectronico: '',
        password: '',
        rol: 'USUARIO'
      });
      setShowModal(false);
      cargarUsuarios();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (rut) => {
    if (!window.confirm('¿Estás seguro de eliminar este usuario?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/usuarios/${rut}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Error al eliminar usuario');
      }

      localStorage.removeItem(`permisos_${rut}`);

      setSuccess('Usuario eliminado exitosamente');
      cargarUsuarios();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleEditarRol = (usuario) => {
    setEditandoUsuario(usuario);
    setNuevoRol(usuario.rol);
  };

  const handleGuardarRol = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/usuarios/${editandoUsuario.rut}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editandoUsuario,
          rol: nuevoRol
        })
      });

      if (!response.ok) {
        throw new Error('Error al actualizar rol');
      }

      if (nuevoRol === 'ADMIN') {
        localStorage.removeItem(`permisos_${editandoUsuario.rut}`);
      }

      setSuccess('Rol actualizado exitosamente');
      setEditandoUsuario(null);
      cargarUsuarios();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleEditarPermisos = (usuario) => {
    setEditandoPermisos(usuario);
    const permisos = cargarPermisos(usuario.rut);
    setPermisosSeleccionados(permisos);
  };

  const handleTogglePermiso = (permisoId) => {
    setPermisosSeleccionados(prev => {
      if (prev.includes(permisoId)) {
        if (permisoId === 'INICIO' && prev.length === 1) {
          return prev;
        }
        return prev.filter(p => p !== permisoId);
      } else {
        return [...prev, permisoId];
      }
    });
  };

  const handleGuardarPermisos = () => {
    if (permisosSeleccionados.length === 0) {
      setError('Debe seleccionar al menos un permiso');
      return;
    }

    guardarPermisos(editandoPermisos.rut, permisosSeleccionados);
    setSuccess('Permisos actualizados exitosamente');
    setEditandoPermisos(null);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleCambiarPassword = async () => {
    setError('');
    
    if (nuevaPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/auth/cambiar-password-admin/${editandoPassword.rut}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: nuevaPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cambiar contraseña');
      }

      setSuccess('Contraseña actualizada exitosamente');
      setEditandoPassword(null);
      setNuevaPassword('');
      setConfirmarPassword('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const contarPermisos = (usuario) => {
    if (usuario.rol === 'ADMIN') return 'Todos';
    const permisos = cargarPermisos(usuario.rut);
    return permisos.length;
  };

  if (!esAdmin) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Acceso Denegado</h2>
        <p>Solo los administradores pueden gestionar usuarios.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <style>{`
        .tabla-usuarios td {
          font-size: 0.8rem !important;
          padding: 0.5rem !important;
          white-space: nowrap;
        }
        
        .tabla-usuarios th {
          font-size: 0.85rem !important;
          padding: 0.6rem !important;
        }

        .rut-cell {
          font-size: 0.75rem;
          font-family: monospace;
        }
      `}</style>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem' 
      }}>
        <div>
          <h2 style={{ margin: 0 }}>Gestión de Usuarios</h2>
          <p style={{ color: 'var(--muted)', margin: '0.5rem 0 0 0' }}>
            Administra los usuarios y sus permisos
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <PersonAdd sx={{ fontSize: 20 }} />
          Crear Usuario
        </Button>
      </div>

      {success && (
        <div style={{
          padding: '1rem',
          background: '#d4edda',
          color: '#155724',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          ✓ {success}
        </div>
      )}

      <Card>
        <div className="tabla-usuarios">
          <Table
            columns={['RUT', 'Nombre', 'Correo', 'Rol', 'Permisos', 'Fecha', 'Acciones']}
            rows={usuarios.map(u => [
              <span className="rut-cell">{u.rut}</span>,
              u.nombre,
              u.correoElectronico,
              <span style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 600,
                background: u.rol === 'ADMIN' ? '#ffe0b2' : '#e3f2fd',
                color: u.rol === 'ADMIN' ? '#e65100' : '#1565c0'
              }}>
                {u.rol}
              </span>,
              <span style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 600,
                background: '#f3e5f5',
                color: '#6a1b9a',
                cursor: u.rol === 'USUARIO' ? 'pointer' : 'default'
              }}
              onClick={() => u.rol === 'USUARIO' && handleEditarPermisos(u)}
              title={u.rol === 'USUARIO' ? 'Click para editar permisos' : 'Los admins tienen todos los permisos'}
              >
                {contarPermisos(u)} {u.rol === 'USUARIO' && '✏️'}
              </span>,
              (() => {
                if (!u.fechaCreacion) return 'Sin fecha';
                try {
                  const fecha = new Date(u.fechaCreacion);
                  if (isNaN(fecha.getTime())) return 'Fecha inválida';
                  return fecha.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: '2-digit' });
                } catch {
                  return 'Error';
                }
              })(),
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <Button 
                  small 
                  variant="ghost"
                  onClick={() => handleEditarRol(u)}
                  title="Editar rol"
                >
                  <Edit sx={{ fontSize: 16 }} />
                </Button>
                <Button 
                  small 
                  variant="ghost"
                  onClick={() => {
                    setEditandoPassword(u);
                    setNuevaPassword('');
                    setConfirmarPassword('');
                    setError('');
                  }}
                  title="Cambiar contraseña"
                  style={{ color: '#f57c00' }}
                >
                  <Key sx={{ fontSize: 16 }} />
                </Button>
                {u.rol === 'USUARIO' && (
                  <Button 
                    small 
                    variant="ghost"
                    onClick={() => handleEditarPermisos(u)}
                    title="Gestionar permisos"
                    style={{ color: '#6a1b9a' }}
                  >
                    <Security sx={{ fontSize: 16 }} />
                  </Button>
                )}
                <Button 
                  small 
                  variant="ghost" 
                  style={{ color: '#d32f2f' }}
                  onClick={() => handleEliminar(u.rut)}
                  title="Eliminar usuario"
                >
                  <Delete sx={{ fontSize: 16 }} />
                </Button>
              </div>
            ])}
          />
        </div>
      </Card>

      {/* Modal de Crear Usuario */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }} onClick={() => setShowModal(false)}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Crear Nuevo Usuario</h3>

            {error && (
              <div style={{
                padding: '0.75rem',
                background: '#f8d7da',
                color: '#721c24',
                borderRadius: '8px',
                marginBottom: '1rem',
                fontSize: '0.9rem'
              }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                  RUT
                </label>
                <input
                  type="text"
                  value={formData.rut}
                  onChange={(e) => handleChange('rut', e.target.value)}
                  placeholder="12345678-9"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    fontSize: '1rem'
                  }}
                  required
                  disabled={loading}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => handleChange('nombre', e.target.value)}
                  placeholder="Juan Pérez González"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    fontSize: '1rem'
                  }}
                  required
                  disabled={loading}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={formData.correoElectronico}
                  onChange={(e) => handleChange('correoElectronico', e.target.value)}
                  placeholder="ejemplo@correo.com"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    fontSize: '1rem'
                  }}
                  required
                  disabled={loading}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Contraseña
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    fontSize: '1rem'
                  }}
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Rol
                </label>
                <select
                  value={formData.rol}
                  onChange={(e) => handleChange('rol', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    fontSize: '1rem'
                  }}
                  disabled={loading}
                >
                  <option value="USUARIO">Usuario</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creando...' : 'Crear Usuario'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Editar Rol */}
      {editandoUsuario && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }} onClick={() => setEditandoUsuario(null)}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '400px',
            width: '100%'
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Editar Rol de Usuario</h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <p><strong>Usuario:</strong> {editandoUsuario.nombre}</p>
              <p><strong>RUT:</strong> {editandoUsuario.rut}</p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                Rol
              </label>
              <select
                value={nuevoRol}
                onChange={(e) => setNuevoRol(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  fontSize: '1rem'
                }}
              >
                <option value="USUARIO">Usuario</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditandoUsuario(null)}
              >
                Cancelar
              </Button>
              <Button onClick={handleGuardarRol}>
                Guardar Cambios
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cambiar Contraseña */}
      {editandoPassword && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }} onClick={() => {
          setEditandoPassword(null);
          setNuevaPassword('');
          setConfirmarPassword('');
          setError('');
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '400px',
            width: '100%'
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Key /> Cambiar Contraseña
            </h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <p><strong>Usuario:</strong> {editandoPassword.nombre}</p>
              <p><strong>RUT:</strong> {editandoPassword.rut}</p>
              <p><strong>Correo:</strong> {editandoPassword.correoElectronico}</p>
            </div>

            {error && (
              <div style={{
                padding: '0.75rem',
                background: '#f8d7da',
                color: '#721c24',
                borderRadius: '8px',
                marginBottom: '1rem',
                fontSize: '0.9rem'
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* Campo oculto para que el navegador asocie correctamente */}
            <input
              type="text"
              name="username"
              autoComplete="username"
              value={editandoPassword.correoElectronico}
              style={{ display: 'none' }}
              readOnly
            />

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                Nueva Contraseña
              </label>
              <input
                type="password"
                name="new-password"
                autoComplete="new-password"
                value={nuevaPassword}
                onChange={(e) => {
                  setNuevaPassword(e.target.value);
                  setError('');
                }}
                placeholder="Mínimo 6 caracteres"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  fontSize: '1rem'
                }}
                minLength={6}
                autoFocus
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                Confirmar Nueva Contraseña
              </label>
              <input
                type="password"
                name="confirm-password"
                autoComplete="new-password"
                value={confirmarPassword}
                onChange={(e) => {
                  setConfirmarPassword(e.target.value);
                  setError('');
                }}
                placeholder="Repetir contraseña"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  fontSize: '1rem'
                }}
                minLength={6}
              />
            </div>

            {nuevaPassword && confirmarPassword && nuevaPassword === confirmarPassword && (
              <div style={{
                padding: '0.75rem',
                background: '#d4edda',
                color: '#155724',
                borderRadius: '8px',
                marginBottom: '1rem',
                fontSize: '0.9rem'
              }}>
                ✓ Las contraseñas coinciden
              </div>
            )}

            {nuevaPassword && confirmarPassword && nuevaPassword !== confirmarPassword && (
              <div style={{
                padding: '0.75rem',
                background: '#f8d7da',
                color: '#721c24',
                borderRadius: '8px',
                marginBottom: '1rem',
                fontSize: '0.9rem'
              }}>
                ✗ Las contraseñas no coinciden
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setEditandoPassword(null);
                  setNuevaPassword('');
                  setConfirmarPassword('');
                  setError('');
                }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleCambiarPassword}
                disabled={!nuevaPassword || !confirmarPassword || nuevaPassword !== confirmarPassword}
              >
                Cambiar Contraseña
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Editar Permisos */}
      {editandoPermisos && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
          overflowY: 'auto'
        }} onClick={() => setEditandoPermisos(null)}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            margin: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Security /> Gestionar Permisos
            </h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <p><strong>Usuario:</strong> {editandoPermisos.nombre}</p>
              <p><strong>RUT:</strong> {editandoPermisos.rut}</p>
            </div>

            {error && (
              <div style={{
                padding: '0.75rem',
                background: '#f8d7da',
                color: '#721c24',
                borderRadius: '8px',
                marginBottom: '1rem',
                fontSize: '0.9rem'
              }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 600 }}>
                Módulos a los que puede acceder:
              </label>
              
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {PERMISOS_DISPONIBLES.map(permiso => (
                  <div
                    key={permiso.id}
                    onClick={() => handleTogglePermiso(permiso.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1rem',
                      borderRadius: '8px',
                      border: `2px solid ${permisosSeleccionados.includes(permiso.id) ? 'var(--brand)' : 'var(--border)'}`,
                      background: permisosSeleccionados.includes(permiso.id) ? 'rgba(93, 64, 55, 0.05)' : '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      border: `2px solid ${permisosSeleccionados.includes(permiso.id) ? 'var(--brand)' : 'var(--border)'}`,
                      background: permisosSeleccionados.includes(permiso.id) ? 'var(--brand)' : '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '14px'
                    }}>
                      {permisosSeleccionados.includes(permiso.id) && <Check sx={{ fontSize: 16 }} />}
                    </div>
                    <span style={{ fontSize: '1.5rem' }}>{permiso.icon}</span>
                    <span style={{ fontWeight: 600, flex: 1 }}>{permiso.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ 
              padding: '1rem',
              background: '#fff3cd',
              borderRadius: '8px',
              marginBottom: '1rem',
              fontSize: '0.9rem',
              color: '#856404'
            }}>
              ℹ️ El usuario tendrá acceso solo a los módulos seleccionados
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setEditandoPermisos(null);
                  setError('');
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleGuardarPermisos}>
                Guardar Permisos
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}