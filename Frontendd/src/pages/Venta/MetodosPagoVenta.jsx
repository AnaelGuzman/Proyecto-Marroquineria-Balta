import React from 'react';
import { Button } from '../../components/UI.jsx';
import { Add, Delete, Payment, AutoFixHigh } from '@mui/icons-material';

export default function MetodosPagoVenta({
  metodosPago,
  metodosPagoSeleccionados,
  montoRestante,
  calcularTotal,
  onAgregarMetodoPago,
  onActualizarMetodoPago,
  onEliminarMetodoPago,
  onDistribuirMontos
}) {

  // MEJORA: Auto-completar monto restante en el primer método vacío
  const autoCompletarMontos = () => {
    if (metodosPagoSeleccionados.length === 0 || Math.abs(montoRestante) < 0.01) return;

    const total = calcularTotal();
    const totalAsignado = metodosPagoSeleccionados.reduce((sum, metodo) => 
      sum + (parseFloat(metodo.montoAsignado) || 0), 0
    );
    const restante = total - totalAsignado;

    // Encontrar el primer método con monto 0 o vacío
    const primerMetodoVacioIndex = metodosPagoSeleccionados.findIndex(
      metodo => !metodo.montoAsignado || metodo.montoAsignado == 0
    );

    if (primerMetodoVacioIndex !== -1) {
      onActualizarMetodoPago(primerMetodoVacioIndex, 'montoAsignado', restante.toFixed(2));
    }
  };

  // MEJORA: Si hay solo un método de pago, asignar automáticamente el total
  React.useEffect(() => {
    if (metodosPagoSeleccionados.length === 1) {
      const metodo = metodosPagoSeleccionados[0];
      const total = calcularTotal();
      
      // Solo asignar si el método está seleccionado y no tiene monto asignado
      if (metodo.idMetodoPago && (!metodo.montoAsignado || metodo.montoAsignado == 0)) {
        onActualizarMetodoPago(0, 'montoAsignado', total.toFixed(2));
      }
    }
  }, [metodosPagoSeleccionados.length, calcularTotal]);

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
          <Payment sx={{ fontSize: 24, marginRight: 1 }} />
          Métodos de Pago
        </label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="ghost" small onClick={onAgregarMetodoPago}>
            <Add sx={{ fontSize: 20 }} />
            Agregar Método
          </Button>
          {metodosPagoSeleccionados.length > 1 && (
            <>
              <Button variant="ghost" small onClick={onDistribuirMontos}>
                 Distribuir
              </Button>
              <Button variant="ghost" small onClick={autoCompletarMontos}>
                <AutoFixHigh sx={{ fontSize: 20 }} />
                Auto-completar
              </Button>
            </>
          )}
        </div>
      </div>

      {metodosPagoSeleccionados.length === 0 ? (
        <div style={{
          padding: '3rem',
          textAlign: 'center',
          border: '2px dashed var(--border)',
          borderRadius: '8px',
          color: 'var(--muted)',
          background: 'var(--accent)'
        }}>
          <Payment sx={{ fontSize: 48, color: 'var(--muted)', marginBottom: '1rem' }} />
          <p style={{ margin: 0, fontSize: '1.1rem' }}>No hay métodos de pago agregados</p>
          <small>Haga clic en "Agregar Método" para comenzar</small>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {metodosPagoSeleccionados.map((metodo, index) => (
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
                value={metodo.idMetodoPago}
                onChange={(e) => onActualizarMetodoPago(index, 'idMetodoPago', e.target.value)}
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
                <option value="">Seleccionar método de pago...</option>
                {metodosPago.map(m => (
                  <option key={m.idMetodoPago} value={m.idMetodoPago}>
                    {m.nombre} {m.comisionAsociada > 0 ? `(${m.comisionAsociada}% comisión)` : ''}
                  </option>
                ))}
              </select>
              
              <div style={{ flex: 1, position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--muted)',
                  zIndex: 1,
                  fontWeight: '600'
                }}>$</span>
                <input 
                  type="number"
                  value={metodo.montoAsignado}
                  onChange={(e) => onActualizarMetodoPago(index, 'montoAsignado', e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.75rem 0.75rem 2rem',
                    border: '2px solid var(--border)',
                    borderRadius: '8px',
                    background: 'var(--panel)',
                    fontSize: '1rem'
                  }}
                />
              </div>
              
              <Button 
                variant="ghost" 
                small 
                onClick={() => onEliminarMetodoPago(index)}
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
          
          <div style={{
            padding: '1rem',
            background: Math.abs(montoRestante) < 0.01 ? 
              'linear-gradient(135deg, var(--success), #66BB6A)' : 
              'linear-gradient(135deg, var(--warning), #FFA726)',
            border: `2px solid ${Math.abs(montoRestante) < 0.01 ? '#4CAF50' : '#FF9800'}`,
            borderRadius: '8px',
            textAlign: 'center',
            fontWeight: '600',
            color: 'white',
            fontSize: '1.1rem'
          }}>
            {Math.abs(montoRestante) < 0.01 ? 
              ' Montos perfectamente balanceados' : 
              ` Monto restante por asignar: $${Math.abs(montoRestante).toLocaleString('es-CL', { minimumFractionDigits: 2 })}`
            }
          </div>
        </div>
      )}
    </div>
  );
}