import React, { useState, useEffect } from 'react'
import { Card, Toolbar, Button, Table } from '../components/UI.jsx'
import { api } from '../services/api/index.js'

export default function Ingresos() {
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [metodosPago, setMetodosPago] = useState([])
  const [ventas, setVentas] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Actualiza el estado inicial con categoriaId
  const [formData, setFormData] = useState({
    idProducto: '',
    cantidad: 1,
    idMetodoPago: '',
    fecha: new Date().toISOString().split('T')[0],
    observaciones: '',
    categoriaId: '' // Nuevo campo para la categoría
  })

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      // Cargar uno por uno para identificar cuál falla
      const prods = await api.productos.getAll().catch(err => {
        console.error('Error cargando productos:', err)
        return []
      })
      
      const cats = await api.categorias.getAll().catch(err => {
        console.error('Error cargando categorías:', err)
        return []
      })
      
      const metodos = await api.metodosPago.getAll().catch(err => {
        console.error('Error cargando métodos pago:', err)
        return []
      })
      
      // Las ventas pueden fallar por referencias circulares
      const vents = await api.ventas.getAll().catch(err => {
        console.error('Error cargando ventas (esperado):', err)
        return []
      })
      
      setProductos(prods)
      setCategorias(cats)
      setMetodosPago(metodos)
      setVentas(vents)
    } catch (error) {
      console.error('Error general:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGuardar = async () => {
    if (!formData.idProducto || !formData.idMetodoPago) {
      alert('Por favor complete todos los campos requeridos')
      return
    }

    try {
      const producto = productos.find(p => p.idProducto === parseInt(formData.idProducto))
      const metodoPago = metodosPago.find(m => m.idMetodoPago === parseInt(formData.idMetodoPago))

      const ventaData = {
        fecha: new Date(formData.fecha).toISOString(),
        metodoPago: { idMetodoPago: parseInt(formData.idMetodoPago) },
        observaciones: formData.observaciones || "",
        detalles: [{
          producto: { idProducto: parseInt(formData.idProducto) },
          cantidad: parseInt(formData.cantidad),
          precioUnitario: parseFloat(producto.precio)
        }]
      }

      console.log('Enviando venta:', JSON.stringify(ventaData, null, 2))
      
      // Enviar la venta pero NO usar la respuesta porque tiene referencias circulares
      await fetch('http://localhost:8080/api/ventas', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(ventaData)
      }).then(r => {
        if (!r.ok) throw new Error(`Error ${r.status}`)
        // No parseamos el JSON, solo verificamos que fue exitoso
        return r
      })
      
      // Construir la venta localmente para mostrarla en la tabla
      const nuevaVenta = {
        fecha: new Date(formData.fecha).toISOString(),
        montoTotal: producto.precio * formData.cantidad,
        metodoPago: metodoPago,
        detalles: [{
          producto: producto,
          cantidad: formData.cantidad,
          precioUnitario: producto.precio
        }]
      }
      
      setVentas([...ventas, nuevaVenta])
      
      alert('Venta registrada exitosamente')
      
      setFormData({
        idProducto: '',
        cantidad: 1,
        idMetodoPago: '',
        fecha: new Date().toISOString().split('T')[0],
        observaciones: '',
        categoriaId: '' // Reiniciar categoriaId
      })
    } catch (error) {
      console.error('Error completo:', error)
      alert('Error al registrar la venta: ' + error.message)
    }
  }

  const handleGuardarYNuevo = async () => {
    await handleGuardar()
  }

  const handleCancelar = () => {
    setFormData({
      idProducto: '',
      cantidad: 1,
      idMetodoPago: '',
      fecha: new Date().toISOString().split('T')[0],
      observaciones: '',
      categoriaId: '' // Resetear también la categoría
    })
  }

  const incrementarCantidad = () => {
    setFormData({ ...formData, cantidad: formData.cantidad + 1 })
  }

  const decrementarCantidad = () => {
    if (formData.cantidad > 1) {
      setFormData({ ...formData, cantidad: formData.cantidad - 1 })
    }
  }

  const calcularTotal = () => {
    if (!formData.idProducto) return 0
    const producto = productos.find(p => p.idProducto === parseInt(formData.idProducto))
    return producto ? producto.precio * formData.cantidad : 0
  }

  const rows = ventas.slice(-10).reverse().map(v => {
    const primerProducto = v.detalles && v.detalles.length > 0 ? v.detalles[0].producto?.nombre : 'N/A'
    
    // Manejar fecha que viene como array [año, mes, día, hora, min, seg, nano]
    let fechaFormateada = 'N/A'
    if (v.fecha) {
      try {
        if (Array.isArray(v.fecha)) {
          // Convertir array a Date (mes en JS es 0-indexed, por eso restamos 1)
          const fecha = new Date(v.fecha[0], v.fecha[1] - 1, v.fecha[2])
          fechaFormateada = fecha.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })
        } else {
          // Si viene como string ISO
          const fecha = new Date(v.fecha)
          fechaFormateada = fecha.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })
        }
      } catch (e) {
        console.error('Error formateando fecha:', e)
      }
    }
    
    return [
      fechaFormateada,
      primerProducto,
      `$ ${(v.montoTotal || 0).toLocaleString('es-CL')}`,
      v.metodoPago?.nombre || 'Efectivo'
    ]
  })

  if (loading) {
    return <div className="stack large-text"><Card title="Cargando..."><p>Obteniendo datos...</p></Card></div>
  }

  return (
    <div className="stack large-text">
      <Card title="Registrar venta" subtitle="Registre una venta o ingreso monetario">
        <div className="form-grid">
          <div className="field col-6">
            <label className="field-label">Nombre del producto</label>
            <select 
              value={formData.idProducto}
              onChange={(e) => {
                const selectedProductId = e.target.value;
                if (selectedProductId) {
                  const producto = productos.find(p => p.idProducto === parseInt(selectedProductId));
                  // Actualiza el producto y la categoría asociada automáticamente
                  setFormData({
                    ...formData,
                    idProducto: selectedProductId,
                    categoriaId: producto?.categoria?.idCategoria || ''
                  });
                } else {
                  // Si no hay producto seleccionado, resetea categoría también
                  setFormData({
                    ...formData, 
                    idProducto: '',
                    categoriaId: ''
                  });
                }
              }}
            >
              <option value="">Seleccionar producto</option>
              {productos.map(p => (
                <option key={p.idProducto} value={p.idProducto}>
                  {p.nombre} - ${p.precio?.toLocaleString('es-CL')}
                </option>
              ))}
            </select>
          </div>

          <div className="field col-6">
            <label className="field-label">Categoría</label>
            <select 
              value={formData.categoriaId} 
              onChange={(e) => setFormData({ ...formData, categoriaId: e.target.value })}
              disabled={formData.idProducto !== ''}
            >
              <option value="">Seleccionar</option>
              {categorias.map(c => (
                <option key={c.idCategoria} value={c.idCategoria}>{c.nombre}</option>
              ))}
            </select>
          </div>

          <div className="field col-6">
            <label className="field-label">Monto</label>
            <input 
              type="text" 
              value={`$ ${calcularTotal().toLocaleString('es-CL')}`} 
              disabled 
            />
          </div>

          <div className="field col-6">
            <label className="field-label">Cantidad</label>
            <div>
              <Button variant="ghost" aria-label="Restar" onClick={decrementarCantidad}>−</Button>
              <input 
                type="number" 
                value={formData.cantidad} 
                onChange={(e) => setFormData({ ...formData, cantidad: parseInt(e.target.value) || 1 })}
                min={1} 
                step={1} 
                style={{ flex: 1, padding: '0 .6rem', borderRadius: 10, border: '1px solid var(--border)', fontSize: '1.05rem' }} 
              />
              <Button variant="ghost" aria-label="Sumar" onClick={incrementarCantidad}>+</Button>
            </div>
          </div>

          <div className="field col-6">
            <label className="field-label">Fecha</label>
            <input 
              type="date" 
              value={formData.fecha}
              onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
            />
          </div>

          <div className="field col-6">
            <label className="field-label">Tipo de pago</label>
            <select 
              value={formData.idMetodoPago}
              onChange={(e) => setFormData({ ...formData, idMetodoPago: e.target.value })}
            >
              <option value="">Seleccionar método</option>
              {metodosPago.map(m => (
                <option key={m.idMetodoPago} value={m.idMetodoPago}>{m.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        <Toolbar>
          <Button onClick={handleGuardar}>Guardar</Button>
          <Button variant="ghost" onClick={handleGuardarYNuevo}>Guardar y nuevo</Button>
          <Button variant="ghost" onClick={handleCancelar}>Cancelar</Button>
        </Toolbar>
      </Card>

      <Card title="Ingresos del mes" subtitle="Últimas ventas registradas">
        <Table columns={['Fecha', 'Detalle', 'Monto', 'Medio']} rows={rows} />
      </Card>
    </div>
  )
}