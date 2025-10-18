import React from 'react';
import { Button } from '../../components/UI.jsx';
import { Add, Delete, ShoppingCart } from '@mui/icons-material';

export default function ProductosVenta({ 
  productos, 
  productosSeleccionados, 
  onAgregarProducto, 
  onActualizarProducto, 
  onEliminarProducto,
  onIncrementarCantidad,
  onDecrementarCantidad,
  calcularSubtotalProducto,
  calcularTotal 
}) {

  // MEJORA: Filtrar productos disponibles (excluir los ya seleccionados)
  const productosDisponibles = productos.filter(producto => 
    !productosSeleccionados.some(seleccionado => 
      seleccionado.idProducto === producto.idProducto.toString()
    )
  );

  return (
    <div className="field col-12">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1rem',
        padding: '1rem',
        background: 'linear-gradient(135deg, var(--panel), var(--panel-2))',
        borderRadius: '8px',
        border: '1px solid var(--border)'
      }}>
        <label className="field-label" style={{ margin: 0, fontSize: '1.1rem' }}>
          <ShoppingCart sx={{ fontSize: 24, marginRight: 1 }} />
          Productos ({productosSeleccionados.length})
        </label>
        <Button 
          variant="ghost" 
          small 
          onClick={onAgregarProducto}
          disabled={productosDisponibles.length === 0}
        >
          <Add sx={{ fontSize: 20 }} />
          Agregar Producto
        </Button>
      </div>

      {productosSeleccionados.length === 0 ? (
        <div style={{
          padding: '3rem',
          textAlign: 'center',
          border: '2px dashed var(--border)',
          borderRadius: '8px',
          color: 'var(--muted)',
          background: 'var(--accent)'
        }}>
          <ShoppingCart sx={{ fontSize: 48, color: 'var(--muted)', marginBottom: '1rem' }} />
          <p style={{ margin: 0, fontSize: '1.1rem' }}>No hay productos agregados</p>
          <small>Haga clic en "Agregar Producto" para comenzar</small>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {productosSeleccionados.map((item, index) => (
            <div key={index} style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
              padding: '1.5rem',
              background: 'linear-gradient(135deg, var(--panel), var(--panel-2))',
              borderRadius: '12px',
              border: '2px solid var(--border)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <select 
                value={item.idProducto}
                onChange={(e) => onActualizarProducto(index, 'idProducto', e.target.value)}
                style={{ 
                  flex: 2, 
                  minHeight: '48px',
                  padding: '0.75rem',
                  border: '2px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  background: 'var(--panel)'
                }}
              >
                <option value="">Seleccionar producto...</option>
                {/* MEJORA: Mostrar solo productos disponibles */}
                {productosDisponibles.concat(
                  productos.filter(p => p.idProducto.toString() === item.idProducto)
                ).map(p => (
                  <option key={p.idProducto} value={p.idProducto}>
                    {p.nombre} - ${p.precio?.toLocaleString('es-CL', { minimumFractionDigits: 2 })}
                  </option>
                ))}
              </select>
              
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--muted)' }}>
                  Cantidad
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Button 
                    variant="ghost" 
                    small 
                    onClick={() => onDecrementarCantidad(index)}
                    style={{ minWidth: '36px', padding: '0.25rem' }}
                  >
                    −
                  </Button>
                  <input 
                    type="number"
                    value={item.cantidad}
                    onChange={(e) => onActualizarProducto(index, 'cantidad', parseInt(e.target.value) || 1)}
                    min="1"
                    step="1"
                    style={{
                      width: '70px',
                      textAlign: 'center',
                      padding: '0.5rem',
                      border: '2px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                  <Button 
                    variant="ghost" 
                    small 
                    onClick={() => onIncrementarCantidad(index)}
                    style={{ minWidth: '36px', padding: '0.25rem' }}
                  >
                    +
                  </Button>
                </div>
              </div>

              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>
                  Precio
                </div>
                <div style={{ fontWeight: '600', color: 'var(--brand)' }}>
                  ${(item.precioUnitario || 0).toLocaleString('es-CL', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>
                  Subtotal
                </div>
                <div style={{ fontWeight: '600', color: 'var(--success)' }}>
                  ${calcularSubtotalProducto(item).toLocaleString('es-CL', { minimumFractionDigits: 2 })}
                </div>
              </div>
              
              <Button 
                variant="ghost" 
                small 
                onClick={() => onEliminarProducto(index)}
                style={{ 
                  minWidth: 'auto', 
                  padding: '0.75rem',
                  background: 'var(--error)',
                  color: 'white'
                }}
              >
                <Delete sx={{ fontSize: 20 }} />
              </Button>
            </div>
          ))}
          
          {/* MEJORA: Mensaje cuando no hay más productos disponibles */}
          {productosDisponibles.length === 0 && productosSeleccionados.length > 0 && (
            <div style={{
              padding: '1rem',
              background: 'linear-gradient(135deg, #FFF3E0, #FFE0B2)',
              border: '2px solid #FF9800',
              borderRadius: '8px',
              textAlign: 'center',
              color: '#EF6C00',
              fontWeight: '500',
              fontSize: '0.9rem'
            }}>
               Todos los productos disponibles han sido agregados
            </div>
          )}
          
          <div style={{
            padding: '1rem',
            background: 'linear-gradient(135deg, var(--brand), var(--brand-2))',
            border: '2px solid var(--brand)',
            borderRadius: '8px',
            textAlign: 'center',
            fontWeight: '600',
            color: 'white',
            fontSize: '1.1rem'
          }}>
             Total Productos: {productosSeleccionados.length} | 
             Total Venta: ${calcularTotal().toLocaleString('es-CL', { minimumFractionDigits: 2 })}
          </div>
        </div>
      )}
    </div>
  );
}