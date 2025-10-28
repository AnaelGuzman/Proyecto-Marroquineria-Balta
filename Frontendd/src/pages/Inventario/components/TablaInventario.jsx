// components/TablaInventario.jsx
import React from 'react'
import { Table } from '../../../components/UI.jsx'
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
  const nativeButtonStyle = {
    width: '50px',
    height: '50px',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(0, 0, 0, 0.15)',
    borderRadius: '15px',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  };

  const controlContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    height: '62px',
    justifyContent: 'center'
  };

  const inputStyle = {
    width: '86px',
    height: '38px',
    borderRadius: '10px',
    border: '1px solid rgba(0,0,0,0.18)',
    background: 'rgba(255,255,255,0.08)',
    color: 'var(--text)',
    fontWeight: 600,
    textAlign: 'center',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 0.2s ease, background 0.2s ease'
  };

  const handleStockManual = (e, productoId, stockActual) => {
    const valor = parseInt(e.target.value, 10);
    if (Number.isNaN(valor)) {
      e.target.value = stockActual;
      return;
    }
    const nuevoStock = Math.max(0, valor);
    if (nuevoStock === stockActual) return;
    ajustarStock(productoId, nuevoStock - stockActual);
  };

  const handlePrecioManual = (e, productoId, precioActual) => {
    const valor = parseFloat(e.target.value);
    if (Number.isNaN(valor)) {
      e.target.value = precioActual;
      return;
    }
    const nuevoPrecio = Math.max(0, Math.round(valor));
    if (nuevoPrecio === precioActual) return;
    actualizarPrecio(productoId, nuevoPrecio - precioActual);
  };

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
    const stockColor = stockCritico ? '#C62828' : stockBajo ? '#EF6C00' : 'var(--text)';
    const stockInputStyle = {
      ...inputStyle,
      color: stockColor,
      border: stockCritico
        ? '1px solid rgba(244, 67, 54, 0.45)'
        : stockBajo
        ? '1px solid rgba(255, 152, 0, 0.45)'
        : inputStyle.border,
      background: stockCritico
        ? 'rgba(244, 67, 54, 0.12)'
        : stockBajo
        ? 'rgba(255, 152, 0, 0.12)'
        : inputStyle.background
    };

    return [
      <div key={`${itemId}-nombre`} style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        height: '62px', 
        width: '100%',
        gap: '1rem'
      }}>
        <span style={{ fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {prod.nombre || 'Sin nombre'}
        </span>
        <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
          <button
            style={{ ...nativeButtonStyle, color: 'var(--text)' }}
            aria-label="Ver detalles"
            onClick={() => handleVerDetalles(prod)}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(128, 107, 90, 0.32)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Visibility sx={{ fontSize: 16 }} />
          </button>
          <button
            style={{ ...nativeButtonStyle, color: 'var(--text)' }}
            aria-label="Editar producto"
            onClick={() => handleEditarProducto(prod)}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(128, 107, 90, 0.32)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Edit sx={{ fontSize: 16 }} />
          </button>
          <button
            style={{ ...nativeButtonStyle, color: 'var(--error)' }}
            aria-label="Eliminar producto"
            onClick={() => setShowConfirmDelete(prod)}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(244, 67, 54, 0.1)';
              e.currentTarget.style.borderColor = 'var(--error)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(128, 107, 90, 0.32)';
            }}
          >
            <Delete sx={{ fontSize: 16 }} />
          </button>
        </div>
      </div>,
      <div key={`${itemId}-stock`} style={controlContainerStyle}>
        <button
          aria-label="Disminuir stock"
          style={{ ...nativeButtonStyle, color: 'var(--text)', fontWeight: 'bold' }}
          onClick={() => ajustarStock(prod.idProducto, -1)}
          onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(128, 107, 90, 0.32)';
            }}
          onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
        >
          −
        </button>
        <input
          key={`${itemId}-stock-input-${item.cantidadProducto || 0}`}
          type="number"
          min="0"
          step="1"
          defaultValue={item.cantidadProducto || 0}
          className="inventory-number-input"
          onBlur={(e) => handleStockManual(e, prod.idProducto, item.cantidadProducto || 0)}
          onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
          onFocus={(e) => e.target.select()}
          style={stockInputStyle}
        />
        <button
          aria-label="Aumentar stock"
          style={{ ...nativeButtonStyle, color: 'var(--text)', fontWeight: 'bold' }}
          onClick={() => ajustarStock(prod.idProducto, 1)}
          onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(128, 107, 90, 0.32)';
            }}
          onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
        >
          +
        </button>
      </div>,
      <div key={`${itemId}-precio`} style={controlContainerStyle}>
        <button
          aria-label="Disminuir precio"
          style={{ ...nativeButtonStyle, color: 'var(--text)', fontWeight: 'bold' }}
          onClick={() => actualizarPrecio(prod.idProducto, -1000)}
          onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(128, 107, 90, 0.32)';
            }}
          onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
        >
          −
        </button>
        <input
          key={`${itemId}-precio-input-${prod.precio || 0}`}
          type="number"
          min="0"
          step="100"
          defaultValue={prod.precio || 0}
          className="inventory-number-input"
          onBlur={(e) => handlePrecioManual(e, prod.idProducto, prod.precio || 0)}
          onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
          onFocus={(e) => e.target.select()}
          style={{ ...inputStyle, width: '110px', color: 'var(--brand)' }}
        />
        <button
          aria-label="Aumentar precio"
          style={{ ...nativeButtonStyle, color: 'var(--text)', fontWeight: 'bold' }}
          onClick={() => actualizarPrecio(prod.idProducto, 1000)}
          onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(128, 107, 90, 0.32)';
            }}
          onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
        >
          +
        </button>
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