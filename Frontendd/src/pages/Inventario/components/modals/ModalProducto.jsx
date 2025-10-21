// components/modals/ModalProducto.jsx
import React from 'react'
import { Button } from '../../../../components/UI'
import { Inventory } from '@mui/icons-material'

export default function ModalProducto({
  showForm,
  setShowForm,
  productoEdit,
  setProductoEdit,
  formData,
  setFormData,
  categorias,
  handleCrearProducto,
  handleActualizarProducto
}) {
  const categoryOptions = categorias.map(c => ({ 
    value: c.idCategoria, 
    label: c.nombre 
  }))

  if (!showForm) return null

  return (
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
        padding: '2rem',
        borderRadius: '16px',
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
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '2px solid var(--border)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--brand), var(--brand-2))',
            padding: '0.75rem',
            borderRadius: '12px',
            color: 'white'
          }}>
            <Inventory />
          </div>
          <h3 style={{ margin: 0, color: 'var(--text)', fontSize: '1.5rem' }}>
            {productoEdit ? 'Editar Producto' : 'Nuevo Producto'}
          </h3>
        </div>
        
        <form onSubmit={productoEdit ? handleActualizarProducto : handleCrearProducto} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <label>
            <span style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)', fontWeight: '500' }}>
              Nombre *
            </span>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid var(--border)',
                borderRadius: '8px',
                fontSize: '1rem',
                background: 'var(--panel)'
              }}
            />
          </label>

          <label>
            <span style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)', fontWeight: '500' }}>
              Descripción
            </span>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              rows="3"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid var(--border)',
                borderRadius: '8px',
                fontSize: '1rem',
                background: 'var(--panel)',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label>
              <span style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)', fontWeight: '500' }}>
                Precio *
              </span>
              <input
                type="number"
                value={formData.precio}
                onChange={(e) => setFormData({ ...formData, precio: parseFloat(e.target.value) || 0 })}
                min="0"
                step="100"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  background: 'var(--panel)'
                }}
              />
            </label>

            <label>
              <span style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)', fontWeight: '500' }}>
                Stock Inicial
              </span>
              <input
                type="number"
                value={formData.cantidad}
                onChange={(e) => setFormData({ ...formData, cantidad: parseInt(e.target.value) || 0 })}
                min="0"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  background: 'var(--panel)'
                }}
              />
            </label>
          </div>

          <label>
            <span style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)', fontWeight: '500' }}>
              Categoría
            </span>
            <select
              value={formData.idCategoria}
              onChange={(e) => setFormData({ ...formData, idCategoria: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid var(--border)',
                borderRadius: '8px',
                fontSize: '1rem',
                background: 'var(--panel)'
              }}
            >
              <option value="">Seleccionar categoría</option>
              {categoryOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setProductoEdit(null); }}>
              Cancelar
            </Button>
            <Button type="submit">
              {productoEdit ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}