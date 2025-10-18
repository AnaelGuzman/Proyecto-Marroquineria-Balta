import React from 'react';
import { Card, Toolbar, Button } from '../../components/UI.jsx';
import { AttachMoney, Add, CalendarToday, Description, Receipt } from '@mui/icons-material';

export default function FormularioVenta({
  formData,
  onFormChange,
  onGuardar,
  onGuardarYNuevo,
  onCancelar,
  calcularTotal,
  metodosPagoSeleccionados,
  metodosPago, 
  children
}) {

  const calcularResumen = () => {
    const bruto = calcularTotal();
    const neto = bruto / 1.19;
    const iva = bruto - neto;
    
    // Calcular comisiones totales
    const comisionTotal = metodosPagoSeleccionados.reduce((total, metodo) => {
      if (metodo.idMetodoPago && metodo.montoAsignado) {
        const metodoPagoComision = metodosPago.find(m => m.idMetodoPago === parseInt(metodo.idMetodoPago));
        if (metodoPagoComision?.comisionAsociada) {
          return total + (metodo.montoAsignado * metodoPagoComision.comisionAsociada / 100);
        }
      }
      return total;
    }, 0);

    return {
      bruto: bruto,
      neto: neto,
      iva: iva,
      comision: comisionTotal
    };
  };

  const resumen = calcularResumen();

  return (
    <Card 
      title="Registrar Nueva Venta" 
      subtitle="Agregue múltiples productos y métodos de pago"
      accent="accent"
    >
      <div className="form-grid">
        {children}
        
        {/* MEJORA: Resumen financiero */}
        <div className="field col-12">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            marginBottom: '1rem',
            padding: '1rem',
            background: 'linear-gradient(135deg, var(--panel), var(--panel-2))',
            borderRadius: '8px',
            border: '1px solid var(--border)'
          }}>
            <Receipt sx={{ fontSize: 24, color: 'var(--brand)' }} />
            <label className="field-label" style={{ margin: 0, fontSize: '1.1rem' }}>
              Resumen Financiero
            </label>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              padding: '1.25rem',
              background: 'linear-gradient(135deg, #E8F5E8, #C8E6C9)',
              border: '2px solid #4CAF50',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.9rem', color: '#2E7D32', marginBottom: '0.5rem' }}>
                Neto
              </div>
              <div style={{ fontWeight: '600', color: '#2E7D32', fontSize: '1.2rem' }}>
                ${resumen.neto.toLocaleString('es-CL', { minimumFractionDigits: 2 })}
              </div>
            </div>
            
            <div style={{
              padding: '1.25rem',
              background: 'linear-gradient(135deg, #E3F2FD, #BBDEFB)',
              border: '2px solid #2196F3',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.9rem', color: '#1565C0', marginBottom: '0.5rem' }}>
                IVA (19%)
              </div>
              <div style={{ fontWeight: '600', color: '#1565C0', fontSize: '1.2rem' }}>
                ${resumen.iva.toLocaleString('es-CL', { minimumFractionDigits: 2 })}
              </div>
            </div>
            
            <div style={{
              padding: '1.25rem',
              background: 'linear-gradient(135deg, #FFF3E0, #FFE0B2)',
              border: '2px solid #FF9800',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.9rem', color: '#EF6C00', marginBottom: '0.5rem' }}>
                Comisión
              </div>
              <div style={{ fontWeight: '600', color: '#EF6C00', fontSize: '1.2rem' }}>
                ${resumen.comision.toLocaleString('es-CL', { minimumFractionDigits: 2 })}
              </div>
            </div>
            
            <div style={{
              padding: '1.25rem',
              background: 'linear-gradient(135deg, var(--brand), var(--brand-2))',
              border: '2px solid var(--brand)',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.9rem', color: 'white', marginBottom: '0.5rem' }}>
                Bruto
              </div>
              <div style={{ fontWeight: '600', color: 'white', fontSize: '1.2rem' }}>
                ${resumen.bruto.toLocaleString('es-CL', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>

        <div className="field col-6">
          <label className="field-label">
            <CalendarToday sx={{ fontSize: 20, marginRight: 1 }} />
            Fecha
          </label>
          <input 
            type="date" 
            value={formData.fecha}
            onChange={(e) => onFormChange('fecha', e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '2px solid var(--border)',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          />
        </div>

        <div className="field col-6">
          <label className="field-label">
            <AttachMoney sx={{ fontSize: 20, marginRight: 1 }} />
            Monto Total
          </label>
          <input 
            type="text" 
            value={`$ ${calcularTotal().toLocaleString('es-CL', { minimumFractionDigits: 2 })}`} 
            disabled 
            style={{
              background: 'linear-gradient(135deg, var(--success), #66BB6A)',
              color: 'white',
              fontWeight: '600',
              fontSize: '1.1rem'
            }}
          />
        </div>

        <div className="field col-12">
          <label className="field-label">
            <Description sx={{ fontSize: 20, marginRight: 1 }} />
            Observaciones (opcional)
          </label>
          <textarea 
            value={formData.observaciones}
            onChange={(e) => onFormChange('observaciones', e.target.value)}
            placeholder="Ingrese notas o comentarios adicionales sobre esta venta..."
            rows={4}
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '1rem',
              borderRadius: '8px',
              border: '2px solid var(--border)',
              background: 'var(--panel)',
              resize: 'vertical',
              fontFamily: 'inherit',
              transition: 'border-color 0.3s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--brand)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
          />
        </div>
      </div>

      <Toolbar>
        <Button onClick={onGuardar}>
          <AttachMoney sx={{ fontSize: 20 }} />
          Registrar Venta
        </Button>
        <Button variant="ghost" onClick={onGuardarYNuevo}>
          <Add sx={{ fontSize: 20 }} />
          Guardar y Nuevo
        </Button>
        <Button variant="ghost" onClick={onCancelar}>
          Cancelar
        </Button>
      </Toolbar>
    </Card>
  );
}