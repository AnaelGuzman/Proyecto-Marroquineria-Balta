import React, { useState, useEffect } from 'react'
import { Card, Toolbar, Button } from '../components/UI.jsx'
import { api } from '../services/api/index.js'

export default function Egresos() {
  const [compras, setCompras] = useState([])
  const [gastos, setGastos] = useState([])
  const [metodosPago, setMetodosPago] = useState([])
  const [loading, setLoading] = useState(true)
  const [tipoEgreso, setTipoEgreso] = useState('compra')
  const [observacionesModal, setObservacionesModal] = useState(null)
  
  const [formCompra, setFormCompra] = useState({
    descripcion: '',
    cantidad: 1,
    precioUnitario: 0,
    idMetodoPago: '',
    tipoDocumento: 'factura',
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

  const calcularTotalCompra = () => {
    return formCompra.precioUnitario * formCompra.cantidad
  }

  const calcularIVARecuperable = () => {
    if (formCompra.tipoDocumento === 'factura') {
      const total = calcularTotalCompra()
      const iva = total / 1.19 * 0.19
      return Math.round(iva)
    }
    return 0
  }

  const calcularCostoReal = () => {
    const total = calcularTotalCompra()
    const ivaRecuperable = calcularIVARecuperable()
    return total - ivaRecuperable
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
        tipoDocumento: formCompra.tipoDocumento,
        observaciones: formCompra.observaciones || "",
        detalles: [{
          descripcion: formCompra.descripcion,
          cantidad: parseInt(formCompra.cantidad),
          precioUnitario: parseFloat(formCompra.precioUnitario)
        }]
      }

      await fetch('http://localhost:8080/api/compras', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(compraData)
      }).then(r => {
        if (!r.ok) throw new Error(`Error ${r.status}`)
        return r.json()
      })

      alert('Compra registrada exitosamente')

      setFormCompra({
        descripcion: '',
        cantidad: 1,
        precioUnitario: 0,
        idMetodoPago: '',
        tipoDocumento: 'factura',
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
        tipoDocumento: 'factura',
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

  if (loading) {
    return <div className="stack large-text"><Card title="Cargando..."><p>Obteniendo datos...</p></Card></div>
  }

  const egresosCombinados = [...compras, ...gastos]
    .sort((a, b) => {
      const fechaA = Array.isArray(a.fecha) ? new Date(a.fecha[0], a.fecha[1] - 1, a.fecha[2]) : new Date(a.fecha)
      const fechaB = Array.isArray(b.fecha) ? new Date(b.fecha[0], b.fecha[1] - 1, b.fecha[2]) : new Date(b.fecha)
      return fechaB - fechaA
    })
    .slice(0, 10)

  return (
    <div className="stack large-text">
      <Card title="Registrar egreso" subtitle="Registra una compra o gasto">
        <div style={{ marginBottom: '1.5rem' }}>
          <label className="field-label">Tipo de egreso</label>
          <select 
            value={tipoEgreso} 
            onChange={(e) => setTipoEgreso(e.target.value)}
            style={{ fontSize: '1rem' }}
          >
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
                placeholder='Ej: cuero, hilo, hebillas, remaches' 
                value={formCompra.descripcion}
                onChange={(e) => setFormCompra({ ...formCompra, descripcion: e.target.value })}
              />
            </div>

            <div className="field col-6">
              <label className="field-label">Precio unitario</label>
              <input 
                type="number" 
                placeholder="0" 
                min={0} 
                step={100} 
                value={formCompra.precioUnitario || ''}
                onChange={(e) => setFormCompra({ ...formCompra, precioUnitario: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="field col-6">
              <label className="field-label">Cantidad</label>
              <div className="quantity-control">
                <Button variant="ghost" aria-label="Restar" onClick={decrementarCantidad}>−</Button>
                <input 
                  type="number" 
                  value={formCompra.cantidad} 
                  onChange={(e) => setFormCompra({ ...formCompra, cantidad: parseInt(e.target.value) || 1 })}
                  min={1} 
                  step={1}
                />
                <Button variant="ghost" aria-label="Sumar" onClick={incrementarCantidad}>+</Button>
              </div>
            </div>

            <div className="field col-6">
              <label className="field-label">Total</label>
              <input 
                type="text" 
                value={`$ ${calcularTotalCompra().toLocaleString('es-CL')}`} 
                disabled 
                style={{ 
                  fontWeight: '600',
                  color: 'rgb(180, 140, 100)'
                }}
              />
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

            <div className="field col-6">
              <label className="field-label">Tipo de documento</label>
              <select 
                value={formCompra.tipoDocumento}
                onChange={(e) => setFormCompra({ ...formCompra, tipoDocumento: e.target.value })}
                style={{ fontSize: '1rem' }}
              >
                <option value="factura">Factura (IVA recuperable)</option>
                <option value="boleta">Boleta (IVA no recuperable)</option>
                <option value="sin-documento">Sin documento</option>
              </select>
            </div>

            <div className="field col-12">
              <label className="field-label">Observaciones (opcional)</label>
              <textarea 
                placeholder="Notas adicionales sobre esta compra..." 
                rows={3}
                value={formCompra.observaciones}
                onChange={(e) => setFormCompra({ ...formCompra, observaciones: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '1rem',
                  borderRadius: '8px',
                  border: '1px solid transparent',
                  background: 'rgb(241, 237, 232)',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          </div>
        ) : (
          <div className="form-grid">
            <div className="field col-6">
              <label className="field-label">Descripción del gasto</label>
              <input 
                type="text" 
                placeholder='Ej: publicidad, envíos, arriendo' 
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
        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgb(230, 220, 210)' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'separate',
            borderSpacing: 0,
            background: 'white'
          }}>
            <thead>
              <tr style={{ background: 'linear-gradient(to bottom, rgb(235, 225, 215), rgb(225, 215, 205))' }}>
                <th style={{ 
                  padding: '1rem 0.75rem', 
                  textAlign: 'left', 
                  fontWeight: '600',
                  color: 'rgb(70, 60, 50)',
                  fontSize: '0.95rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  borderBottom: '2px solid rgb(200, 180, 160)'
                }}>Fecha</th>
                <th style={{ 
                  padding: '1rem 0.75rem', 
                  textAlign: 'left',
                  fontWeight: '600',
                  color: 'rgb(70, 60, 50)',
                  fontSize: '0.95rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  borderBottom: '2px solid rgb(200, 180, 160)'
                }}>Tipo</th>
                <th style={{ 
                  padding: '1rem 0.75rem', 
                  textAlign: 'left',
                  fontWeight: '600',
                  color: 'rgb(70, 60, 50)',
                  fontSize: '0.95rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  borderBottom: '2px solid rgb(200, 180, 160)'
                }}>Detalle</th>
                <th style={{ 
                  padding: '1rem 0.75rem', 
                  textAlign: 'right',
                  fontWeight: '600',
                  color: 'rgb(70, 60, 50)',
                  fontSize: '0.95rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  borderBottom: '2px solid rgb(200, 180, 160)'
                }}>Total</th>
                <th style={{ 
                  padding: '1rem 0.75rem', 
                  textAlign: 'right',
                  fontWeight: '600',
                  color: 'rgb(70, 60, 50)',
                  fontSize: '0.95rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  borderBottom: '2px solid rgb(200, 180, 160)'
                }}>Neto</th>
                <th style={{ 
                  padding: '1rem 0.75rem', 
                  textAlign: 'right',
                  fontWeight: '600',
                  color: 'rgb(70, 60, 50)',
                  fontSize: '0.95rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  borderBottom: '2px solid rgb(200, 180, 160)'
                }}>IVA</th>
                <th style={{ 
                  padding: '1rem 0.75rem', 
                  textAlign: 'left',
                  fontWeight: '600',
                  color: 'rgb(70, 60, 50)',
                  fontSize: '0.95rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  borderBottom: '2px solid rgb(200, 180, 160)'
                }}>Medio</th>
                <th style={{ 
                  padding: '1rem 0.75rem', 
                  textAlign: 'center',
                  fontWeight: '600',
                  color: 'rgb(70, 60, 50)',
                  fontSize: '0.95rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  borderBottom: '2px solid rgb(200, 180, 160)'
                }}>Obs</th>
              </tr>
            </thead>
            <tbody>
              {egresosCombinados.map((item, idx) => {
                const esCompra = item.montoTotal !== undefined
                
                let fechaFormateada = 'N/A'
                if (item.fecha) {
                  try {
                    if (Array.isArray(item.fecha)) {
                      const fecha = new Date(item.fecha[0], item.fecha[1] - 1, item.fecha[2])
                      fechaFormateada = fecha.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })
                    } else {
                      const fecha = new Date(item.fecha)
                      fechaFormateada = fecha.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })
                    }
                  } catch (e) {
                    console.error('Error formateando fecha:', e)
                  }
                }

                const montoTotal = esCompra 
                  ? Math.round(item.montoTotal || 0)
                  : Math.round(item.monto || 0)

                const montoNeto = esCompra && item.montoNeto
                  ? Math.round(item.montoNeto)
                  : montoTotal

                const ivaRecuperable = esCompra && item.ivaTotal 
                  ? Math.round(item.ivaTotal)
                  : 0

                const detalle = esCompra 
                  ? (item.detalles && item.detalles.length > 0 ? item.detalles[0].descripcion : 'Compra')
                  : item.descripcion

                return (
                  <tr 
                    key={idx} 
                    style={{ 
                      borderBottom: '1px solid rgb(240, 235, 230)',
                      background: idx % 2 === 0 ? 'white' : 'rgb(252, 250, 248)',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgb(245, 240, 235)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? 'white' : 'rgb(252, 250, 248)'}
                  >
                    <td style={{ 
                      padding: '0.85rem 0.75rem',
                      color: 'rgb(90, 80, 70)',
                      fontSize: '0.95rem'
                    }}>{fechaFormateada}</td>
                    <td style={{ 
                      padding: '0.85rem 0.75rem',
                      fontSize: '0.9rem'
                    }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.6rem',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        background: esCompra ? 'rgb(200, 220, 240)' : 'rgb(255, 220, 200)',
                        color: esCompra ? 'rgb(40, 70, 100)' : 'rgb(120, 60, 20)'
                      }}>
                        {esCompra ? 'Compra' : 'Gasto'}
                      </span>
                    </td>
                    <td style={{ 
                      padding: '0.85rem 0.75rem',
                      color: 'rgb(60, 50, 40)',
                      fontWeight: '500',
                      fontSize: '0.95rem'
                    }}>{detalle}</td>
                    <td style={{ 
                      padding: '0.85rem 0.75rem', 
                      textAlign: 'right',
                      color: 'rgb(180, 60, 60)',
                      fontWeight: '600',
                      fontSize: '1rem'
                    }}>{`$ ${montoTotal.toLocaleString('es-CL')}`}</td>
                    <td style={{ 
                      padding: '0.85rem 0.75rem', 
                      textAlign: 'right',
                      color: ivaRecuperable > 0 ? 'rgb(60, 140, 60)' : 'rgb(180, 60, 60)',
                      fontWeight: '600',
                      fontSize: '1rem'
                    }}>{`$ ${montoNeto.toLocaleString('es-CL')}`}</td>
                    <td style={{ 
                      padding: '0.85rem 0.75rem', 
                      textAlign: 'right',
                      color: ivaRecuperable > 0 ? 'rgb(60, 140, 60)' : 'rgb(150, 150, 150)',
                      fontWeight: '500',
                      fontSize: '0.95rem'
                    }}>
                      {ivaRecuperable > 0 
                        ? `$ ${ivaRecuperable.toLocaleString('es-CL')}` 
                        : '-'
                      }
                    </td>
                    <td style={{ 
                      padding: '0.85rem 0.75rem',
                      color: 'rgb(100, 90, 80)',
                      fontSize: '0.95rem'
                    }}>{item.metodoPago?.nombre || 'N/A'}</td>
                    <td style={{ padding: '0.85rem 0.75rem', textAlign: 'center' }}>
                      {esCompra && item.observaciones && item.observaciones.trim() !== '' ? (
                        <button
                          onClick={() => setObservacionesModal(item.observaciones)}
                          style={{
                            background: 'linear-gradient(135deg, rgb(220, 210, 195), rgb(210, 200, 185))',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.4rem 0.8rem',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            fontWeight: '600',
                            color: 'rgb(80, 70, 60)',
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, rgb(200, 190, 175), rgb(190, 180, 165))'
                            e.currentTarget.style.transform = 'translateY(-2px)'
                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, rgb(220, 210, 195), rgb(210, 200, 185))'
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
                          }}
                        >
                          📝 Ver
                        </button>
                      ) : (
                        <span style={{ color: '#ccc', fontSize: '1.1rem' }}>−</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {observacionesModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '1rem',
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => setObservacionesModal(null)}
        >
          <style>
            {`
              @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              @keyframes slideUp {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
              }
            `}
          </style>
          <div 
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              maxWidth: '550px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              border: '2px solid rgb(220, 210, 195)',
              animation: 'slideUp 0.3s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              marginBottom: '1.5rem', 
              paddingBottom: '1rem', 
              borderBottom: '2px solid rgb(241, 237, 232)' 
            }}>
              <span style={{ fontSize: '2rem' }}>📝</span>
              <h3 style={{ 
                margin: 0, 
                fontSize: '1.5rem', 
                color: 'rgb(80, 70, 60)', 
                fontWeight: '600' 
              }}>
                Observaciones de la compra
              </h3>
            </div>
            <div style={{
              background: 'rgb(250, 248, 245)',
              padding: '1.25rem',
              borderRadius: '10px',
              borderLeft: '4px solid rgb(180, 140, 100)',
              marginBottom: '1.5rem'
            }}>
              <p style={{
                margin: 0,
                fontSize: '1.05rem',
                lineHeight: '1.6',
                color: 'rgb(60, 50, 40)',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word'
              }}>{observacionesModal}</p>
            </div>
            <Button onClick={() => setObservacionesModal(null)} style={{ width: '100%' }}>
              Cerrar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}