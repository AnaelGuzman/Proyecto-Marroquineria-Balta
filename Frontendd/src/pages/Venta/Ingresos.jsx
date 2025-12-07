import React, { useState, useEffect } from 'react';
import { api } from '../../services/api/index.js';
import { Card, Button } from '../../components/UI.jsx';
import { 
  ShoppingCart, 
  Payment, 
  CheckCircle, 
  ArrowForward, 
  ArrowBack
} from '@mui/icons-material';
import ProductosVenta from '../Venta/ProductosVenta.jsx';
import MetodosPagoVenta from '../Venta/MetodosPagoVenta.jsx';
import ListaVentas from '../Venta/ListaVentas.jsx';
import ObservacionesModal from '../Venta/ventanas-modales/ObservacionesModal.jsx';
import DetallesProductosModal from '../Venta/ventanas-modales/DetallesProductosModal.jsx';

export default function Ingresos() {
  const [pasoActual, setPasoActual] = useState(1);
  const [productos, setProductos] = useState([]);
  const [metodosPago, setMetodosPago] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [observacionesModal, setObservacionesModal] = useState(null);
  const [detallesModal, setDetallesModal] = useState(null);
  
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [metodosPagoSeleccionados, setMetodosPagoSeleccionados] = useState([]);
  const [montoRestante, setMontoRestante] = useState(0);

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    observaciones: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    const total = calcularTotal();
    const totalAsignado = metodosPagoSeleccionados.reduce((sum, metodo) => 
      sum + (parseFloat(metodo.montoAsignado) || 0), 0
    );
    setMontoRestante(total - totalAsignado);
  }, [productosSeleccionados, metodosPagoSeleccionados]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [prods, metodos, vents] = await Promise.all([
        api.productos.getAll().catch(() => []),
        api.metodosPago.getAll().catch(() => []),
        api.ventas.getAll().catch(() => [])
      ]);
      
      setProductos(prods);
      setMetodosPago(metodos);
      setVentas(vents);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const agregarProducto = () => {
    setProductosSeleccionados(prev => [
      ...prev,
      { idProducto: '', cantidad: 1, precioUnitario: 0, producto: null }
    ]);
  };

  const actualizarProducto = (index, campo, valor) => {
    setProductosSeleccionados(prev => 
      prev.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [campo]: valor };
          if (campo === 'idProducto' && valor) {
            const productoSeleccionado = productos.find(p => p.idProducto === parseInt(valor));
            if (productoSeleccionado) {
              updatedItem.precioUnitario = productoSeleccionado.precio;
              updatedItem.producto = productoSeleccionado;
            }
          }
          return updatedItem;
        }
        return item;
      })
    );
  };

  const eliminarProducto = (index) => {
    setProductosSeleccionados(prev => prev.filter((_, i) => i !== index));
  };

  const incrementarCantidad = (index) => {
    setProductosSeleccionados(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, cantidad: (item.cantidad || 0) + 1 } : item
      )
    );
  };

  const decrementarCantidad = (index) => {
    setProductosSeleccionados(prev => 
      prev.map((item, i) => 
        i === index && item.cantidad > 1 ? { ...item, cantidad: item.cantidad - 1 } : item
      )
    );
  };

  const agregarMetodoPago = () => {
    setMetodosPagoSeleccionados(prev => [
      ...prev,
      { idMetodoPago: '', montoAsignado: 0 }
    ]);
  };

  const actualizarMetodoPago = (index, campo, valor) => {
    setMetodosPagoSeleccionados(prev => 
      prev.map((metodo, i) => 
        i === index ? { ...metodo, [campo]: valor } : metodo
      )
    );
  };

  const eliminarMetodoPago = (index) => {
    setMetodosPagoSeleccionados(prev => prev.filter((_, i) => i !== index));
  };

  const distribuirMontos = () => {
    const total = calcularTotal();
    if (metodosPagoSeleccionados.length === 0) return;
    const montoPorMetodo = total / metodosPagoSeleccionados.length;
    setMetodosPagoSeleccionados(prev =>
      prev.map(metodo => ({
        ...metodo,
        montoAsignado: Math.round(montoPorMetodo * 100) / 100
      }))
    );
  };

  const calcularTotal = () => {
    return productosSeleccionados.reduce((total, item) => {
      const subtotal = (item.precioUnitario || 0) * (item.cantidad || 0);
      return total + subtotal;
    }, 0);
  };

  const calcularSubtotalProducto = (producto) => {
    return (producto.precioUnitario || 0) * (producto.cantidad || 0);
  };

  const validarStock = async (idProducto, cantidadRequerida) => {
    try {
      const inventario = await api.inventario.getPorProducto(idProducto);
      const stockDisponible = inventario?.cantidadProducto || 0;
      return stockDisponible >= cantidadRequerida;
    } catch (error) {
      console.error('Error al validar stock:', error);
      return false;
    }
  };

  const validarPaso1 = () => {
    if (productosSeleccionados.length === 0) {
      alert('⚠️ Agregue al menos un producto');
      return false;
    }
    if (productosSeleccionados.find(p => !p.idProducto)) {
      alert('⚠️ Seleccione todos los productos');
      return false;
    }
    if (productosSeleccionados.find(p => !p.cantidad || p.cantidad <= 0)) {
      alert('⚠️ Cantidad debe ser mayor a 0');
      return false;
    }
    return true;
  };

  const validarPaso2 = () => {
    if (metodosPagoSeleccionados.length === 0) {
      alert('⚠️ Agregue al menos un método de pago');
      return false;
    }
    if (metodosPagoSeleccionados.find(m => !m.idMetodoPago)) {
      alert('⚠️ Seleccione todos los métodos');
      return false;
    }
    const totalAsignado = metodosPagoSeleccionados.reduce((sum, metodo) => 
      sum + (parseFloat(metodo.montoAsignado) || 0), 0
    );
    const total = calcularTotal();
    if (Math.abs(totalAsignado - total) > 0.01) {
      alert('⚠️ La suma debe ser igual al total');
      return false;
    }
    return true;
  };

  const siguientePaso = async () => {
    if (pasoActual === 1 && !validarPaso1()) return;
    if (pasoActual === 2 && !validarPaso2()) return;
    
    if (pasoActual === 1) {
      for (const item of productosSeleccionados) {
        const stockValido = await validarStock(item.idProducto, item.cantidad);
        if (!stockValido) {
          const producto = productos.find(p => p.idProducto === parseInt(item.idProducto));
          alert(`❌ Stock insuficiente: ${producto?.nombre}`);
          return;
        }
      }
    }
    
    setPasoActual(prev => Math.min(prev + 1, 3));
  };

  const pasoAnterior = () => {
    setPasoActual(prev => Math.max(prev - 1, 1));
  };

  const handleGuardar = async () => {
    try {
      const ventaData = {
        fecha: new Date(formData.fecha).toISOString(),
        observaciones: formData.observaciones || "",
        detalles: productosSeleccionados.map(item => ({
          producto: { idProducto: parseInt(item.idProducto) },
          cantidad: parseInt(item.cantidad),
          precioUnitario: parseFloat(item.precioUnitario),
          subtotal: calcularSubtotalProducto(item)
        })),
        metodosPago: metodosPagoSeleccionados.map(metodo => ({
          metodoPago: { idMetodoPago: parseInt(metodo.idMetodoPago) },
          montoAsignado: parseFloat(metodo.montoAsignado)
        }))
      };

      await api.ventas.registrar(ventaData);
      alert('✅ Venta registrada');
      
      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        observaciones: ''
      });
      setProductosSeleccionados([]);
      setMetodosPagoSeleccionados([]);
      setPasoActual(1);
      
      await cargarDatos();
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al registrar');
    }
  };

  const handleCancelar = () => {
    if (window.confirm('¿Cancelar? Se perderán los datos')) {
      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        observaciones: ''
      });
      setProductosSeleccionados([]);
      setMetodosPagoSeleccionados([]);
      setPasoActual(1);
    }
  };

  const formatearFecha = (fechaData) => {
    try {
      let fecha;
      if (Array.isArray(fechaData)) {
        fecha = new Date(fechaData[0], fechaData[1] - 1, fechaData[2]);
      } else if (typeof fechaData === 'string') {
        fecha = new Date(fechaData);
      } else if (fechaData instanceof Date) {
        fecha = fechaData;
      } else {
        return 'Fecha inválida';
      }
      if (isNaN(fecha.getTime())) return 'Fecha inválida';
      return fecha.toLocaleDateString('es-CL', { 
        day: '2-digit', month: 'short', year: 'numeric' 
      });
    } catch (e) {
      return 'Fecha inválida';
    }
  };

  if (loading && ventas.length === 0) {
    return (
      <div className="stack" style={{ padding: '0.75rem' }}>
        <Card>
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
            Cargando...
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="stack" style={{ padding: '0.75rem', gap: '0.75rem' }}>
      <Card>
        {/* INDICADOR DE PASOS SIMPLE */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          borderBottom: '2px solid var(--border)',
          paddingBottom: '0'
        }}>
          <button
            onClick={() => pasoActual > 1 && setPasoActual(1)}
            disabled={pasoActual === 1}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: pasoActual === 1 ? 'var(--brand)' : 'transparent',
              color: pasoActual === 1 ? 'white' : 'var(--text)',
              border: 'none',
              cursor: pasoActual === 1 ? 'default' : 'pointer',
              fontSize: '0.9rem',
              fontWeight: '600',
              borderRadius: '8px 8px 0 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              opacity: pasoActual < 1 ? 0.5 : 1
            }}
          >
            <ShoppingCart sx={{ fontSize: 18 }} />
            Productos
          </button>
          <button
            onClick={() => pasoActual > 2 && setPasoActual(2)}
            disabled={pasoActual <= 1}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: pasoActual === 2 ? 'var(--brand)' : 'transparent',
              color: pasoActual === 2 ? 'white' : 'var(--text)',
              border: 'none',
              cursor: pasoActual === 2 ? 'default' : pasoActual > 2 ? 'pointer' : 'not-allowed',
              fontSize: '0.9rem',
              fontWeight: '600',
              borderRadius: '8px 8px 0 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              opacity: pasoActual < 2 ? 0.5 : 1
            }}
          >
            <Payment sx={{ fontSize: 18 }} />
            Pago
          </button>
          <button
            disabled
            style={{
              flex: 1,
              padding: '0.75rem',
              background: pasoActual === 3 ? 'var(--brand)' : 'transparent',
              color: pasoActual === 3 ? 'white' : 'var(--text)',
              border: 'none',
              cursor: 'default',
              fontSize: '0.9rem',
              fontWeight: '600',
              borderRadius: '8px 8px 0 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              opacity: pasoActual < 3 ? 0.5 : 1
            }}
          >
            <CheckCircle sx={{ fontSize: 18 }} />
            Confirmar
          </button>
        </div>

        {/* CONTENIDO */}
        <div style={{ minHeight: '250px' }}>
          {pasoActual === 1 && (
            <ProductosVenta
              productos={productos}
              productosSeleccionados={productosSeleccionados}
              onAgregarProducto={agregarProducto}
              onActualizarProducto={actualizarProducto}
              onEliminarProducto={eliminarProducto}
              onIncrementarCantidad={incrementarCantidad}
              onDecrementarCantidad={decrementarCantidad}
              calcularSubtotalProducto={calcularSubtotalProducto}
              calcularTotal={calcularTotal}
            />
          )}

          {pasoActual === 2 && (
            <MetodosPagoVenta
              metodosPago={metodosPago}
              metodosPagoSeleccionados={metodosPagoSeleccionados}
              montoRestante={montoRestante}
              calcularTotal={calcularTotal}
              onAgregarMetodoPago={agregarMetodoPago}
              onActualizarMetodoPago={actualizarMetodoPago}
              onEliminarMetodoPago={eliminarMetodoPago}
              onDistribuirMontos={distribuirMontos}
            />
          )}

          {pasoActual === 3 && (
            <div style={{ padding: '0.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.85rem' }}>
                  Fecha
                </label>
                <input 
                  type="date" 
                  value={formData.fecha}
                  onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '2px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.85rem' }}>
                  Observaciones
                </label>
                <textarea 
                  value={formData.observaciones}
                  onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                  placeholder="Notas opcionales..."
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '2px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{
                background: 'var(--panel-2)',
                border: '2px solid var(--border)',
                borderRadius: '8px',
                padding: '1rem'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                  Productos ({productosSeleccionados.length})
                </div>
                {productosSeleccionados.map((item, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0',
                    fontSize: '0.85rem',
                    borderBottom: i < productosSeleccionados.length - 1 ? '1px solid var(--border)' : 'none'
                  }}>
                    <span>{item.producto?.nombre} x{item.cantidad}</span>
                    <span style={{ fontWeight: '600' }}>
                      ${Math.round(calcularSubtotalProducto(item)).toLocaleString('es-CL')}
                    </span>
                  </div>
                ))}
                
                <div style={{
                  marginTop: '0.75rem',
                  paddingTop: '0.75rem',
                  borderTop: '2px solid var(--brand)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: 'var(--brand)'
                }}>
                  <span>Total</span>
                  <span>${Math.round(calcularTotal()).toLocaleString('es-CL')}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BOTONES */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '1rem',
          paddingTop: '1rem',
          borderTop: '2px solid var(--border)'
        }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {pasoActual > 1 && (
              <Button variant="ghost" onClick={pasoAnterior}>
                <ArrowBack sx={{ fontSize: 16 }} />
                Anterior
              </Button>
            )}
            <Button variant="ghost" onClick={handleCancelar}>
              Cancelar
            </Button>
          </div>

          <div>
            {pasoActual < 3 ? (
              <Button onClick={siguientePaso}>
                Siguiente
                <ArrowForward sx={{ fontSize: 16 }} />
              </Button>
            ) : (
              <Button onClick={handleGuardar}>
                <CheckCircle sx={{ fontSize: 16 }} />
                Guardar
              </Button>
            )}
          </div>
        </div>
      </Card>

      <ListaVentas
        ventas={ventas}
        formatearFecha={formatearFecha}
        onVerObservaciones={setObservacionesModal}
        onVerDetalles={setDetallesModal}
      />

      {observacionesModal && (
        <ObservacionesModal 
          observaciones={observacionesModal} 
          onClose={() => setObservacionesModal(null)} 
        />
      )}

      {detallesModal && (
        <DetallesProductosModal 
          detalles={detallesModal} 
          onClose={() => setDetallesModal(null)} 
        />
      )}
    </div>
  );
}