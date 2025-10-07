import React, { useState, useEffect } from 'react'
import { Card, Field, Toolbar, Button, Table } from '../components/UI.jsx'
import { api } from '../services/api/index.js'

export default function Egresos() {
  const [compras, setCompras] = useState([])
  const [gastos, setGastos] = useState([])
  const [metodosPago, setMetodosPago] = useState([])
  const [loading, setLoading] = useState(true)
  const [tipoEgreso, setTipoEgreso] = useState('compra')
  
  const [formCompra, setFormCompra] = useState({
    descripcion: '',
    cantidad: 1,
    precioUnitario: 0,
    idMetodoPago: '',
    fecha: new Date().toISOString().split('T')[0],
    observaciones: ''
  })

  const [formGasto, setFormGasto] = useState({
    descripcion: '',
    monto: 0,
    idMetodoPago: '',
    fecha: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      const [comps, gast, metodos] = await Promise.all([
        api.compras.getAll().catch(() => []),
        api.gastos.getAll().catch(() => []),
        api.metodosPago.getAll().catch(() => [])
      ])
      setCompras(comps)
      setGastos(gast)
      setMetodosPago(metodos)
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGuardarCompra = async () => {
    if (!formCompra.descripcion || !formCompra.idMetodoPago || formCompra.precioUnitario <= 0) {
      alert('Por favor complete todos los campos requeridos')
      return
    }

    try {
      const compraData = {
        fecha: new Date(formCompra.fecha).toISOString(),
        metodoPago: { 
          idMetodoPago: parseInt(formCompra.idMetodoPago) 
        },
        observaciones: formCompra.observaciones || "",
        detalles: [{
          descripcion: formCompra.descripcion,
          cantidad: parseInt(formCompra.cantidad),
          precioUnitario: parseFloat(formCompra.precioUnitario)
        }]
      }

      console.log('Enviando compra:', JSON.stringify(compraData, null, 2))

      await fetch('http://localhost:8080/api/compras', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(compraData)
      }).then(r => {
        if (!r.ok) throw new Error(`Error ${r.status}`)
        return r
      })

      alert('Compra registrada exitosamente')

      setFormCompra({
        descripcion: '',
        cantidad: 1,
        precioUnitario: 0,
        idMetodoPago: '',
        fecha: new Date().toISOString().split('T')[0],
        observaciones: ''
      })

      cargarDatos()
    } catch (error) {
      console.error('Error completo:', error)
      alert('Error al registrar la compra: ' + error.message)
    }
  }

  const handleGuardarGasto = async () => {
    if (!formGasto.descripcion || !formGasto.idMetodoPago || formGasto.monto <= 0) {
      alert('Por favor complete todos los campos requeridos')
      return
    }

    try {
      const gastoData = {
        fecha: new Date(formGasto.fecha).toISOString(),
        monto: parseFloat(formGasto.monto),
        metodoPago: { idMetodoPago: parseInt(formGasto.idMetodoPago) },
        descripcion: formGasto.descripcion
      }

      console.log('Enviando gasto:', JSON.stringify(gastoData, null, 2))
      
      await api.gastos.registrar(gastoData)
      alert('Gasto registrado exitosamente')
      
      setFormGasto({
        descripcion: '',
        monto: 0,
        idMetodoPago: '',
        fecha: new Date().toISOString().split('T')[0]
      })
      cargarDatos()
    } catch (error) {
      console.error('Error al registrar gasto:', error)
      alert('Error al registrar el gasto: ' + error.message)
    }
  }

  const handleCancelar = () => {
    if (tipoEgreso === 'compra') {
      setFormCompra({
        descripcion: '',
        cantidad: 1,
        precioUnitario: 0,
        idMetodoPago: '',
        fecha: new Date().toISOString().split('T')[0],
        observaciones: ''
      })
    } else {
      setFormGasto({
        descripcion: '',
        monto: 0,
        idMetodoPago: '',
        fecha: new Date().toISOString().split('T')[0]
      })
    }
  }

  const incrementarCantidad = () => {
    setFormCompra({ ...formCompra, cantidad: formCompra.cantidad + 1 })
  }

  const decrementarCantidad = () => {
    if (formCompra.cantidad > 1) {
      setFormCompra({ ...formCompra, cantidad: formCompra.cantidad - 1 })
    }
  }

  // Combinar compras y gastos para la tabla - SIMPLIFICADO
  const rowsEgresos = [...compras, ...gastos]
    .sort((a, b) => {
      const fechaA = Array.isArray(a.fecha) ? new Date(a.fecha[0], a.fecha[1] - 1, a.fecha[2]) : new Date(a.fecha)
      const fechaB = Array.isArray(b.fecha) ? new Date(b.fecha[0], b.fecha[1] - 1, b.fecha[2]) : new Date(b.fecha)
      return fechaB - fechaA
    })
    .slice(0, 10)
    .map(item => {
      const esCompra = item.montoTotal !== undefined
      
      // Formatear fecha
      let fechaFormateada = 'N/A'
      if (item.fecha) {
        if (Array.isArray(item.fecha)) {
          const fecha = new Date(item.fecha[0], item.fecha[1] - 1, item.fecha[2])
          fechaFormateada = fecha.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })
        } else {
          const fecha = new Date(item.fecha)
          fechaFormateada = fecha.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })
        }
      }

      // Monto total (lo que se pagó)
      const monto = esCompra 
        ? Math.round(item.montoTotal || 0)
        : Math.round(item.monto || 0)
      
      return [
        fechaFormateada,
        esCompra 
          ? (item.detalles && item.detalles.length > 0 ? item.detalles[0].descripcion : 'Compra')
          : item.descripcion,
        `$ ${monto.toLocaleString('es-CL')}`,
        item.metodoPago?.nombre || 'N/A'
      ]
    })

  if (loading) {
    return <div className="stack"><Card title="Cargando..."><p>Obteniendo datos...</p></Card></div>
  }

  return (
    <div className="stack">
      <Card title="Registrar egreso" subtitle="Registra una compra o gasto">
        <div style={{ marginBottom: '1rem' }}>
          <label className="field-label">Tipo de egreso</label>
          <select value={tipoEgreso} onChange={(e) => setTipoEgreso(e.target.value)}>
            <option value="compra">Compra de insumos/productos</option>
            <option value="gasto">Gasto general</option>
          </select>
        </div>

        {tipoEgreso === 'compra' ? (
          <div className="form-grid">
            <div className="field col-6">
              <label className="field-label">Descripción del producto</label>
              <input 
                type="text" 
                placeholder='Ej: Cuero vaqueta 3mm, Hilo encerado' 
                value={formCompra.descripcion}
                onChange={(e) => setFormCompra({ ...formCompra, descripcion: e.target.value })}
              />
            </div>
            <div className="field col-6">
              <label className="field-label">Categoría</label>
              <select defaultValue="">
                <option value="">Seleccionar</option>
                <option value="ins">Compra de insumos</option>
                <option value="mkt">Publicidad/Marketing</option>
                <option value="otr">Otros</option>
              </select>
            </div>

            <div className="field col-6">
              <label className="field-label">Precio unitario</label>
              <input 
                type="number" 
                placeholder="$ 0" 
                min={0} 
                step={100} 
                value={formCompra.precioUnitario}
                onChange={(e) => setFormCompra({ ...formCompra, precioUnitario: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="field col-6">
              <label className="field-label">Cantidad</label>
              <div>
                <Button variant="ghost" aria-label="Restar" onClick={decrementarCantidad}>−</Button>
                <input 
                  type="number" 
                  value={formCompra.cantidad} 
                  onChange={(e) => setFormCompra({ ...formCompra, cantidad: parseInt(e.target.value) || 1 })}
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
                value={formCompra.fecha}
                onChange={(e) => setFormCompra({ ...formCompra, fecha: e.target.value })}
              />
            </div>
            <div className="field col-6">
              <label className="field-label">Tipo de pago</label>
              <select 
                value={formCompra.idMetodoPago}
                onChange={(e) => setFormCompra({ ...formCompra, idMetodoPago: e.target.value })}
              >
                <option value="">Seleccionar método</option>
                {metodosPago.map(m => (
                  <option key={m.idMetodoPago} value={m.idMetodoPago}>{m.nombre}</option>
                ))}
              </select>
            </div>

            <div className="field col-12">
              <label className="field-label">Observaciones</label>
              <textarea 
                placeholder="Notas adicionales" 
                style={{ minHeight: '80px' }}
                value={formCompra.observaciones}
                onChange={(e) => setFormCompra({ ...formCompra, observaciones: e.target.value })}
              />
            </div>
          </div>
        ) : (
          <div className="form-grid">
            <div className="field col-6">
              <label className="field-label">Descripción del gasto</label>
              <input 
                type="text" 
                placeholder='Ej: Publicidad Instagram, Servicios básicos' 
                value={formGasto.descripcion}
                onChange={(e) => setFormGasto({ ...formGasto, descripcion: e.target.value })}
              />
            </div>

            <div className="field col-6">
              <label className="field-label">Monto</label>
              <input 
                type="number" 
                placeholder="$ 0" 
                min={0} 
                step={100} 
                value={formGasto.monto}
                onChange={(e) => setFormGasto({ ...formGasto, monto: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="field col-6">
              <label className="field-label">Fecha</label>
              <input 
                type="date" 
                value={formGasto.fecha}
                onChange={(e) => setFormGasto({ ...formGasto, fecha: e.target.value })}
              />
            </div>

            <div className="field col-6">
              <label className="field-label">Tipo de pago</label>
              <select 
                value={formGasto.idMetodoPago}
                onChange={(e) => setFormGasto({ ...formGasto, idMetodoPago: e.target.value })}
              >
                <option value="">Seleccionar método</option>
                {metodosPago.map(m => (
                  <option key={m.idMetodoPago} value={m.idMetodoPago}>{m.nombre}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <Toolbar>
          <Button onClick={tipoEgreso === 'compra' ? handleGuardarCompra : handleGuardarGasto}>
            Guardar
          </Button>
          <Button variant="ghost" onClick={handleCancelar}>Cancelar</Button>
        </Toolbar>
      </Card>
      
      <Card title="Egresos del mes" subtitle="Últimos egresos registrados">
        <Table columns={["Fecha", "Detalle", "Monto", "Método"]} rows={rowsEgresos} />
      </Card>
    </div>
  )
}