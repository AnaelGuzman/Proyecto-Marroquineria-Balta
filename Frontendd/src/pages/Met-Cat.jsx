import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Toolbar,
  Field 
} from '../components/UI.jsx';
import { 
  Category, 
  Payment, 
  Add, 
  Edit, 
  Delete, 
  TrendingUp,
  CheckCircle,
  Cancel
} from '@mui/icons-material';
import { categoriaService } from '../services/api/categoriaService.js';
import { metodoPagoService } from '../services/api/metodoPagoService';

export default function Configuracion() {
  const [activeTab, setActiveTab] = useState('categorias');
  const [categorias, setCategorias] = useState([]);
  const [metodosPago, setMetodosPago] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [resumen, setResumen] = useState([
    { 
      label: 'Total Categorías', 
      value: '0',
      icon: <Category sx={{ fontSize: 32, color: 'var(--brand)' }} />,
      trend: 'neutral'
    },
    { 
      label: 'Métodos de Pago', 
      value: '0',
      icon: <Payment sx={{ fontSize: 32, color: 'var(--brand-2)' }} />,
      trend: 'neutral'
    },
    { 
      label: 'Configuraciones Activas', 
      value: 'Todas',
      icon: <TrendingUp sx={{ fontSize: 32, color: 'var(--success)' }} />,
      trend: 'up'
    },
  ]);

  useEffect(() => {
    cargarDatos();
  }, [activeTab]);

  const cargarDatos = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'categorias') {
        const data = await categoriaService.getAll();
        setCategorias(data);
        setResumen(prev => [
          { ...prev[0], value: data.length.toString() },
          prev[1],
          prev[2]
        ]);
      } else {
        const data = await metodoPagoService.getAll();
        setMetodosPago(data);
        setResumen(prev => [
          prev[0],
          { ...prev[1], value: data.length.toString() },
          prev[2]
        ]);
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError('Error al cargar los datos: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormData(activeTab === 'categorias' ? { 
      nombre: '', 
      descripcion: '' 
    } : { 
      nombre: '', 
      comisionAsociada: 0 
    });
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    const formData = { ...item };
    if (item.comisionAsociada !== undefined) {
      formData.comisionAsociada = parseFloat(item.comisionAsociada) || 0;
    }
    setFormData(formData);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (item) => {
    setDeleteConfirm(item);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      if (activeTab === 'categorias') {
        await categoriaService.delete(deleteConfirm.idCategoria);
        setSuccess('Categoría eliminada exitosamente');
      } else {
        // Verificar si el método de pago está en uso
        const enUso = await metodoPagoService.verificarEnUso(deleteConfirm.idMetodoPago);
        if (enUso) {
          setError('No se puede eliminar el método de pago porque está siendo utilizado en ventas');
          setDeleteConfirm(null);
          return;
        }
        await metodoPagoService.delete(deleteConfirm.idMetodoPago);
        setSuccess('Método de pago eliminado exitosamente');
      }
      setDeleteConfirm(null);
      cargarDatos();
    } catch (err) {
      const errorMessage = err.message || 'Error al eliminar el elemento';
      if (errorMessage.includes('asociadas') || errorMessage.includes('utilizado')) {
        setError('No se puede eliminar porque tiene transacciones asociadas');
      } else {
        setError('Error al eliminar el elemento: ' + errorMessage);
      }
      setDeleteConfirm(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validaciones
    if (!formData.nombre || formData.nombre.trim() === '') {
      setError('El nombre es obligatorio');
      return;
    }

    if (activeTab === 'metodos-pago') {
      const comision = parseFloat(formData.comisionAsociada) || 0;
      if (comision < 0 || comision > 100) {
        setError('La comisión debe estar entre 0% y 100%');
        return;
      }
      if (isNaN(comision)) {
        setError('La comisión debe ser un número válido');
        return;
      }
    }

    try {
      if (activeTab === 'categorias') {
        const categoriaData = {
          nombre: formData.nombre.trim(),
          descripcion: formData.descripcion?.trim() || ''
        };

        if (editingItem) {
          await categoriaService.update(editingItem.idCategoria, categoriaData);
          setSuccess('Categoría actualizada exitosamente');
        } else {
          await categoriaService.create(categoriaData);
          setSuccess('Categoría creada exitosamente');
        }
      } else {
        // CORRECCIÓN: Estructura simplificada para métodos de pago
        const metodoPagoData = {
          nombre: formData.nombre.trim(),
          comisionAsociada: parseFloat(formData.comisionAsociada) || 0
        };

        // Validar que comisionAsociada sea un número
        if (isNaN(metodoPagoData.comisionAsociada)) {
          setError('La comisión debe ser un número válido');
          return;
        }

        console.log('Enviando datos de método de pago:', metodoPagoData);

        if (editingItem) {
          await metodoPagoService.update(editingItem.idMetodoPago, metodoPagoData);
          setSuccess('Método de pago actualizado exitosamente');
        } else {
          await metodoPagoService.create(metodoPagoData);
          setSuccess('Método de pago creado exitosamente');
        }
      }
      setShowForm(false);
      cargarDatos();
    } catch (err) {
      console.error('Error completo:', err);
      setError('Error al guardar los datos: ' + (err.message || 'Revise los datos e intente nuevamente'));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'comisionAsociada' ? value : value
    }));
  };

  const currentData = activeTab === 'categorias' ? categorias : metodosPago;
  const columns = activeTab === 'categorias' 
    ? ['Nombre', 'Descripción', 'Acciones']
    : ['Nombre', 'Comisión', 'Estado', 'Acciones'];

  const rows = currentData.map(item => {
    if (activeTab === 'categorias') {
      return [
        <div key={item.idCategoria} style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem',
          fontWeight: '600', 
          color: 'var(--text)' 
        }}>
          <Category sx={{ color: 'var(--brand)', fontSize: 24 }} />
          {item.nombre}
        </div>,
        <div key={item.idCategoria} style={{ 
          color: 'var(--muted)',
          maxWidth: '300px',
          lineHeight: '1.4'
        }}>
          {item.descripcion || <span style={{ fontStyle: 'italic', color: 'var(--muted)' }}>Sin descripción</span>}
        </div>,
        <div key={item.idCategoria} style={{ display: 'flex', gap: '0.5rem' }}>
          <Button 
            small 
            variant="ghost" 
            onClick={() => handleEdit(item)}
            style={{ minWidth: 'auto', padding: '0.5rem 1rem' }}
          >
            <Edit sx={{ fontSize: 18 }} />
          </Button>
          <Button 
            small 
            variant="ghost" 
            onClick={() => handleDelete(item)}
            style={{ 
              minWidth: 'auto', 
              padding: '0.5rem 1rem',
              background: 'var(--error)',
              color: 'white'
            }}
          >
            <Delete sx={{ fontSize: 18 }} />
          </Button>
        </div>
      ];
    } else {
      return [
        <div key={item.idMetodoPago} style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem',
          fontWeight: '600', 
          color: 'var(--text)' 
        }}>
          <Payment sx={{ 
            color: item.comisionAsociada > 0 ? 'var(--warning)' : 'var(--success)', 
            fontSize: 24 
          }} />
          {item.nombre}
        </div>,
        <div key={item.idMetodoPago} style={{ 
          color: item.comisionAsociada > 0 ? 'var(--warning)' : 'var(--success)',
          fontWeight: '600',
          fontSize: '1.1rem'
        }}>
          {item.comisionAsociada ? `${parseFloat(item.comisionAsociada).toFixed(2)}%` : '0%'}
        </div>,
        <div key={item.idMetodoPago}>
          <span style={{
            padding: '0.35rem 0.75rem',
            borderRadius: '20px',
            fontSize: '0.85rem',
            fontWeight: '500',
            background: item.comisionAsociada > 0 ? '#FFF3E0' : '#E8F5E8',
            color: item.comisionAsociada > 0 ? '#EF6C00' : '#2E7D32',
            border: `1px solid ${item.comisionAsociada > 0 ? '#FFB74D' : '#A5D6A7'}`
          }}>
            {item.comisionAsociada > 0 ? 'Con Comisión' : 'Sin Comisión'}
          </span>
        </div>,
        <div key={item.idMetodoPago} style={{ display: 'flex', gap: '0.5rem' }}>
          <Button 
            small 
            variant="ghost" 
            onClick={() => handleEdit(item)}
            style={{ minWidth: 'auto', padding: '0.5rem 1rem' }}
          >
            <Edit sx={{ fontSize: 18 }} />
          </Button>
          <Button 
            small 
            variant="ghost" 
            onClick={() => handleDelete(item)}
            style={{ 
              minWidth: 'auto', 
              padding: '0.5rem 1rem',
              background: 'var(--error)',
              color: 'white'
            }}
          >
            <Delete sx={{ fontSize: 18 }} />
          </Button>
        </div>
      ];
    }
  });

  return (
    <div className="stack">
      {/* Card de Resumen */}
      <Card 
        title="Resumen de Configuración" 
        subtitle="Gestión centralizada de categorías y métodos de pago"
        accent="accent"
      >
        <div className="stats">
          {resumen.map((r, index) => (
            <div key={r.label} className="stat">
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                {r.icon}
                <span style={{
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  background: r.trend === 'up' ? '#E8F5E8' : r.trend === 'down' ? '#FFEBEE' : '#F3E5F5',
                  color: r.trend === 'up' ? '#2E7D32' : r.trend === 'down' ? '#C62828' : '#7B1FA2'
                }}>
                  {r.trend === 'up' ? '↑' : r.trend === 'down' ? '↓' : '→'}
                </span>
              </div>
              <span className="stat-label">{r.label}</span>
              <span className="stat-value">{r.value}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Card Principal de Gestión */}
      <Card 
        title="Gestión de Configuraciones" 
        subtitle="Administra las categorías de productos y métodos de pago del sistema"
      >
        {/* Sistema de Pestañas */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            borderBottom: '2px solid var(--border)',
            paddingBottom: '0'
          }}>
            <button
              onClick={() => setActiveTab('categorias')}
              style={{
                padding: '1.25rem 2rem',
                background: activeTab === 'categorias' ? 'var(--brand)' : 'transparent',
                color: activeTab === 'categorias' ? 'white' : 'var(--text)',
                border: 'none',
                borderBottom: activeTab === 'categorias' ? '3px solid var(--brand)' : '3px solid transparent',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                borderRadius: '12px 12px 0 0',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}
            >
              <Category sx={{ fontSize: 22 }} />
              Categorías de Productos
            </button>
            <button
              onClick={() => setActiveTab('metodos-pago')}
              style={{
                padding: '1.25rem 2rem',
                background: activeTab === 'metodos-pago' ? 'var(--brand)' : 'transparent',
                color: activeTab === 'metodos-pago' ? 'white' : 'var(--text)',
                border: 'none',
                borderBottom: activeTab === 'metodos-pago' ? '3px solid var(--brand)' : '3px solid transparent',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                borderRadius: '12px 12px 0 0',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}
            >
              <Payment sx={{ fontSize: 22 }} />
              Métodos de Pago
            </button>
          </div>
        </div>

        {/* Mensajes de Estado */}
        {error && (
          <div style={{
            background: 'linear-gradient(135deg, #FFEBEE, #FFCDD2)',
            border: '2px solid #F44336',
            color: '#C62828',
            padding: '1.25rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontWeight: '500'
          }}>
            <Cancel sx={{ fontSize: 24 }} />
            {error}
          </div>
        )}

        {success && (
          <div style={{
            background: 'linear-gradient(135deg, #E8F5E8, #C8E6C9)',
            border: '2px solid #4CAF50',
            color: '#2E7D32',
            padding: '1.25rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontWeight: '500'
          }}>
            <CheckCircle sx={{ fontSize: 24 }} />
            {success}
          </div>
        )}

        {/* Toolbar de Acciones */}
        <Toolbar>
          <Button onClick={handleCreate}>
            <Add sx={{ fontSize: 20 }} />
            Nuevo {activeTab === 'categorias' ? 'Categoría' : 'Método de Pago'}
          </Button>
          <Button variant="ghost" onClick={cargarDatos} disabled={loading}>
            {loading ? 'Cargando...' : 'Actualizar Lista'}
          </Button>
        </Toolbar>

        {/* Tabla de Datos */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div className="loading">
              <p>Cargando {activeTab === 'categorias' ? 'categorías' : 'métodos de pago'}...</p>
            </div>
          </div>
        ) : (
          <Table 
            columns={columns} 
            rows={rows}
            footer={
              <div style={{ 
                padding: '1rem', 
                textAlign: 'center', 
                color: 'var(--muted)',
                background: 'var(--panel-2)'
              }}>
                Mostrando {currentData.length} {activeTab === 'categorias' ? 'categorías' : 'métodos de pago'}
              </div>
            }
          />
        )}
      </Card>

      {/* Modal de Formulario */}
      {showForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '1rem',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'var(--panel)',
            padding: '2.5rem',
            borderRadius: '20px',
            minWidth: '500px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            border: '2px solid var(--border)'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem', 
              marginBottom: '2rem',
              paddingBottom: '1.5rem',
              borderBottom: '2px solid var(--border)'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, var(--brand), var(--brand-2))',
                padding: '1rem',
                borderRadius: '14px',
                color: 'white'
              }}>
                {activeTab === 'categorias' ? <Category sx={{ fontSize: 28 }} /> : <Payment sx={{ fontSize: 28 }} />}
              </div>
              <div>
                <h3 style={{ margin: 0, color: 'var(--text)', fontSize: '1.6rem', fontWeight: '600' }}>
                  {editingItem ? 'Editar' : 'Nuevo'} {activeTab === 'categorias' ? 'Categoría' : 'Método de Pago'}
                </h3>
                <p style={{ margin: '0.25rem 0 0 0', color: 'var(--muted)', fontSize: '1rem' }}>
                  {editingItem ? 'Modifique los datos necesarios' : 'Complete los datos del nuevo elemento'}
                </p>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              {/* Campo Nombre */}
              <label>
                <span style={{ 
                  display: 'block', 
                  marginBottom: '0.75rem', 
                  color: 'var(--text)', 
                  fontWeight: '600',
                  fontSize: '1.05rem'
                }}>
                  Nombre *
                </span>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre || ''}
                  onChange={handleInputChange}
                  required
                  placeholder={`Ingrese el nombre del ${activeTab === 'categorias' ? 'categoría' : 'método de pago'}`}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    border: '2px solid var(--border)',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    background: 'var(--panel)',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--brand)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                />
              </label>

              {/* Campo Específico según la pestaña */}
              {activeTab === 'categorias' ? (
                <label>
                  <span style={{ 
                    display: 'block', 
                    marginBottom: '0.75rem', 
                    color: 'var(--text)', 
                    fontWeight: '600',
                    fontSize: '1.05rem'
                  }}>
                    Descripción
                  </span>
                  <textarea
                    name="descripcion"
                    value={formData.descripcion || ''}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="Ingrese una descripción opcional para la categoría..."
                    style={{
                      width: '100%',
                      padding: '1rem',
                      border: '2px solid var(--border)',
                      borderRadius: '10px',
                      fontSize: '1rem',
                      background: 'var(--panel)',
                      resize: 'vertical',
                      transition: 'border-color 0.3s ease',
                      fontFamily: 'inherit'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--brand)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                  />
                </label>
              ) : (
                <label>
                  <span style={{ 
                    display: 'block', 
                    marginBottom: '0.75rem', 
                    color: 'var(--text)', 
                    fontWeight: '600',
                    fontSize: '1.05rem'
                  }}>
                    Comisión Asociada (%)
                  </span>
                  <input
                    type="number"
                    name="comisionAsociada"
                    value={formData.comisionAsociada || 0}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="0.00"
                    style={{
                      width: '100%',
                      padding: '1rem',
                      border: '2px solid var(--border)',
                      borderRadius: '10px',
                      fontSize: '1rem',
                      background: 'var(--panel)',
                      transition: 'border-color 0.3s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--brand)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                  />
                  <small style={{ 
                    color: 'var(--muted)', 
                    fontSize: '0.9rem', 
                    marginTop: '0.5rem', 
                    display: 'block',
                    fontStyle: 'italic'
                  }}>
                    Ej: 2.5 para 2.5% de comisión. Deje en 0 si no aplica comisión.
                  </small>
                </label>
              )}

              {/* Botones de Acción */}
              <div style={{ 
                display: 'flex', 
                gap: '1rem', 
                justifyContent: 'flex-end', 
                marginTop: '2rem',
                paddingTop: '1.5rem',
                borderTop: '2px solid var(--border)'
              }}>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  <Cancel sx={{ fontSize: 20 }} />
                  Cancelar
                </Button>
                <Button type="submit">
                  <CheckCircle sx={{ fontSize: 20 }} />
                  {editingItem ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1001,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--panel)',
            padding: '2.5rem',
            borderRadius: '20px',
            maxWidth: '500px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            border: '2px solid var(--border)'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #FFEBEE, #FFCDD2)',
              padding: '1.5rem',
              borderRadius: '50%',
              width: '80px',
              height: '80px',
              margin: '0 auto 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Delete sx={{ fontSize: 36, color: '#F44336' }} />
            </div>
            
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text)', fontSize: '1.5rem', fontWeight: '600' }}>
              Confirmar Eliminación
            </h3>
            
            <p style={{ margin: '0 0 2rem 0', color: 'var(--muted)', fontSize: '1.1rem', lineHeight: '1.6' }}>
              ¿Está seguro de eliminar <strong>"{deleteConfirm.nombre}"</strong>? 
              {activeTab === 'metodos-pago' && ' Se verificará si está en uso antes de proceder.'}
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <Button variant="ghost" onClick={cancelDelete} style={{ minWidth: '120px' }}>
                <Cancel sx={{ fontSize: 20 }} />
                Cancelar
              </Button>
              <Button onClick={confirmDelete} style={{ 
                minWidth: '120px',
                background: 'var(--error)'
              }}>
                <Delete sx={{ fontSize: 20 }} />
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 