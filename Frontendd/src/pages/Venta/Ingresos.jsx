import React, { useState, useEffect } from 'react';
import { api } from '../../services/api/index.js';
import { Card, Button } from '../../components/UI.jsx';
import { 
  ShoppingCart, 
  Payment, 
  CheckCircle, 
  ArrowForward, 
  ArrowBack,
  CalendarToday,
  Description
} from '@mui/icons-material';
import ProductosVenta from '../Venta/ProductosVenta.jsx';
import MetodosPagoVenta from '../Venta/MetodosPagoVenta.jsx';
import ListaVentas from '../Venta/ListaVentas.jsx';
import ObservacionesModal from '../Venta/ventanas-modales/ObservacionesModal.jsx';
import DetallesProductosModal from '../Venta/ventanas-modales/DetallesProductosModal.jsx';

export default function Ingresos() {
  const [pasoActual, setPasoActual] = useState(1);
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
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
    observaciones: '',
    categoriaId: ''
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
      const [prods, cats, metodos, vents] = await Promise.all([
        api.productos.getAll().catch(() => []),
        api.categorias.getAll().catch(() => []),
        api.metodosPago.getAll().catch(() => []),
        api.ventas.getAll().catch(() => [])
      ]);
      
      setProductos(prods);
      setCategorias(cats);
      setMetodosPago(metodos);
      setVentas(vents);
    } catch (error) {
      console.error('Error general:', error);
    } finally {
      setLoading(false);
    }
  };

  // Funciones de productos
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

  // Funciones de métodos de pago
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

  // Validaciones por paso
  const validarPaso1 = () => {
    if (productosSeleccionados.length === 0) {
      alert('Debe agregar al menos un producto');
      return false;
    }
    const productoSinSeleccionar = productosSeleccionados.find(p => !p.idProducto);
    if (productoSinSeleccionar) {
      alert('Todos los productos deben estar seleccionados');
      return false;
    }
    const productoSinCantidad = productosSeleccionados.find(p => !p.cantidad || p.cantidad <= 0);
    if (productoSinCantidad) {
      alert('Todos los productos deben tener una cantidad mayor a 0');
      return false;
    }
    return true;
  };

  const validarPaso2 = () => {
    if (metodosPagoSeleccionados.length === 0) {
      alert('Debe agregar al menos un método de pago');
      return false;
    }
    const metodoSinSeleccionar = metodosPagoSeleccionados.find(m => !m.idMetodoPago);
    if (metodoSinSeleccionar) {
      alert('Todos los métodos de pago deben estar seleccionados');
      return false;
    }
    const totalAsignado = metodosPagoSeleccionados.reduce((sum, metodo) => 
      sum + (parseFloat(metodo.montoAsignado) || 0), 0
    );
    const total = calcularTotal();
    if (Math.abs(totalAsignado - total) > 0.01) {
      alert(`La suma de los montos asignados debe ser igual al total de la venta`);
      return false;
    }
    return true;
  };

  const siguientePaso = async () => {
    if (pasoActual === 1 && !validarPaso1()) return;
    if (pasoActual === 2 && !validarPaso2()) return;
    
    // Validar stock antes de pasar al paso 2
    if (pasoActual === 1) {
      for (const item of productosSeleccionados) {
        const stockValido = await validarStock(item.idProducto, item.cantidad);
        if (!stockValido) {
          const producto = productos.find(p => p.idProducto === parseInt(item.idProducto));
          alert(`Stock insuficiente para: ${producto?.nombre}`);
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
      alert('Venta registrada exitosamente');
      
      // Resetear
      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        observaciones: '',
        categoriaId: ''
      });
      setProductosSeleccionados([]);
      setMetodosPagoSeleccionados([]);
      setPasoActual(1);
      
      await cargarDatos();
    } catch (error) {
      console.error('Error al registrar venta:', error);
      alert('Error al registrar la venta');
    }
  };

  const handleCancelar = () => {
    if (window.confirm('¿Desea cancelar la venta? Se perderán todos los datos')) {
      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        observaciones: '',
        categoriaId: ''
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

  const pasos = [
    { numero: 1, titulo: 'Productos', icono: <ShoppingCart /> },
    { numero: 2, titulo: 'Métodos de Pago', icono: <Payment /> },
    { numero: 3, titulo: 'Confirmar', icono: <CheckCircle /> }
  ];

  if (loading && ventas.length === 0) {
    return (
      <div className="stack" style={{ padding: '1rem' }}>
        <Card title="Cargando Ventas">
          <div className="loading">
            <p>Cargando datos de ventas...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="stack" style={{ padding: '1rem', gap: '1rem' }}>
      <Card 
        title="Registrar Nueva Venta" 
        subtitle="Complete los pasos para registrar una venta"
        accent="accent"
      >
        {/* INDICADOR DE PASOS */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          position: 'relative'
        }}>
          {/* Línea de progreso */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '10%',
            right: '10%',
            height: '3px',
            background: 'var(--border)',
            zIndex: 0
          }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, var(--brand), var(--brand-2))',
              width: `${((pasoActual - 1) / 2) * 100}%`,
              transition: 'width 0.3s ease'
            }} />
          </div>

          {pasos.map((paso) => (
            <div key={paso.numero} style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
              zIndex: 1
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: pasoActual >= paso.numero 
                  ? 'linear-gradient(135deg, var(--brand), var(--brand-2))' 
                  : 'var(--panel)',
                border: `3px solid ${pasoActual >= paso.numero ? 'var(--brand)' : 'var(--border)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: pasoActual >= paso.numero ? 'white' : 'var(--muted)',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                marginBottom: '0.5rem'
              }}>
                {React.cloneElement(paso.icono, { sx: { fontSize: 20 } })}
              </div>
              <span style={{
                fontSize: '0.85rem',
                fontWeight: pasoActual === paso.numero ? '600' : '400',
                color: pasoActual >= paso.numero ? 'var(--brand)' : 'var(--muted)',
                textAlign: 'center'
              }}>
                {paso.titulo}
              </span>
            </div>
          ))}
        </div>

        {/* CONTENIDO DEL PASO */}
        <div style={{ minHeight: '400px' }}>
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
            <div style={{ padding: '1rem' }}>
              <h3 style={{ marginTop: 0 }}>Resumen de la Venta</h3>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}>
                  <CalendarToday sx={{ fontSize: 18 }} />
                  Fecha
                </label>
                <input 
                  type="date" 
                  value={formData.fecha}
                  onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    border: '2px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}>
                  <Description sx={{ fontSize: 18 }} />
                  Observaciones
                </label>
                <textarea 
                  value={formData.observaciones}
                  onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                  placeholder="Notas adicionales..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    border: '2px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{
                background: 'linear-gradient(135deg, var(--panel), var(--panel-2))',
                border: '2px solid var(--border)',
                borderRadius: '12px',
                padding: '1.5rem'
              }}>
                <h4 style={{ marginTop: 0 }}>Productos ({productosSeleccionados.length})</h4>
                {productosSeleccionados.map((item, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0',
                    borderBottom: i < productosSeleccionados.length - 1 ? '1px solid var(--border)' : 'none'
                  }}>
                    <span>{item.producto?.nombre} x{item.cantidad}</span>
                    <span style={{ fontWeight: '600' }}>
                      ${Math.round(calcularSubtotalProducto(item)).toLocaleString('es-CL')}
                    </span>
                  </div>
                ))}
                
                <div style={{
                  marginTop: '1rem',
                  paddingTop: '1rem',
                  borderTop: '2px solid var(--brand)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '1.2rem',
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

        {/* BOTONES DE NAVEGACIÓN */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '2rem',
          paddingTop: '1rem',
          borderTop: '2px solid var(--border)'
        }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {pasoActual > 1 && (
              <Button variant="ghost" onClick={pasoAnterior}>
                <ArrowBack sx={{ fontSize: 20 }} />
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
                <ArrowForward sx={{ fontSize: 20 }} />
              </Button>
            ) : (
              <Button onClick={handleGuardar}>
                <CheckCircle sx={{ fontSize: 20 }} />
                Registrar Venta
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