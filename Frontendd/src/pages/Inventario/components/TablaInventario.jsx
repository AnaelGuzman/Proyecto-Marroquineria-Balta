// components/TablaInventario.jsx
import React from 'react'
import { Table, Button } from '../../../components/UI.jsx'
import { Visibility, Edit, Delete } from '@mui/icons-material'

export default function TablaInventario({ 
  inventarioFiltrado, 
  categorias, 
  ajustarStock, 
  actualizarPrecio, 
  actualizarCategoria,
  handleVerDetalles,
  handleEditarProducto,
  setShowConfirmDelete
}) {
  const fixedButtonStyle = {
    minWidth: '30px',
    textAlign: 'center'
  }

  const controlContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    height: '62px'
  }

  const categoryOptions = categorias.map(c => ({ 
    value: c.idCategoria, 
    label: c.nombre 
  }))

  const filas = inventarioFiltrado.map(item => {
    const prod = item.producto || {}
    const itemId = item.idInventario || prod.idProducto
    
    if (!itemId) return null
    
    let fechaFormateada = 'N/A'
    if (item.fechaActualizacion) {
      if (Array.isArray(item.fechaActualizacion)) {
        const fecha = new Date(item.fechaActualizacion[0], item.fechaActualizacion[1] - 1, item.fechaActualizacion[2])
        fechaFormateada = fecha.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })
      } else {
        const fecha = new Date(item.fechaActualizacion)
        fechaFormateada = fecha.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })
      }
    }
    
    const stockBajo = item.cantidadProducto <= 10
    const stockCritico = item.cantidadProducto <= 5

    return [
      <div key={`${itemId}-nombre`} style={{ display: 'flex', alignItems: 'center', height: '62px' }}>
        <span style={{ fontWeight: '600' }}>{prod.nombre || 'Sin nombre'}</span>
        <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '0.5rem' }}>
          <Button
            variant="ghost"
            small
            style={fixedButtonStyle}
            aria-label="Ver detalles"
            onClick={() => handleVerDetalles(prod)}
          >
            <Visibility sx={{ fontSize: 16 }} />
          </Button>
          <Button
            variant="ghost"
            small
            style={fixedButtonStyle}
            aria-label="Editar producto"
            onClick={() => handleEditarProducto(prod)}
          >
            <Edit sx={{ fontSize: 16 }} />
          </Button>
          <Button
            variant="ghost"
            small
            style={fixedButtonStyle}
            aria-label="Eliminar producto"
            onClick={() => setShowConfirmDelete(prod)}
            sx={{ color: 'var(--error)' }}
          >
            <Delete sx={{ fontSize: 16 }} />
          </Button>
        </div>
      </div>,
      <div key={`${itemId}-stock`} style={controlContainerStyle}>
        <Button
          variant="ghost"
          small
          aria-label="Disminuir stock"
          style={fixedButtonStyle}
          onClick={() => ajustarStock(prod.idProducto, -1)}
        >
          −
        </Button>
        <span style={{ 
          color: stockCritico ? '#F44336' : stockBajo ? '#FF9800' : '#4CAF50',
          fontWeight: stockBajo ? '600' : '400',
          background: stockCritico ? '#FFEBEE' : stockBajo ? '#FFF3E0' : 'transparent',
          padding: stockBajo ? '0.25rem 0.5rem' : '0',
          borderRadius: stockBajo ? '4px' : '0',
          minWidth: '40px',
          display: 'inline-block',
          textAlign: 'center'
        }}>
          {item.cantidadProducto || 0}
        </span>
        <Button
          variant="ghost"
          small
          aria-label="Aumentar stock"
          style={fixedButtonStyle}
          onClick={() => ajustarStock(prod.idProducto, 1)}
        >
          +
        </Button>
      </div>,
      <div key={`${itemId}-precio`} style={controlContainerStyle}>
        <Button
          variant="ghost"
          small
          aria-label="Disminuir precio"
          style={fixedButtonStyle}
          onClick={() => actualizarPrecio(prod.idProducto, -1000)}
        >
          −
        </Button>
        <span style={{ fontWeight: '600', color: 'var(--brand)', minWidth: '80px', display: 'inline-block', textAlign: 'center' }}>
          ${(prod.precio || 0).toLocaleString('es-CL')}
        </span>
        <Button
          variant="ghost"
          small
          aria-label="Aumentar precio"
          style={fixedButtonStyle}
          onClick={() => actualizarPrecio(prod.idProducto, 1000)}
        >
          +
        </Button>
      </div>,
      <select 
        key={`${itemId}-categoria`}
        value={prod.categoria?.idCategoria || ''} 
        onChange={(e) => actualizarCategoria(prod.idProducto, e.target.value)}
        style={{ 
          height: '62px', 
          padding: '0 1.1rem', 
          borderRadius: '8px', 
          border: '1px solid var(--border)', 
          fontSize: '1rem',
          background: 'var(--panel)'
        }}
      >
        <option value="">Sin categoría</option>
        {categoryOptions.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>,
      <span key={`${itemId}-fecha`}>{fechaFormateada}</span>
    ]
  }).filter(Boolean)

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <Table 
        columns={['Producto', 'Stock', 'Precio', 'Categoría', 'Último mov.']} 
        rows={filas} 
      />
    </div>
  )
}