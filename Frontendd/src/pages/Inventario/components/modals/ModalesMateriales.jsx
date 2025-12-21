// src/pages/Inventario/components/modals/ModalesMateriales.jsx
import React from 'react'
import { Button } from '../../../../components/UI.jsx'
import { SwapVert, TrendingUp, TrendingDown, History, Close } from '@mui/icons-material'

export function ModalMovimiento({ 
  showMovimientoModal, 
  setShowMovimientoModal,
  tipoMovimiento,
  setTipoMovimiento,
  formMovimiento,
  setFormMovimiento,
  handleRegistrarMovimiento
}) {
  if (!showMovimientoModal) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'var(--panel)',
        padding: '2rem',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '500px',
        border: '2px solid var(--border)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          marginBottom: '1.5rem'
        }}>
          <SwapVert sx={{ color: '#2196F3', fontSize: 28 }} />
          <h3 style={{ margin: 0, fontSize: '1.3rem' }}>
            Registrar Movimiento
          </h3>
        </div>

        <div style={{ 
          background: '#2196F315', 
          padding: '0.75rem', 
          borderRadius: '8px',
          marginBottom: '1.5rem'
        }}>
          <strong>{showMovimientoModal.nombre}</strong>
          <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
            Stock actual: {showMovimientoModal.stockActual || 0} {showMovimientoModal.unidadMedida?.abreviatura || ''}
          </div>
        </div>

        {/* Selector de tipo de movimiento */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '0.75rem',
          marginBottom: '1.5rem'
        }}>
          <Button
            variant={tipoMovimiento === 'entrada' ? 'primary' : 'ghost'}
            onClick={() => setTipoMovimiento('entrada')}
            style={{
              background: tipoMovimiento === 'entrada' ? '#4CAF50' : 'transparent',
              border: `2px solid ${tipoMovimiento === 'entrada' ? '#4CAF50' : 'var(--border)'}`,
              color: tipoMovimiento === 'entrada' ? 'white' : 'var(--text)'
            }}
          >
            <TrendingUp sx={{ fontSize: 18 }} />
            Entrada
          </Button>
          <Button
            variant={tipoMovimiento === 'salida' ? 'primary' : 'ghost'}
            onClick={() => setTipoMovimiento('salida')}
            style={{
              background: tipoMovimiento === 'salida' ? '#FF9800' : 'transparent',
              border: `2px solid ${tipoMovimiento === 'salida' ? '#FF9800' : 'var(--border)'}`,
              color: tipoMovimiento === 'salida' ? 'white' : 'var(--text)'
            }}
          >
            <TrendingDown sx={{ fontSize: 18 }} />
            Salida
          </Button>
        </div>
        
        <form onSubmit={handleRegistrarMovimiento}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>
              Cantidad *
            </label>
            <input
              type="number"
              value={formMovimiento.cantidad}
              onChange={(e) => setFormMovimiento(prev => ({ ...prev, cantidad: e.target.value }))}
              required
              min="0.01"
              step="0.01"
              max={tipoMovimiento === 'salida' ? (showMovimientoModal.stockActual || 0) : undefined}
              placeholder="0"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid var(--border)',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
          </div>

          {tipoMovimiento === 'entrada' && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>
                Costo Unitario *
              </label>
              <input
                type="number"
                value={formMovimiento.costoUnitario}
                onChange={(e) => setFormMovimiento(prev => ({ ...prev, costoUnitario: e.target.value }))}
                required={tipoMovimiento === 'entrada'}
                min="0"
                step="0.01"
                placeholder="0.00"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>
              Observaciones
            </label>
            <textarea
              value={formMovimiento.observaciones}
              onChange={(e) => setFormMovimiento(prev => ({ ...prev, observaciones: e.target.value }))}
              rows="2"
              placeholder="Opcional: motivo, proveedor, etc."
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid var(--border)',
                borderRadius: '8px',
                fontSize: '1rem',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {formMovimiento.cantidad && (
            <div style={{
              background: '#2196F315',
              padding: '0.75rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              fontSize: '0.9rem'
            }}>
              {tipoMovimiento === 'entrada' ? (
                <>
                  {formMovimiento.costoUnitario && (
                    <div style={{ marginBottom: '0.25rem' }}>
                      <strong>Total entrada:</strong> ${(parseFloat(formMovimiento.cantidad || 0) * parseFloat(formMovimiento.costoUnitario || 0)).toLocaleString('es-CL')}
                    </div>
                  )}
                  <div style={{ color: 'var(--muted)' }}>
                    Nuevo stock: {(showMovimientoModal.stockActual || 0) + parseFloat(formMovimiento.cantidad || 0)} {showMovimientoModal.unidadMedida?.abreviatura || ''}
                  </div>
                </>
              ) : (
                <div style={{ color: 'var(--muted)' }}>
                  Nuevo stock: {Math.max(0, (showMovimientoModal.stockActual || 0) - parseFloat(formMovimiento.cantidad || 0))} {showMovimientoModal.unidadMedida?.abreviatura || ''}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => {
                setShowMovimientoModal(null)
                setFormMovimiento({ cantidad: '', costoUnitario: '', observaciones: '' })
              }}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              style={{ 
                background: tipoMovimiento === 'entrada' ? '#4CAF50' : '#FF9800' 
              }}
            >
              Registrar {tipoMovimiento === 'entrada' ? 'Entrada' : 'Salida'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function ModalHistorialMovimientos({ 
  showMovimientosModal, 
  setShowMovimientosModal,
  movimientos
}) {
  if (!showMovimientosModal) return null

  const formatFecha = (fecha) => {
    if (!fecha) return '-'
    return new Date(fecha).toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'var(--panel)',
        padding: '2rem',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '700px',
        maxHeight: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        border: '2px solid var(--border)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History sx={{ fontSize: 28 }} />
            <h3 style={{ margin: 0, fontSize: '1.3rem' }}>
              Historial de Movimientos
            </h3>
          </div>
        </div>

        <div style={{ 
          background: 'var(--bg)', 
          padding: '0.75rem', 
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          <strong>{showMovimientosModal.nombre}</strong>
          <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
            Stock actual: {showMovimientosModal.stockActual || 0} {showMovimientosModal.unidadMedida?.abreviatura || ''}
          </div>
        </div>

        <div style={{ 
          flex: 1, 
          overflowY: 'auto',
          marginBottom: '1rem'
        }}>
          {movimientos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
              No hay movimientos registrados
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600' }}>Fecha</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600' }}>Tipo</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.85rem', fontWeight: '600' }}>Cantidad</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.85rem', fontWeight: '600' }}>Costo</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600' }}>Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((mov, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>
                      {formatFecha(mov.fechaActualizacion)}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        background: mov.tipoMovimiento === 'ENTRADA' ? '#4CAF5020' : '#FF980020',
                        color: mov.tipoMovimiento === 'ENTRADA' ? '#4CAF50' : '#FF9800'
                      }}>
                        {mov.tipoMovimiento}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.85rem' }}>
                      {mov.cantidad} {showMovimientosModal.unidadMedida?.abreviatura || ''}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.85rem' }}>
                      ${(mov.costoUnitario || 0).toLocaleString('es-CL')}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: 'var(--muted)' }}>
                      {mov.observaciones || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={() => setShowMovimientosModal(null)}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  )
}

export function ModalDetallesMaterial({ 
  showDetallesMaterial, 
  setShowDetallesMaterial 
}) {
  if (!showDetallesMaterial) return null

  const getStockStatus = (material) => {
    const stock = material.stockActual || 0
    const stockMinimo = material.stockMinimo || 10
    
    if (stock === 0) return { text: 'Sin Stock', color: '#F44336' }
    if (stock < stockMinimo) return { text: 'Bajo', color: '#FF9800' }
    if (stock <= stockMinimo * 2) return { text: 'Medio', color: '#FFC107' }
    return { text: 'OK', color: '#4CAF50' }
  }

  const status = getStockStatus(showDetallesMaterial)

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'var(--panel)',
        padding: '2rem',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '500px',
        border: '2px solid var(--border)'
      }}>
        <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.3rem' }}>
          {showDetallesMaterial.nombre}
        </h3>

        <div style={{ marginBottom: '1rem' }}>
          <strong>Descripción:</strong> {showDetallesMaterial.descripcion || '-'}
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <strong>Stock Actual:</strong> {showDetallesMaterial.stockActual || 0} {showDetallesMaterial.unidadMedida?.abreviatura || ''}
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <strong>Stock Mínimo:</strong> {showDetallesMaterial.stockMinimo || 10} {showDetallesMaterial.unidadMedida?.abreviatura || ''}
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <strong>Unidad de Medida:</strong> {showDetallesMaterial.unidadMedida?.nombre || '-'}
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <strong>Costo Promedio:</strong> ${(showDetallesMaterial.costoPromedio || 0).toLocaleString('es-CL')}
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <strong>Estado:</strong> <span style={{ color: status.color, fontWeight: '600' }}>
            {status.text}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <Button variant="ghost" onClick={() => setShowDetallesMaterial(null)}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  )
}