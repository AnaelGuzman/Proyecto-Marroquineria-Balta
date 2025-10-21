// components/modals/ModalAjusteStock.jsx
import React from 'react'
import { Button } from '../../../../components/UI'

export default function ModalAjusteStock({
  showAjuste,
  setShowAjuste,
  ajusteData,
  setAjusteData,
  productos,
  handleAjusteStock
}) {
  if (!showAjuste) return null

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
        minWidth: '400px',
        maxWidth: '90vw',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        border: '2px solid var(--border)'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Ajuste de Stock</h3>
        
        <form onSubmit={handleAjusteStock} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label>
            <span style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)' }}>
              Producto *
            </span>
            <select
              value={ajusteData.idProducto}
              onChange={(e) => setAjusteData({ ...ajusteData, idProducto: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            >
              <option value="">Seleccionar producto</option>
              {productos.map(prod => (
                <option key={prod.idProducto} value={prod.idProducto}>
                  {prod.nombre}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)' }}>
              Cantidad a ajustar *
            </span>
            <input
              type="number"
              value={ajusteData.cantidad}
              onChange={(e) => setAjusteData({ ...ajusteData, cantidad: parseInt(e.target.value) || 0 })}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
            <small style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
              Use números negativos para disminuir el stock
            </small>
          </label>

          <label>
            <span style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)' }}>
              Motivo del ajuste
            </span>
            <input
              type="text"
              value={ajusteData.motivo}
              onChange={(e) => setAjusteData({ ...ajusteData, motivo: e.target.value })}
              placeholder="Ej: Ajuste físico, Daño, etc."
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
          </label>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <Button type="button" variant="ghost" onClick={() => setShowAjuste(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Aplicar Ajuste
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}