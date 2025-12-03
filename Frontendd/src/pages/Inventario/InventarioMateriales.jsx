// src/pages/Inventario/InventarioMateriales.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Toolbar,
  Field 
} from '../../components/UI.jsx';
import { 
  Inventory,
  Add, 
  Edit, 
  Delete, 
  TrendingUp,
  Warning,
  CheckCircle,
  Cancel,
  AttachMoney,
  SwapVert,
  ArrowUpward,
  ArrowDownward
} from '@mui/icons-material';
import { materialService } from '../../services/api/materialService.js';
import { unidadMedidaService } from '../../services/api/unidadMedidaService.js';

export default function InventarioMateriales() {
  const [materiales, setMateriales] = useState([]);
  const [unidadesMedida, setUnidadesMedida] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'material', direction: 'asc' });

  const [resumen, setResumen] = useState([
    { 
      label: 'Total Materiales', 
      value: '0',
      icon: <Inventory sx={{ fontSize: 32, color: 'var(--brand)' }} />,
      trend: 'neutral'
    },
    { 
      label: 'Materiales Bajo Stock', 
      value: '0',
      icon: <Warning sx={{ fontSize: 32, color: 'var(--warning)' }} />,
      trend: 'neutral'
    },
    { 
      label: 'Valor Total Inventario', 
      value: 'S/ 0.00',
      icon: <AttachMoney sx={{ fontSize: 32, color: 'var(--success)' }} />,
      trend: 'up'
    },
  ]);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    setError('');
    try {
      const [materialesData, unidadesData, bajoStockData] = await Promise.all([
        materialService.getAll(),
        unidadMedidaService.getAll(),
        materialService.getBajoStock()
      ]);

      setMateriales(materialesData);
      setUnidadesMedida(unidadesData);

      // Calcular valor total del inventario
      const valorTotal = materialesData.reduce((total, material) => {
        const stock = material.stockActual || 0;
        const costo = material.costoPromedio || 0;
        return total + (stock * costo);
      }, 0);

      setResumen([
        { 
          ...resumen[0], 
          value: materialesData.length.toString()
        },
        { 
          ...resumen[1], 
          value: bajoStockData.length.toString(),
          trend: bajoStockData.length > 0 ? 'down' : 'neutral'
        },
        { 
          ...resumen[2], 
          value: `S/ ${valorTotal.toFixed(2)}`
        },
      ]);

    } catch (err) {
      console.error('Error cargando datos:', err);
      setError('Error al cargar los datos: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({
      nombre: '',
      descripcion: '',
      stockMinimo: 10,
      idUnidadMedida: ''
    });
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleEdit = (material) => {
    setEditingItem(material);
    setFormData({
      nombre: material.nombre || '',
      descripcion: material.descripcion || '',
      stockMinimo: material.stockMinimo || 10,
      idUnidadMedida: material.unidadMedida?.idUnidadMedida || ''
    });
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleDelete = (material) => {
    setDeleteConfirm(material);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await materialService.delete(deleteConfirm.idMaterial);
      setSuccess('Material eliminado exitosamente');
      setDeleteConfirm(null);
      cargarDatos();
    } catch (err) {
      const errorMessage = err.message || 'Error al eliminar el material';
      if (errorMessage.includes('asociadas') || errorMessage.includes('utilizado')) {
        setError('No se puede eliminar porque tiene recetas o movimientos asociados');
      } else {
        setError('Error al eliminar el material: ' + errorMessage);
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

    if (!formData.idUnidadMedida) {
      setError('La unidad de medida es obligatoria');
      return;
    }

    try {
      const materialData = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion?.trim() || '',
        stockMinimo: parseInt(formData.stockMinimo) || 10,
        unidadMedida: {
          idUnidadMedida: parseInt(formData.idUnidadMedida)
        }
      };

      if (editingItem) {
        await materialService.update(editingItem.idMaterial, materialData);
        setSuccess('Material actualizado exitosamente');
      } else {
        await materialService.create(materialData);
        setSuccess('Material creado exitosamente');
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
      [name]: value
    }));
  };

  const getStockStatus = (material) => {
    const stock = material.stockActual || 0;
    const stockMinimo = material.stockMinimo || 10;
    
    if (stock === 0) {
      return { text: 'Sin Stock', color: '#F44336', bg: '#FFEBEE' };
    } else if (stock < stockMinimo) {
      return { text: 'Bajo Stock', color: '#FF9800', bg: '#FFF3E0' };
    } else if (stock <= stockMinimo * 2) {
      return { text: 'Stock Medio', color: '#2196F3', bg: '#E3F2FD' };
    } else {
      return { text: 'Stock OK', color: '#4CAF50', bg: '#E8F5E8' };
    }
  };

  const handleSort = (columnKey) => {
    setSortConfig((prev) => {
      if (prev.key === columnKey) {
        return { key: columnKey, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key: columnKey, direction: columnKey === 'material' ? 'asc' : 'desc' };
    });
  };

  const SortHeaderButton = ({ label, columnKey }) => {
    const isActive = sortConfig.key === columnKey;
    const IconComponent = !isActive
      ? SwapVert
      : sortConfig.direction === 'asc'
        ? ArrowUpward
        : ArrowDownward;

    return (
      <button
        type="button"
        onClick={() => handleSort(columnKey)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          background: 'transparent',
          border: 'none',
          color: 'inherit',
          font: 'inherit',
          cursor: 'pointer',
          padding: 0
        }}
      >
        <span>{label}</span>
        <IconComponent sx={{ fontSize: 16 }} />
      </button>
    );
  };

  const processedRows = useMemo(() => {
    const statusOrder = {
      'Sin Stock': 0,
      'Bajo Stock': 1,
      'Stock Medio': 2,
      'Stock OK': 3
    };

    return materiales.map((material) => {
      const status = getStockStatus(material);
      return {
        material,
        status,
        sortValues: {
          material: (material.nombre || '').toLowerCase(),
          stock: material.stockActual || 0,
          stockMinimo: material.stockMinimo || 0,
          estado: statusOrder[status.text] ?? 99,
          costo: material.costoPromedio || 0
        }
      };
    });
  }, [materiales]);

  const sortedData = useMemo(() => {
    const rows = [...processedRows];
    rows.sort((a, b) => {
      const valueA = a.sortValues[sortConfig.key];
      const valueB = b.sortValues[sortConfig.key];

      if (typeof valueA === 'string' || typeof valueB === 'string') {
        const textA = (valueA ?? '').toString();
        const textB = (valueB ?? '').toString();
        return sortConfig.direction === 'asc'
          ? textA.localeCompare(textB)
          : textB.localeCompare(textA);
      }

      const numberA = Number(valueA ?? 0);
      const numberB = Number(valueB ?? 0);
      return sortConfig.direction === 'asc'
        ? numberA - numberB
        : numberB - numberA;
    });
    return rows;
  }, [processedRows, sortConfig]);

  const columns = [
    <SortHeaderButton key="material" label="Material" columnKey="material" />,
    <SortHeaderButton key="stock" label="Stock" columnKey="stock" />,
    <SortHeaderButton key="stockMinimo" label="Stock Mínimo" columnKey="stockMinimo" />,
    <SortHeaderButton key="estado" label="Estado" columnKey="estado" />,
    <SortHeaderButton key="costo" label="Costo Promedio" columnKey="costo" />,
    'Acciones'
  ];

  const rows = sortedData.map(({ material, status }) => ([
    <div key={`${material.idMaterial}-info`} style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '0.75rem',
      fontWeight: '600', 
      color: 'var(--text)' 
    }}>
      <Inventory sx={{ 
        color: status.color, 
        fontSize: 24 
      }} />
      <div>
        <div>{material.nombre}</div>
        {material.descripcion && (
          <small style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
            {material.descripcion}
          </small>
        )}
      </div>
    </div>,
    <div key={`${material.idMaterial}-stock`} style={{ 
      color: 'var(--text)',
      fontWeight: '600',
      fontSize: '1.1rem'
    }}>
      {(material.stockActual || 0).toLocaleString()} {material.unidadMedida?.abreviatura || 'N/A'}
    </div>,
    <div key={`${material.idMaterial}-min`} style={{ 
      color: 'var(--muted)',
      fontSize: '1rem'
    }}>
      {material.stockMinimo || 10} {material.unidadMedida?.abreviatura || 'N/A'}
    </div>,
    <div key={`${material.idMaterial}-estado`}>
      <span style={{
        padding: '0.35rem 0.75rem',
        borderRadius: '20px',
        fontSize: '0.85rem',
        fontWeight: '500',
        background: status.bg,
        color: status.color,
        border: `1px solid ${status.color}33`
      }}>
        {status.text}
      </span>
    </div>,
    <div key={`${material.idMaterial}-costo`} style={{ 
      color: 'var(--success)',
      fontWeight: '600',
      fontSize: '1rem'
    }}>
      S/ {(material.costoPromedio || 0).toFixed(2)}
    </div>,
    <div key={`${material.idMaterial}-acciones`} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <Button 
        small 
        variant="ghost" 
        onClick={() => handleEdit(material)}
        style={{ minWidth: 'auto', padding: '0.5rem 0.75rem' }}
      >
        <Edit sx={{ fontSize: 18 }} />
      </Button>
      <Button 
        small 
        variant="ghost" 
        onClick={() => handleDelete(material)}
        style={{ 
          minWidth: 'auto', 
          padding: '0.5rem 0.75rem',
          background: 'var(--error)',
          color: 'white'
        }}
      >
        <Delete sx={{ fontSize: 18 }} />
      </Button>
    </div>
  ]));

  return (
    <div className="stack">
      {/* Card de Resumen */}
      <Card 
        title="Resumen de Materiales" 
        subtitle="Gestión completa del inventario de materiales e insumos"
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
        title="Gestión de Materiales" 
        subtitle="Administra los materiales e insumos del sistema"
      >
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
            Nuevo Material
          </Button>
          <Button variant="ghost" onClick={cargarDatos} disabled={loading}>
            {loading ? 'Cargando...' : 'Actualizar Lista'}
          </Button>
        </Toolbar>

        {/* Tabla de Materiales */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div className="loading">
              <p>Cargando materiales...</p>
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
                Mostrando {materiales.length} materiales en inventario
              </div>
            }
          />
        )}
      </Card>

      {/* Modal de Formulario de Material */}
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
                <Inventory sx={{ fontSize: 28 }} />
              </div>
              <div>
                <h3 style={{ margin: 0, color: 'var(--text)', fontSize: '1.6rem', fontWeight: '600' }}>
                  {editingItem ? 'Editar Material' : 'Nuevo Material'}
                </h3>
                <p style={{ margin: '0.25rem 0 0 0', color: 'var(--muted)', fontSize: '1rem' }}>
                  {editingItem ? 'Modifique los datos del material' : 'Complete los datos del nuevo material'}
                </p>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              <label>
                <span style={{ 
                  display: 'block', 
                  marginBottom: '0.75rem', 
                  color: 'var(--text)', 
                  fontWeight: '600',
                  fontSize: '1.05rem'
                }}>
                  Nombre del Material *
                </span>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre || ''}
                  onChange={handleInputChange}
                  required
                  placeholder="Ej: Cuero vacuno, Hilo nylon, Cierre metálico..."
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
                  rows="3"
                  placeholder="Descripción opcional del material..."
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <label>
                  <span style={{ 
                    display: 'block', 
                    marginBottom: '0.75rem', 
                    color: 'var(--text)', 
                    fontWeight: '600',
                    fontSize: '1.05rem'
                  }}>
                    Stock Mínimo *
                  </span>
                  <input
                    type="number"
                    name="stockMinimo"
                    value={formData.stockMinimo || 10}
                    onChange={handleInputChange}
                    min="1"
                    required
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
                </label>

                <label>
                  <span style={{ 
                    display: 'block', 
                    marginBottom: '0.75rem', 
                    color: 'var(--text)', 
                    fontWeight: '600',
                    fontSize: '1.05rem'
                  }}>
                    Unidad de Medida *
                  </span>
                  <select
                    name="idUnidadMedida"
                    value={formData.idUnidadMedida || ''}
                    onChange={handleInputChange}
                    required
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
                  >
                    <option value="">Seleccione una unidad</option>
                    {unidadesMedida.map(unidad => (
                      <option key={unidad.idUnidadMedida} value={unidad.idUnidadMedida}>
                        {unidad.nombre} ({unidad.abreviatura})
                      </option>
                    ))}
                  </select>
                </label>
              </div>

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
              ¿Está seguro de eliminar el material <strong>"{deleteConfirm.nombre}"</strong>?
              <br />
              <small style={{ color: 'var(--warning)' }}>
                Esta acción no se puede deshacer y se perderán los datos del material.
              </small>
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