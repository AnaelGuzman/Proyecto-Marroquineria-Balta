import React from 'react';
import { Card, Table, Button } from '../../components/UI.jsx';
import { ShoppingCart } from '@mui/icons-material';

export default function ListaVentas({ 
  ventas, 
  formatearFecha, 
  onVerObservaciones, 
  onVerDetalles 
}) {
  
  const obtenerMetodosPagoVenta = (venta) => {
    if (venta.metodosPago && venta.metodosPago.length > 0) {
      return venta.metodosPago.map(mp => 
        `${mp.metodoPago?.nombre}: $${mp.montoAsignado?.toLocaleString('es-CL', { minimumFractionDigits: 2 })}`
      ).join(', ');
    }
    return 'Sin métodos de pago';
  };

  const obtenerProductosVenta = (venta) => {
    if (venta.detalles && venta.detalles.length > 0) {
      if (venta.detalles.length === 1) {
        const detalle = venta.detalles[0];
        return (
          <div style={{ fontWeight: '600', color: 'var(--text)' }}>
            {detalle.producto?.nombre} ({detalle.cantidad})
          </div>
        );
      } else {
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>{venta.detalles.length} productos</span>
            <Button 
              variant="ghost" 
              small 
              onClick={() => onVerDetalles(venta.detalles)}
              style={{ 
                padding: '0.25rem 0.5rem',
                fontSize: '0.8rem'
              }}
            >
              📋 Ver
            </Button>
          </div>
        );
      }
    }
    return <span style={{ color: 'var(--muted)' }}>Sin productos</span>;
  };

  return (
    <Card 
      title="Ventas Recientes" 
      subtitle="Últimas ventas registradas en el sistema"
    >
      <Table 
        columns={[
          "Fecha", 
          "Productos", 
          "Neto", 
          "IVA", 
          "Comisión", 
          "Bruto", 
          "Métodos de Pago", 
          "Observaciones"
        ]} 
        rows={ventas.slice(-10).reverse().map(venta => [
          formatearFecha(venta.fecha),
          obtenerProductosVenta(venta),
          <div key={venta.idVenta} style={{ textAlign: 'right', color: 'var(--text)' }}>
            ${venta.montoNeto?.toLocaleString('es-CL', { minimumFractionDigits: 2 }) || '0.00'}
          </div>,
          <div key={venta.idVenta} style={{ textAlign: 'right', color: 'var(--muted)' }}>
            ${venta.ivaTotal?.toLocaleString('es-CL', { minimumFractionDigits: 2 }) || '0.00'}
          </div>,
          <div key={venta.idVenta} style={{ textAlign: 'right', color: 'var(--muted)' }}>
            ${venta.comisionTotal?.toLocaleString('es-CL', { minimumFractionDigits: 2 }) || '0.00'}
          </div>,
          <div key={venta.idVenta} style={{ 
            textAlign: 'right', 
            color: 'var(--brand)', 
            fontWeight: '600',
            fontSize: '1.05rem'
          }}>
            ${venta.montoBruto?.toLocaleString('es-CL', { minimumFractionDigits: 2 }) || '0.00'}
          </div>,
          <div key={venta.idVenta} style={{ 
            color: 'var(--text)',
            fontSize: '0.9rem',
            lineHeight: '1.4'
          }}>
            {obtenerMetodosPagoVenta(venta)}
          </div>,
          venta.observaciones && venta.observaciones.trim() !== '' ? (
            <Button 
              variant="ghost" 
              small 
              onClick={() => onVerObservaciones(venta.observaciones)}
              style={{ padding: '0.25rem 0.75rem' }}
            >
              📝 Ver
            </Button>
          ) : <span style={{ color: 'var(--muted)' }}>—</span>
        ])}
      />
    </Card>
  );
}