// components/modals/ModalDetalles.jsx
import React from 'react'
import { Button } from '../../../../components/UI'
import { Visibility } from '@mui/icons-material'

export default function ModalDetalles({
  showDetalles,
  setShowDetalles,
  handleEditarProducto
}) {
  if (!showDetalles) return null

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
            <Visibility />
          </div>
          <h3 style={{ margin: 0, color: 'var(--text)', fontSize: '1.5rem' }}>
            Detalles del Producto
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <strong style={{ color: 'var(--text)' }}>Nombre:</strong>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.1rem' }}>
              {showDetalles.producto.nombre}
            </p>
          </div>

          {showDetalles.producto.descripcion && (
            <div>
              <strong style={{ color: 'var(--text)' }}>Descripción:</strong>
              <p style={{ margin: '0.5rem 0 0 0', color: 'var(--muted)' }}>
                {showDetalles.producto.descripcion}
              </p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <strong style={{ color: 'var(--text)' }}>Precio:</strong>
              <p style={{ margin: '0.5rem 0 0 0', color: 'var(--brand)', fontWeight: '600' }}>
                ${showDetalles.producto.precio?.toLocaleString('es-CL')}
              </p>
            </div>

            <div>
              <strong style={{ color: 'var(--text)' }}>Stock Actual:</strong>
              <p style={{ 
                margin: '0.5rem 0 0 0', 
                color: showDetalles.inventario?.cantidadProducto <= 5 ? '#F44336' : 
                       showDetalles.inventario?.cantidadProducto <= 10 ? '#FF9800' : '#4CAF50',
                fontWeight: '600'
              }}>
                {showDetalles.inventario?.cantidadProducto || 0} unidades
              </p>
            </div>
          </div>

          {showDetalles.producto.categoria && (
            <div>
              <strong style={{ color: 'var(--text)' }}>Categoría:</strong>
              <p style={{ margin: '0.5rem 0 0 0', color: 'var(--muted)' }}>
                {showDetalles.producto.categoria.nombre}
              </p>
            </div>
          )}

          {showDetalles.inventario?.fechaActualizacion && (
            <div>
              <strong style={{ color: 'var(--text)' }}>Última Actualización:</strong>
              <p style={{ margin: '0.5rem 0 0 0', color: 'var(--muted)' }}>
                {new Date(showDetalles.inventario.fechaActualizacion).toLocaleDateString('es-CL')}
              </p>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
          <Button variant="ghost" onClick={() => setShowDetalles(null)}>
            Cerrar
          </Button>
          <Button onClick={() => {
            handleEditarProducto(showDetalles.producto)
            setShowDetalles(null)
          }}>
            Editar Producto
          </Button>
        </div>
      </div>
    </div>
  )
}