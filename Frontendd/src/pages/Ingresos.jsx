import React, { useState, useEffect } from 'react'
import Select from 'react-select'
import { Card, Toolbar, Button, Table } from '../components/UI.jsx'
import { api } from '../services/api/index.js'

export default function Ingresos() {
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [metodosPago, setMetodosPago] = useState([])
  const [ventas, setVentas] = useState([])
  const [loading, setLoading] = useState(true)
  const [observacionesModal, setObservacionesModal] = useState(null)
  
  const [formData, setFormData] = useState({
    idProducto: '',
    cantidad: 1,
    idMetodoPago: '',
    fecha: new Date().toISOString().split('T')[0],
    observaciones: '',
    categoriaId: ''
  })

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
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
      
      await fetch('http://localhost:8080/api/ventas', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(ventaData)
      }).then(r => {
        if (!r.ok) throw new Error(`Error ${r.status}`)
        return r
      })
      
      alert('Venta registrada exitosamente')
      
      setFormData({
        idProducto: '',
        cantidad: 1,
        idMetodoPago: '',
        fecha: new Date().toISOString().split('T')[0],
        observaciones: '',
        categoriaId: ''
      })
      
      cargarDatos()
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
      categoriaId: ''
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

  const productOptions = productos.map(p => ({
    value: p.idProducto,
    label: `${p.nombre} - $${p.precio?.toLocaleString('es-CL')}`,
    producto: p
  }))

  const customStyles = {
    container: (provided) => ({
      ...provided,
      width: '100%'
    }),
    control: (provided, state) => ({
      ...provided,
      minHeight: '62px',
      height: '62px',
      width: '100%',
      fontSize: '1.18rem',
      background: 'rgb(241, 237, 232)',
      border: '1px solid transparent',
      borderRadius: '8px',
      boxShadow: 'none',
      transition: 'none',
      '&:hover': {
        border: '1px solid transparent',
        boxShadow: 'none'
      }
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: '0 1.1rem',
      height: '62px',
      display: 'flex',
      alignItems: 'center'
    }),
    singleValue: (provided) => ({
      ...provided,
      margin: 0,
      maxWidth: '100%',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }),
    input: (provided) => ({
      ...provided,
      margin: 0,
      padding: 0
    }),
    menu: (provided) => ({
      ...provided,
      fontSize: '1.18rem',
      zIndex: 9999
    }),
    option: (provided, state) => ({
      ...provided,
      fontSize: '1.05rem',
      padding: '0.8rem 1rem'
    })
  }

  const customStylesMobile = {
    container: (provided) => ({
      ...provided,
      width: '100%'
    }),
    control: (provided, state) => ({
      ...provided,
      minHeight: '2.4rem',
      height: '2.4rem',
      maxHeight: '2.4rem',
      width: '100%',
      fontSize: '0.85rem',
      background: 'rgb(241, 237, 232)',
      border: '1px solid transparent',
      borderRadius: '8px',
      boxShadow: 'none',
      transition: 'none',
      overflow: 'hidden',
      '&:hover': {
        border: '1px solid transparent',
        boxShadow: 'none'
      }
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: '0.35rem 0.55rem',
      height: '2.4rem',
      minHeight: '2.4rem',
      display: 'flex',
      alignItems: 'center'
    }),
    singleValue: (provided) => ({
      ...provided,
      margin: 0,
      fontSize: '0.85rem',
      lineHeight: '1',
      maxWidth: '100%',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }),
    input: (provided) => ({
      ...provided,
      margin: 0,
      padding: 0,
      fontSize: '0.85rem',
      lineHeight: '1'
    }),
    placeholder: (provided) => ({
      ...provided,
      fontSize: '0.85rem',
      lineHeight: '1'
    }),
    indicatorsContainer: (provided) => ({
      ...provided,
      height: '2.4rem'
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      padding: '4px'
    }),
    clearIndicator: (provided) => ({
      ...provided,
      padding: '4px'
    }),
    menu: (provided) => ({
      ...provided,
      fontSize: '0.85rem',
      zIndex: 9999
    }),
    option: (provided, state) => ({
      ...provided,
      fontSize: '0.8rem',
      padding: '0.5rem 0.6rem'
    })
  }

  const isMobile = window.innerWidth <= 599

  if (loading) {
    return <div className="stack large-text"><Card title="Cargando..."><p>Obteniendo datos...</p></Card></div>
  }

  return (
    <div className="stack large-text">
      <Card title="Registrar venta" subtitle="Registre una venta o ingreso monetario">
        <div className="form-grid">
          <div className="field col-6">
            <label className="field-label">Nombre del producto</label>
            <Select
              options={productOptions}
              placeholder="Buscar producto..."
              isClearable
              isSearchable
              styles={isMobile ? customStylesMobile : customStyles}
              noOptionsMessage={() => "No se encontraron productos"}
              value={productOptions.find(opt => opt.value === parseInt(formData.idProducto)) || null}
              onChange={(selectedOption) => {
                if (selectedOption) {
                  const producto = selectedOption.producto
                  setFormData({
                    ...formData,
                    idProducto: selectedOption.value.toString(),
                    categoriaId: producto?.categoria?.idCategoria || ''
                  })
                } else {
                  setFormData({
                    ...formData, 
                    idProducto: '',
                    categoriaId: ''
                  })
                }
              }}
            />
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
            <div className="quantity-control">
              <Button variant="ghost" aria-label="Restar" onClick={decrementarCantidad}>−</Button>
              <input 
                type="number" 
                value={formData.cantidad} 
                onChange={(e) => setFormData({ ...formData, cantidad: parseInt(e.target.value) || 1 })}
                min={1} 
                step={1} 
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

          <div className="field col-12">
            <label className="field-label">Observaciones (opcional)</label>
            <textarea 
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              placeholder="Ingrese notas o comentarios adicionales sobre esta venta..."
              rows={3}
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

        <Toolbar>
          <Button onClick={handleGuardar}>Guardar</Button>
          <Button variant="ghost" onClick={handleGuardarYNuevo}>Guardar y nuevo</Button>
          <Button variant="ghost" onClick={handleCancelar}>Cancelar</Button>
        </Toolbar>
      </Card>

      <Card title="Ingresos del mes" subtitle="Últimas ventas registradas">
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
                  textAlign: 'right',
                  fontWeight: '600',
                  color: 'rgb(70, 60, 50)',
                  fontSize: '0.95rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  borderBottom: '2px solid rgb(200, 180, 160)'
                }}>Comisión</th>
                <th style={{ 
                  padding: '1rem 0.75rem', 
                  textAlign: 'right',
                  fontWeight: '600',
                  color: 'rgb(70, 60, 50)',
                  fontSize: '0.95rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  borderBottom: '2px solid rgb(200, 180, 160)'
                }}>Bruto</th>
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
              {ventas.slice(-10).reverse().map((v, idx) => {
                const primerProducto = v.detalles && v.detalles.length > 0 ? v.detalles[0].producto?.nombre : 'N/A'
                
                let fechaFormateada = 'N/A'
                if (v.fecha) {
                  try {
                    if (Array.isArray(v.fecha)) {
                      const fecha = new Date(v.fecha[0], v.fecha[1] - 1, v.fecha[2])
                      fechaFormateada = fecha.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })
                    } else {
                      const fecha = new Date(v.fecha)
                      fechaFormateada = fecha.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })
                    }
                  } catch (e) {
                    console.error('Error formateando fecha:', e)
                  }
                }

                const montoNeto = v.montoNeto ? Math.round(v.montoNeto) : Math.round((v.montoTotal || 0) - (v.ivaTotal || 0))
                const ivaTotal = v.ivaTotal ? Math.round(v.ivaTotal) : 0
                const comision = v.comision ? Math.round(v.comision) : 0
                const montoBruto = v.montoBruto ? Math.round(v.montoBruto) : Math.round(v.montoTotal || 0)
                
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
                      color: 'rgb(60, 50, 40)',
                      fontWeight: '500',
                      fontSize: '0.95rem'
                    }}>{primerProducto}</td>
                    <td style={{ 
                      padding: '0.85rem 0.75rem', 
                      textAlign: 'right',
                      color: 'rgb(80, 70, 60)',
                      fontSize: '0.95rem',
                      fontWeight: '500'
                    }}>{`$ ${montoNeto.toLocaleString('es-CL')}`}</td>
                    <td style={{ 
                      padding: '0.85rem 0.75rem', 
                      textAlign: 'right',
                      color: 'rgb(120, 110, 100)',
                      fontSize: '0.9rem'
                    }}>{`$ ${ivaTotal.toLocaleString('es-CL')}`}</td>
                    <td style={{ 
                      padding: '0.85rem 0.75rem', 
                      textAlign: 'right',
                      color: 'rgb(120, 110, 100)',
                      fontSize: '0.9rem'
                    }}>{`$ ${comision.toLocaleString('es-CL')}`}</td>
                    <td style={{ 
                      padding: '0.85rem 0.75rem', 
                      textAlign: 'right',
                      color: 'rgb(180, 140, 100)',
                      fontWeight: '600',
                      fontSize: '1rem'
                    }}>{`$ ${montoBruto.toLocaleString('es-CL')}`}</td>
                    <td style={{ 
                      padding: '0.85rem 0.75rem',
                      color: 'rgb(100, 90, 80)',
                      fontSize: '0.9rem'
                    }}>{v.metodoPago?.nombre || 'Efectivo'}</td>
                    <td style={{ padding: '0.85rem 0.75rem', textAlign: 'center' }}>
                      {v.observaciones && v.observaciones.trim() !== '' ? (
                        <button
                          onClick={() => setObservacionesModal(v.observaciones)}
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
                Observaciones de la venta
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