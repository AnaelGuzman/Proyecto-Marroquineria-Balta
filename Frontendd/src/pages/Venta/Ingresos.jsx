import React, { useState, useEffect } from 'react';
import { api } from '../../services/api/index.js';
import { Card } from '../../components/UI.jsx';
import ProductosVenta from '../Venta/ProductosVenta.jsx';
import MetodosPagoVenta from '../Venta/MetodosPagoVenta.jsx';
import FormularioVenta from '../Venta/FormularioVenta.jsx';
import ListaVentas from '../Venta/ListaVentas.jsx';
import ObservacionesModal from '../Venta/ventanas-modales/ObservacionesModal.jsx';
import DetallesProductosModal from '../Venta/ventanas-modales/DetallesProductosModal.jsx';

export default function Ingresos() {
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
      { 
        idProducto: '', 
        cantidad: 1, 
        precioUnitario: 0,
        producto: null 
      }
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

  // Cálculos
  const calcularTotal = () => {
    return productosSeleccionados.reduce((total, item) => {
      const subtotal = (item.precioUnitario || 0) * (item.cantidad || 0);
      return total + subtotal;
    }, 0);
  };

  const calcularSubtotalProducto = (producto) => {
    return (producto.precioUnitario || 0) * (producto.cantidad || 0);
  };

  // Validaciones
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

  // Guardar venta
  const handleGuardar = async () => {
    if (productosSeleccionados.length === 0 || metodosPagoSeleccionados.length === 0) {
      alert('Debe agregar al menos un producto y un método de pago');
      return;
    }

    const productoSinSeleccionar = productosSeleccionados.find(p => !p.idProducto);
    if (productoSinSeleccionar) {
      alert('Todos los productos deben estar seleccionados');
      return;
    }

    const productoSinCantidad = productosSeleccionados.find(p => !p.cantidad || p.cantidad <= 0);
    if (productoSinCantidad) {
      alert('Todos los productos deben tener una cantidad mayor a 0');
      return;
    }

    for (const item of productosSeleccionados) {
      const stockValido = await validarStock(item.idProducto, item.cantidad);
      if (!stockValido) {
        const producto = productos.find(p => p.idProducto === parseInt(item.idProducto));
        alert(`Stock insuficiente para: ${producto?.nombre}. Cantidad requerida: ${item.cantidad}`);
        return;
      }
    }

    const metodoSinSeleccionar = metodosPagoSeleccionados.find(m => !m.idMetodoPago);
    if (metodoSinSeleccionar) {
      alert('Todos los métodos de pago deben estar seleccionados');
      return;
    }

    const totalAsignado = metodosPagoSeleccionados.reduce((sum, metodo) => 
      sum + (parseFloat(metodo.montoAsignado) || 0), 0
    );
    const total = calcularTotal();

    if (Math.abs(totalAsignado - total) > 0.01) {
      alert(`La suma de los montos asignados ($${totalAsignado.toLocaleString('es-CL', { minimumFractionDigits: 2 })}) debe ser igual al total de la venta ($${total.toLocaleString('es-CL', { minimumFractionDigits: 2 })})`);
      return;
    }

    const metodoSinMonto = metodosPagoSeleccionados.find(m => !m.montoAsignado || m.montoAsignado <= 0);
    if (metodoSinMonto) {
      alert('Todos los métodos de pago deben tener un monto mayor a 0');
      return;
    }

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
      
      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        observaciones: '',
        categoriaId: ''
      });
      setProductosSeleccionados([]);
      setMetodosPagoSeleccionados([]);
      
      await cargarDatos();
    } catch (error) {
      console.error('Error al registrar venta:', error);
      alert('Error al registrar la venta: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleGuardarYNuevo = async () => {
    await handleGuardar();
  };

  const handleCancelar = () => {
    setFormData({
      fecha: new Date().toISOString().split('T')[0],
      observaciones: '',
      categoriaId: ''
    });
    setProductosSeleccionados([]);
    setMetodosPagoSeleccionados([]);
  };

  const handleFormChange = (campo, valor) => {
    setFormData(prev => ({ ...prev, [campo]: valor }));
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

      if (isNaN(fecha.getTime())) {
        return 'Fecha inválida';
      }

      return fecha.toLocaleDateString('es-CL', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      });
    } catch (e) {
      return 'Fecha inválida';
    }
  };

  if (loading && ventas.length === 0) {
    return (
      <div className="stack">
        <Card title="Cargando Ventas">
          <div className="loading">
            <p>Cargando datos de ventas...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="stack">
      <FormularioVenta
        formData={formData}
        onFormChange={handleFormChange}
        onGuardar={handleGuardar}
        onGuardarYNuevo={handleGuardarYNuevo}
        onCancelar={handleCancelar}
        calcularTotal={calcularTotal}
        metodosPagoSeleccionados={metodosPagoSeleccionados}
        metodosPago={metodosPago}
      >
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
      </FormularioVenta>

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