import React, { useState, useEffect, useMemo } from 'react'
import { api } from '../services/api/index.js'
import { TrendingDown, ShoppingCart, Receipt, Analytics, AttachMoney, CalendarToday, Description, Add, Delete, Inventory, LocalShipping, ArrowUpward, ArrowDownward, SwapVert } from '@mui/icons-material';

const esRegistroCompra = (registro) => typeof registro?.montoTotal !== 'undefined' && registro?.montoTotal !== null

const obtenerValorNumerico = (valor) => {
  if (typeof valor === 'number' && Number.isFinite(valor)) {
    return valor
  }

  if (typeof valor === 'string') {
    const normalizado = valor.replace(/[^0-9.-]/g, '')
    const numero = parseFloat(normalizado)
    return Number.isFinite(numero) ? numero : 0
  }

  return 0
}

const obtenerFechaValor = (registro) => {
  if (!registro?.fecha) return 0

  try {
    if (Array.isArray(registro.fecha)) {
      const [year, month, day] = registro.fecha
      return new Date(year || 0, (month || 1) - 1, day || 1).getTime()
    }

    const fecha = new Date(registro.fecha)
    return Number.isNaN(fecha.getTime()) ? 0 : fecha.getTime()
  } catch (error) {
    console.error('Error obteniendo fecha para ordenamiento:', error)
    return 0
  }
}

const obtenerDetalleTexto = (registro) => {
  if (esRegistroCompra(registro)) {
    const detalle = registro?.detalles?.[0]?.descripcion
    return detalle?.trim() || 'Compra'
  }
  return registro?.descripcion?.trim() || 'Gasto'
}

const obtenerMontoBruto = (registro) => {
  const valor = esRegistroCompra(registro) ? registro?.montoTotal : registro?.monto
  return obtenerValorNumerico(valor)
}

const obtenerMontoNeto = (registro) => {
  const bruto = obtenerMontoBruto(registro)
  if (esRegistroCompra(registro) && registro?.tipoDocumento === 'factura') {
    const iva = bruto - bruto / 1.19
    return bruto - iva
  }
  return bruto
}

const obtenerMetodoNombre = (registro) => {
  const nombre = registro?.metodoPago?.nombre
  return nombre ? String(nombre) : 'N/A'
}

const obtenerTipoEtiqueta = (registro) => (esRegistroCompra(registro) ? 'Compra' : 'Gasto')

export default function Egresos() {
  const [compras, setCompras] = useState([])
  const [gastos, setGastos] = useState([])
  const [metodosPago, setMetodosPago] = useState([])
  const [materiales, setMateriales] = useState([])
  const [unidadesMedida, setUnidadesMedida] = useState([])
  const [loading, setLoading] = useState(true)
  const [tipoEgreso, setTipoEgreso] = useState('compra')
  const [observacionesModal, setObservacionesModal] = useState(null)
  const [movimientosSort, setMovimientosSort] = useState({ key: 'fecha', direction: 'desc' })
  
  const [formCompra, setFormCompra] = useState({
    descripcion: '',
    cantidad: 1,
    precioUnitario: 0,
    idMetodoPago: '',
    tipoDocumento: 'boleta',
    fecha: new Date().toISOString().split('T')[0],
    observaciones: ''
  })

  const [formGasto, setFormGasto] = useState({
    descripcion: '',
    monto: 0,
    idMetodoPago: '',
    fecha: new Date().toISOString().split('T')[0]
  })

  const [formCompraMaterial, setFormCompraMaterial] = useState({
    idMaterial: '',
    cantidad: 1,
    precioUnitario: 0,
    idMetodoPago: '',
    fecha: new Date().toISOString().split('T')[0],
    observaciones: ''
  })

  const [resumen, setResumen] = useState([
    { 
      label: 'Compras del Mes', 
      value: '$ 0',
      icon: <ShoppingCart />,
      color: '#5D4037',
      trend: 'down'
    },
    { 
      label: 'Gastos del Mes', 
      value: '$ 0',
      icon: <Receipt />,
      color: '#8D6E63',
      trend: 'down'
    },
    { 
      label: 'Total Egresos', 
      value: '$ 0',
      icon: <TrendingDown />,
      color: '#F44336',
      trend: 'down'
    },
  ])

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const now = new Date()
      const inicio = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const fin = now.toISOString()

      const [comps, gast, metodos, totalCompras, totalGastos, materialesData, unidadesData] = await Promise.all([
        api.compras.getAll().catch(() => []),
        api.gastos.getAll().catch(() => []),
        api.metodosPago.getAll().catch(() => []),
        api.compras.getTotalPorPeriodo(inicio, fin).catch(() => 0),
        api.gastos.getTotalPorPeriodo(inicio, fin).catch(() => 0),
        api.materiales.getAll().catch(() => []),
        api.unidadesMedida.getAll().catch(() => [])
      ])

      setCompras(comps || [])
      setGastos(gast || [])
      setMetodosPago(metodos || [])
      setMateriales(materialesData || [])
      setUnidadesMedida(unidadesData || [])

      const comprasMes = parseFloat(totalCompras) || 0
      const gastosMes = parseFloat(totalGastos) || 0
      const totalEgresos = comprasMes + gastosMes

      setResumen([
        { 
          label: 'Compras del Mes', 
          value: `$ ${Math.round(comprasMes).toLocaleString('es-CL')}`,
          icon: <ShoppingCart />,
          color: '#5D4037',
          trend: 'down'
        },
        { 
          label: 'Gastos del Mes', 
          value: `$ ${Math.round(gastosMes).toLocaleString('es-CL')}`,
          icon: <Receipt />,
          color: '#8D6E63',
          trend: 'down'
        },
        { 
          label: 'Total Egresos', 
          value: `$ ${Math.round(totalEgresos).toLocaleString('es-CL')}`,
          icon: <TrendingDown />,
          color: '#F44336',
          trend: 'down'
        },
      ])
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const calcularTotalCompra = () => {
    return (formCompra.precioUnitario || 0) * (formCompra.cantidad || 1)
  }

  const calcularTotalCompraMaterial = () => {
    return (formCompraMaterial.precioUnitario || 0) * (formCompraMaterial.cantidad || 1)
  }

  const calcularIVARecuperable = (total, tipoDocumento) => {
    if (tipoDocumento === 'factura') {
      const iva = total - (total / 1.19)
      return Math.round(iva * 100) / 100
    }
    return 0
  }

  const calcularCostoReal = (total, tipoDocumento) => {
    const ivaRecuperable = calcularIVARecuperable(total, tipoDocumento)
    return Math.round((total - ivaRecuperable) * 100) / 100
  }

  const handleGuardarCompra = async () => {
    if (!formCompra.descripcion?.trim()) {
      alert('Por favor ingrese una descripción')
      return
    }
    
    if (!formCompra.idMetodoPago) {
      alert('Por favor seleccione un método de pago')
      return
    }
    
    if (!formCompra.precioUnitario || formCompra.precioUnitario <= 0) {
      alert('El precio unitario debe ser mayor a 0')
      return
    }

    if (!formCompra.cantidad || formCompra.cantidad <= 0) {
      alert('La cantidad debe ser mayor a 0')
      return
    }

    try {
      const cantidad = parseInt(formCompra.cantidad)
      const precioUnitario = parseFloat(formCompra.precioUnitario)
      const subtotal = cantidad * precioUnitario
      
      const compraData = {
        fecha: new Date(formCompra.fecha).toISOString(),
        metodoPago: { 
          idMetodoPago: parseInt(formCompra.idMetodoPago)
        },
        tipoDocumento: formCompra.tipoDocumento || 'sin-documento',
        observaciones: (formCompra.observaciones || '').trim(),
        detalles: [
          {
            descripcion: formCompra.descripcion.trim(),
            cantidad: cantidad,
            precioUnitario: precioUnitario,
            subtotal: subtotal
          }
        ]
      }

      console.log('📤 Datos a enviar:', JSON.stringify(compraData, null, 2))

      const response = await api.compras.registrar(compraData)
      
      console.log('✅ Respuesta exitosa:', response)
      
      alert('✅ Compra registrada exitosamente')

      setFormCompra({
        descripcion: '',
        cantidad: 1,
        precioUnitario: 0,
        idMetodoPago: '',
        tipoDocumento: 'boleta',
        fecha: new Date().toISOString().split('T')[0],
        observaciones: ''
      })

      await cargarDatos()
      
    } catch (error) {
      console.error('❌ Error completo:', error)
      
      let mensaje = 'Error desconocido al registrar la compra'
      
      if (error.message) {
        mensaje = error.message
      } else if (error.response?.data) {
        mensaje = typeof error.response.data === 'string' 
          ? error.response.data 
          : JSON.stringify(error.response.data)
      }
      
      alert('❌ Error al registrar la compra:\n\n' + mensaje)
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
      await cargarDatos()
    } catch (error) {
      console.error('Error al registrar gasto:', error)
      alert('Error al registrar el gasto: ' + (error.message || 'Error desconocido'))
    }
  }

  const handleGuardarCompraMaterial = async () => {
    if (!formCompraMaterial.idMaterial) {
      alert('Por favor seleccione un material')
      return
    }
    
    if (!formCompraMaterial.idMetodoPago) {
      alert('Por favor seleccione un método de pago')
      return
    }
    
    if (!formCompraMaterial.precioUnitario || formCompraMaterial.precioUnitario <= 0) {
      alert('El precio unitario debe ser mayor a 0')
      return
    }

    if (!formCompraMaterial.cantidad || formCompraMaterial.cantidad <= 0) {
      alert('La cantidad debe ser mayor a 0')
      return
    }

    try {
      const materialSeleccionado = materiales.find(m => m.idMaterial === parseInt(formCompraMaterial.idMaterial))
      
      const compraData = {
        fecha: new Date(formCompraMaterial.fecha).toISOString(),
        metodoPago: { 
          idMetodoPago: parseInt(formCompraMaterial.idMetodoPago)
        },
        observaciones: (formCompraMaterial.observaciones || '').trim() || `Compra de material: ${materialSeleccionado?.nombre}`
      }

      const materialesData = [{
        material: { idMaterial: parseInt(formCompraMaterial.idMaterial) },
        cantidad: parseInt(formCompraMaterial.cantidad),
        precioUnitario: parseFloat(formCompraMaterial.precioUnitario)
      }]

      console.log('📤 Datos compra material:', { compraData, materialesData })

      const response = await api.compras.registrarCompraMaterial(compraData, materialesData)
      
      console.log('✅ Compra material exitosa:', response)
      
      alert('✅ Compra de material registrada exitosamente')

      setFormCompraMaterial({
        idMaterial: '',
        cantidad: 1,
        precioUnitario: 0,
        idMetodoPago: '',
        fecha: new Date().toISOString().split('T')[0],
        observaciones: ''
      })

      await cargarDatos()
      
    } catch (error) {
      console.error('❌ Error compra material:', error)
      alert('❌ Error al registrar compra de material:\n\n' + (error.message || 'Error desconocido'))
    }
  }

  const handleCancelar = () => {
    if (tipoEgreso === 'compra') {
      setFormCompra({
        descripcion: '',
        cantidad: 1,
        precioUnitario: 0,
        idMetodoPago: '',
        tipoDocumento: 'boleta',
        fecha: new Date().toISOString().split('T')[0],
        observaciones: ''
      })
    } else if (tipoEgreso === 'gasto') {
      setFormGasto({
        descripcion: '',
        monto: 0,
        idMetodoPago: '',
        fecha: new Date().toISOString().split('T')[0]
      })
    } else if (tipoEgreso === 'material') {
      setFormCompraMaterial({
        idMaterial: '',
        cantidad: 1,
        precioUnitario: 0,
        idMetodoPago: '',
        fecha: new Date().toISOString().split('T')[0],
        observaciones: ''
      })
    }
  }

  const incrementarCantidad = () => {
    if (tipoEgreso === 'compra') {
      setFormCompra({ ...formCompra, cantidad: formCompra.cantidad + 1 })
    } else if (tipoEgreso === 'material') {
      setFormCompraMaterial({ ...formCompraMaterial, cantidad: formCompraMaterial.cantidad + 1 })
    }
  }

  const decrementarCantidad = () => {
    if (tipoEgreso === 'compra' && formCompra.cantidad > 1) {
      setFormCompra({ ...formCompra, cantidad: formCompra.cantidad - 1 })
    } else if (tipoEgreso === 'material' && formCompraMaterial.cantidad > 1) {
      setFormCompraMaterial({ ...formCompraMaterial, cantidad: formCompraMaterial.cantidad - 1 })
    }
  }
  
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
  }

  const getMaterialInfo = (idMaterial) => {
    const material = materiales.find(m => m.idMaterial === parseInt(idMaterial))
    return material || null
  }

  const egresosCombinados = useMemo(() => {
    const registros = [...compras, ...gastos]

    const sorted = registros.sort((a, b) => {
      let result = 0

      switch (movimientosSort.key) {
        case 'tipo':
          result = obtenerTipoEtiqueta(a).localeCompare(
            obtenerTipoEtiqueta(b),
            'es',
            { sensitivity: 'base' }
          )
          break
        case 'detalle':
          result = obtenerDetalleTexto(a).localeCompare(
            obtenerDetalleTexto(b),
            'es',
            { sensitivity: 'base' }
          )
          break
        case 'bruto':
          result = obtenerMontoBruto(a) - obtenerMontoBruto(b)
          break
        case 'neto':
          result = obtenerMontoNeto(a) - obtenerMontoNeto(b)
          break
        case 'metodo':
          result = obtenerMetodoNombre(a).localeCompare(
            obtenerMetodoNombre(b),
            'es',
            { sensitivity: 'base' }
          )
          break
        case 'fecha':
        default:
          result = obtenerFechaValor(a) - obtenerFechaValor(b)
          break
      }

      return movimientosSort.direction === 'asc' ? result : -result
    })

    return sorted.slice(0, 10)
  }, [compras, gastos, movimientosSort])

  const handleSortMovimientos = (columnKey) => {
    setMovimientosSort((prev) => {
      if (prev.key === columnKey) {
        return {
          key: columnKey,
          direction: prev.direction === 'asc' ? 'desc' : 'asc'
        }
      }

      return {
        key: columnKey,
        direction: columnKey === 'fecha' ? 'desc' : 'asc'
      }
    })
  }

  const SortHeaderButton = ({ label, columnKey }) => {
    const isActive = movimientosSort.key === columnKey
    const IconComponent = !isActive
      ? SwapVert
      : movimientosSort.direction === 'asc'
        ? ArrowUpward
        : ArrowDownward

    return (
      <button
        type="button"
        className="tabla-sort-button"
        onClick={() => handleSortMovimientos(columnKey)}
      >
        <span>{label}</span>
        <IconComponent sx={{ fontSize: '1rem' }} />
      </button>
    )
  }

  if (loading && compras.length === 0 && gastos.length === 0) {
    return (
      <div className="egresos-container">
        <div className="egresos-card">
          <div className="egresos-loading">
            <p>Cargando datos de compras y gastos...</p>
          </div>
        </div>
      </div>
    )
  }

  const tablaEgresos = egresosCombinados.map((item, idx) => {
    const esCompra = esRegistroCompra(item)
    const detalle = obtenerDetalleTexto(item)
    const montoTotal = obtenerMontoBruto(item)
    const montoNeto = obtenerMontoNeto(item)
    const ivaValor = esCompra && item.tipoDocumento === 'factura'
      ? montoTotal - montoNeto
      : 0
    const metodoPagoNombre = obtenerMetodoNombre(item)
    
    let fechaFormateada = 'N/A'
    if (item.fecha) {
      try {
        fechaFormateada = formatearFecha(item.fecha)
      } catch (e) {
        console.error('Error formateando fecha:', e)
      }
    }

    return [
      <div key={`fecha-${idx}`} className="tabla-fecha">{fechaFormateada}</div>,
      <span 
        key={`tipo-${idx}`}
        className={`tipo-badge ${esCompra ? 'tipo-compra' : 'tipo-gasto'}`}
      >
        {esCompra ? '🛒 Compra' : '💸 Gasto'}
      </span>,
      <div key={`detalle-${idx}`} className="tabla-detalle">{detalle}</div>,
      <div key={`bruto-${idx}`} className="tabla-monto">
        {`$${Math.round(montoTotal).toLocaleString('es-CL')}`}
      </div>,
      <div key={`neto-${idx}`} className="tabla-monto" style={{ 
        color: ivaValor > 0 ? '#2E7D32' : '#5D4037',
        fontWeight: ivaValor > 0 ? '700' : '600'
      }}>
        {`$${Math.round(montoNeto).toLocaleString('es-CL')}`}
      </div>,
      <div key={`metodo-${idx}`} className="tabla-metodo">
        {metodoPagoNombre}
      </div>,
      esCompra && item.observaciones && item.observaciones.trim() !== '' ? (
        <button 
          key={`obs-${idx}`}
          className="btn-observaciones"
          onClick={() => setObservacionesModal(item.observaciones)}
        >
          📝 Ver
        </button>
      ) : (
        <span key={`obs-${idx}`} className="sin-observaciones">—</span>
      )
    ]
  })

  return (
    <div className="egresos-container">
      <style>{`
        .egresos-container {
          padding: 2rem;
          background: #EFEBE9;
          min-height: 100vh;
          max-width: 1400px;
          margin: 0 auto;
        }

        .egresos-header {
          background: linear-gradient(135deg, #5D4037, #8D6E63);
          color: white;
          border-radius: 16px;
          margin-bottom: 2rem;
          box-shadow: 0 8px 20px rgba(93, 64, 55, 0.2);
          overflow: hidden;
        }

        .egresos-card {
          background: #FAF9F7;
          border: 1px solid #D7CCC8;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(93, 64, 55, 0.1);
          transition: all 0.3s ease;
          overflow: hidden;
          margin-bottom: 2rem;
        }

        .egresos-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(93, 64, 55, 0.15);
        }

        .egresos-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #5D4037, #8D6E63);
        }

        .card-header {
          padding: 1.5rem 2rem;
          border-bottom: 1px solid #D7CCC8;
          background: linear-gradient(135deg, #FAF9F7, #F5F3F0);
        }

        .card-title {
          font-size: 1.5rem;
          margin: 0 0 0.5rem 0;
          color: #3E2723;
          font-weight: 600;
        }

        .card-subtitle {
          color: #8D6E63;
          font-size: 0.9rem;
          margin: 0;
        }

        .card-body {
          padding: 2rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: linear-gradient(135deg, #FAF9F7, #F5F3F0);
          border: 1px solid #D7CCC8;
          padding: 1.5rem;
          border-radius: 12px;
          text-align: center;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #5D4037, #8D6E63);
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(93, 64, 55, 0.1);
        }

        .stat-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          margin: 0 auto 1rem;
          font-size: 28px;
        }

        .stat-label {
          color: #8D6E63;
          font-size: 0.95rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
          display: block;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: #3E2723;
          display: block;
          background: linear-gradient(135deg, #5D4037, #8D6E63);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 1.5rem;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          grid-column: span 12;
        }

        .form-field.col-6 {
          grid-column: span 6;
        }

        .form-field.col-12 {
          grid-column: span 12;
        }

        .field-label {
          font-size: 1rem;
          color: #3E2723;
          margin-bottom: 0.25rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        input, select, textarea {
          background: #FAF9F7;
          border: 2px solid #D7CCC8;
          color: #3E2723;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          outline: none;
          font-size: 1rem;
          height: 48px;
          line-height: 1.4;
          display: block;
          width: 100%;
          box-shadow: none;
          transition: all 0.3s ease;
          font-family: inherit;
        }

        input:focus, select:focus, textarea:focus {
          border-color: #5D4037;
          box-shadow: 0 0 0 3px rgba(93, 64, 55, 0.1);
        }

        input::placeholder, textarea::placeholder {
          color: #8D6E63;
          opacity: 0.7;
        }

        textarea {
          min-height: 120px;
          padding: 1rem;
          resize: vertical;
          height: auto;
        }

        .btn {
          height: 48px;
          min-height: 48px;
          padding: 0 1.5rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          border: 2px solid transparent;
          background: #5D4037;
          color: #fff;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          gap: 0.5rem;
          font-family: inherit;
        }

        .btn:hover {
          background: #8D6E63;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(93, 64, 55, 0.2);
        }

        .btn.ghost {
          background: transparent;
          border: 2px solid #D7CCC8;
          color: #3E2723;
        }

        .btn.ghost:hover {
          background: #D7CCC8;
          border-color: #5D4037;
        }

        .btn.small {
          height: 36px;
          min-height: 36px;
          padding: 0 1rem;
          font-size: 0.9rem;
        }

        .toolbar {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
          flex-wrap: wrap;
        }

        .quantity-control {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .quantity-control input {
          text-align: center;
          flex: 1;
        }

        .resumen-financiero {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin: 1rem 0;
        }

        .resumen-item {
          padding: 1.25rem;
          border-radius: 12px;
          text-align: center;
          font-weight: 600;
        }

        .resumen-iva {
          background: linear-gradient(135deg, #E8F5E8, #C8E6C9);
          border: 2px solid #4CAF50;
          color: #2E7D32;
        }

        .resumen-costo {
          background: linear-gradient(135deg, #FFF3E0, #FFE0B2);
          border: 2px solid #FF9800;
          color: #EF6C00;
        }

        .resumen-total {
          background: linear-gradient(135deg, #5D4037, #8D6E63);
          border: 2px solid #5D4037;
          color: white;
        }

        .tabla-container {
          overflow: auto;
          border: 1px solid #D7CCC8;
          border-radius: 12px;
          background: #FAF9F7;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .tabla {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          background: #FAF9F7;
        }

        .tabla thead th {
          font-size: 1rem;
          position: sticky;
          top: 0;
          background: linear-gradient(135deg, #5D4037, #8D6E63);
          text-align: left;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #D7CCC8;
          font-weight: 600;
          color: #FFF;
        }

        .tabla-sort-button {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          background: transparent;
          border: none;
          color: inherit;
          font: inherit;
          cursor: pointer;
          padding: 0;
        }

        .tabla-sort-button:focus-visible {
          outline: 2px solid rgba(255, 255, 255, 0.8);
          outline-offset: 2px;
        }

        .tabla td {
          font-size: 0.95rem;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #D7CCC8;
          color: #3E2723;
        }

        .tabla tbody tr {
          transition: background 0.3s ease;
        }

        .tabla tbody tr:hover {
          background: #D7CCC8;
        }

        .tabla tbody tr:nth-child(even) {
          background: #F5F3F0;
        }

        .tipo-badge {
          padding: 0.4rem 1rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          display: inline-block;
          min-width: 80px;
          text-align: center;
        }

        .tipo-compra {
          background: #E8F5E8;
          color: #2E7D32;
        }

        .tipo-gasto {
          background: #FFEBEE;
          color: #C62828;
        }

        .tabla-fecha, .tabla-detalle, .tabla-monto, .tabla-metodo {
          font-weight: 500;
        }

        .tabla-monto {
          text-align: right;
          font-weight: 600;
          color: #5D4037;
          font-size: 1.05rem;
        }
        
        .btn-observaciones {
          background: transparent;
          border: 2px solid #D7CCC8;
          color: #3E2723;
          padding: 0.4rem 0.8rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.85rem;
          transition: all 0.3s ease;
          font-family: inherit;
        }

        .btn-observaciones:hover {
          background: #D7CCC8;
          border-color: #5D4037;
        }

        .sin-observaciones {
          color: #8D6E63;
        }

        .egresos-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          color: #8D6E63;
          font-size: 1.1rem;
        }

        .chart-placeholder {
          position: relative;
          min-height: 300px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0.6rem 0 1.2rem;
          background: #F5F3F0;
          border-radius: 12px;
          border: 2px dashed #D7CCC8;
        }

        .material-info {
          background: #E8F5E8;
          padding: 1rem;
          border-radius: 8px;
          border-left: 4px solid #4CAF50;
          margin: 0.5rem 0;
        }

        .material-info p {
          margin: 0.25rem 0;
          font-size: 0.9rem;
          color: #2E7D32;
        }

        @media (max-width: 768px) {
          .egresos-container {
            padding: 1rem;
          }

          .form-field.col-6 {
            grid-column: span 12;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .resumen-financiero {
            grid-template-columns: 1fr;
          }

          .toolbar {
            flex-direction: column;
          }

          .btn {
            width: 100%;
          }
        }
      `}</style>

      {/* Header con Resumen */}
      <div className="egresos-card egresos-header">
        <div className="card-header">
          <h1 className="card-title">Gestión de Egresos</h1>
          <p className="card-subtitle">Control de compras, gastos y abastecimiento de materiales</p>
        </div>
        <div className="card-body">
          <div className="stats-grid">
            {resumen.map((r, index) => (
              <div key={r.label} className="stat-card">
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  marginBottom: '1rem'
                }}>
                  <div className="stat-icon" style={{ backgroundColor: `${r.color}20`, color: r.color }}>
                    {React.cloneElement(r.icon, { sx: { fontSize: 28 } })}
                  </div>
                  <span style={{
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '20px',
                    background: r.trend === 'up' ? '#E8F5E8' : '#FFEBEE',
                    color: r.trend === 'up' ? '#2E7D32' : '#C62828'
                  }}>
                    {r.trend === 'up' ? '↗' : '↘'}
                  </span>
                </div>
                <span className="stat-label">{r.label}</span>
                <span className="stat-value">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
        {/* Formulario de Registro */}
        <div style={{ gridColumn: 'span 12' }}>
          <div className="egresos-card">
            <div className="card-header">
              <h2 className="card-title">Registrar Nuevo Egreso</h2>
              <p className="card-subtitle">Agregue una compra, gasto o abastecimiento de materiales</p>
            </div>
            <div className="card-body">
              <div className="form-field">
                <label className="field-label">
                  <Analytics sx={{ fontSize: 24 }} />
                  Tipo de Egreso
                </label>
                <select 
                  value={tipoEgreso} 
                  onChange={(e) => setTipoEgreso(e.target.value)}
                >
                  <option value="compra">🛒 Compra General</option>
                  <option value="material">📦 Compra de Materiales</option>
                  <option value="gasto">💸 Gasto Operativo</option>
                </select>
              </div>

              {tipoEgreso === 'compra' ? (
                <div className="form-grid">
                  <div className="form-field col-6">
                    <label className="field-label">
                      <Description sx={{ fontSize: 20 }} />
                      Descripción del Producto
                    </label>
                    <input 
                      type="text" 
                      placeholder='Ej: Cuero, hilos, hebillas, remaches...' 
                      value={formCompra.descripcion}
                      onChange={(e) => setFormCompra({ ...formCompra, descripcion: e.target.value })}
                    />
                  </div>

                  <div className="form-field col-6">
                    <label className="field-label">
                      <AttachMoney sx={{ fontSize: 20 }} />
                      Precio Unitario
                    </label>
                    <input 
                      type="number" 
                      placeholder="0" 
                      min={0} 
                      step={100} 
                      value={formCompra.precioUnitario || ''}
                      onChange={(e) => setFormCompra({ ...formCompra, precioUnitario: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="form-field col-6">
                    <label className="field-label">Cantidad</label>
                    <div className="quantity-control">
                      <button className="btn ghost small" onClick={decrementarCantidad}>−</button>
                      <input 
                        type="number" 
                        value={formCompra.cantidad} 
                        onChange={(e) => setFormCompra({ ...formCompra, cantidad: parseInt(e.target.value) || 1 })}
                        min={1} 
                        step={1}
                      />
                      <button className="btn ghost small" onClick={incrementarCantidad}>+</button>
                    </div>
                  </div>

                  <div className="form-field col-6">
                    <label className="field-label">Total Compra</label>
                    <input 
                      type="text" 
                      value={`$ ${Math.round(calcularTotalCompra()).toLocaleString('es-CL')}`}
                      disabled 
                      style={{ 
                        fontWeight: '600',
                        color: '#5D4037',
                        background: 'linear-gradient(135deg, #FAF9F7, #F5F3F0)',
                        fontSize: '1.1rem'
                      }}
                    />
                  </div>

                  {/* Resumen Financiero Compra */}
                  <div className="form-field col-12">
                    <label className="field-label">
                      <Receipt sx={{ fontSize: 24 }} />
                      Resumen Financiero
                    </label>
                    
                    <div className="resumen-financiero">
                      <div className="resumen-item resumen-iva">
                        <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                          IVA Recuperable
                        </div>
                        <div style={{ fontSize: '1.1rem' }}>
                          $ {Math.round(calcularIVARecuperable(calcularTotalCompra(), formCompra.tipoDocumento)).toLocaleString('es-CL')}
                        </div>
                      </div>
                      
                      <div className="resumen-item resumen-costo">
                        <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                          Costo Real
                        </div>
                        <div style={{ fontSize: '1.1rem' }}>
                          $ {Math.round(calcularCostoReal(calcularTotalCompra(), formCompra.tipoDocumento)).toLocaleString('es-CL')}
                        </div>
                      </div>
                      
                      <div className="resumen-item resumen-total">
                        <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                          Total Bruto
                        </div>
                        <div style={{ fontSize: '1.1rem' }}>
                          $ {Math.round(calcularTotalCompra()).toLocaleString('es-CL')}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="form-field col-6">
                    <label className="field-label">
                      <CalendarToday sx={{ fontSize: 20 }} />
                      Fecha
                    </label>
                    <input 
                      type="date" 
                      value={formCompra.fecha}
                      onChange={(e) => setFormCompra({ ...formCompra, fecha: e.target.value })}
                    />
                  </div>

                  <div className="form-field col-6">
                    <label className="field-label">Método de Pago</label>
                    <select 
                      value={formCompra.idMetodoPago}
                      onChange={(e) => setFormCompra({ ...formCompra, idMetodoPago: e.target.value })}
                    >
                      <option value="">Seleccionar método...</option>
                      {metodosPago.map(m => (
                        <option key={m.idMetodoPago} value={m.idMetodoPago}>
                          {m.nombre} {m.comisionAsociada > 0 ? `(${m.comisionAsociada}% comisión)` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field col-6">
                    <label className="field-label">Tipo de Documento</label>
                    <select 
                      value={formCompra.tipoDocumento}
                      onChange={(e) => setFormCompra({ ...formCompra, tipoDocumento: e.target.value })}
                    >
                      <option value="boleta">🧾 Boleta (IVA no recuperable)</option>
                      <option value="factura">📄 Factura (IVA recuperable)</option>
                      <option value="sin-documento">📝 Sin documento</option>
                    </select>
                  </div>

                  <div className="form-field col-12">
                    <label className="field-label">
                      <Description sx={{ fontSize: 20 }} />
                      Observaciones (opcional)
                    </label>
                    <textarea 
                      placeholder="Notas adicionales sobre esta compra..." 
                      rows={3}
                      value={formCompra.observaciones}
                      onChange={(e) => setFormCompra({ ...formCompra, observaciones: e.target.value })}
                    />
                  </div>
                </div>
              ) : tipoEgreso === 'material' ? (
                <div className="form-grid">
                  <div className="form-field col-6">
                    <label className="field-label">
                      <Inventory sx={{ fontSize: 20 }} />
                      Material a Comprar
                    </label>
                    <select 
                      value={formCompraMaterial.idMaterial}
                      onChange={(e) => setFormCompraMaterial({ ...formCompraMaterial, idMaterial: e.target.value })}
                    >
                      <option value="">Seleccionar material...</option>
                      {materiales.map(m => (
                        <option key={m.idMaterial} value={m.idMaterial}>
                          {m.nombre} ({m.unidadMedida?.abreviatura || 'N/A'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {formCompraMaterial.idMaterial && (
                    <div className="form-field col-6">
                      <label className="field-label">Información del Material</label>
                      <div className="material-info">
                        {(() => {
                          const material = getMaterialInfo(formCompraMaterial.idMaterial)
                          return material ? (
                            <>
                              <p><strong>Stock actual:</strong> {material.stockActual || 0} {material.unidadMedida?.abreviatura || ''}</p>
                              <p><strong>Stock mínimo:</strong> {material.stockMinimo || 0} {material.unidadMedida?.abreviatura || ''}</p>
                              <p><strong>Costo promedio:</strong> $ {(material.costoPromedio || 0).toFixed(2)}</p>
                            </>
                          ) : null
                        })()}
                      </div>
                    </div>
                  )}

                  <div className="form-field col-6">
                    <label className="field-label">
                      <AttachMoney sx={{ fontSize: 20 }} />
                      Precio Unitario
                    </label>
                    <input 
                      type="number" 
                      placeholder="0" 
                      min={0} 
                      step={0.01} 
                      value={formCompraMaterial.precioUnitario || ''}
                      onChange={(e) => setFormCompraMaterial({ ...formCompraMaterial, precioUnitario: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="form-field col-6">
                    <label className="field-label">Cantidad</label>
                    <div className="quantity-control">
                      <button className="btn ghost small" onClick={decrementarCantidad}>−</button>
                      <input 
                        type="number" 
                        value={formCompraMaterial.cantidad} 
                        onChange={(e) => setFormCompraMaterial({ ...formCompraMaterial, cantidad: parseInt(e.target.value) || 1 })}
                        min={1} 
                        step={1}
                      />
                      <button className="btn ghost small" onClick={incrementarCantidad}>+</button>
                    </div>
                  </div>

                  <div className="form-field col-6">
                    <label className="field-label">Total Compra</label>
                    <input 
                      type="text" 
                      value={`$ ${Math.round(calcularTotalCompraMaterial()).toLocaleString('es-CL')}`}
                      disabled 
                      style={{ 
                        fontWeight: '600',
                        color: '#5D4037',
                        background: 'linear-gradient(135deg, #FAF9F7, #F5F3F0)',
                        fontSize: '1.1rem'
                      }}
                    />
                  </div>

                  <div className="form-field col-6">
                    <label className="field-label">Unidad de Medida</label>
                    <input 
                      type="text" 
                      value={getMaterialInfo(formCompraMaterial.idMaterial)?.unidadMedida?.abreviatura || 'N/A'}
                      disabled 
                      style={{ 
                        background: '#F5F3F0',
                        color: '#8D6E63'
                      }}
                    />
                  </div>

                  <div className="form-field col-6">
                    <label className="field-label">
                      <CalendarToday sx={{ fontSize: 20 }} />
                      Fecha
                    </label>
                    <input 
                      type="date" 
                      value={formCompraMaterial.fecha}
                      onChange={(e) => setFormCompraMaterial({ ...formCompraMaterial, fecha: e.target.value })}
                    />
                  </div>

                  <div className="form-field col-6">
                    <label className="field-label">Método de Pago</label>
                    <select 
                      value={formCompraMaterial.idMetodoPago}
                      onChange={(e) => setFormCompraMaterial({ ...formCompraMaterial, idMetodoPago: e.target.value })}
                    >
                      <option value="">Seleccionar método...</option>
                      {metodosPago.map(m => (
                        <option key={m.idMetodoPago} value={m.idMetodoPago}>
                          {m.nombre} {m.comisionAsociada > 0 ? `(${m.comisionAsociada}% comisión)` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field col-12">
                    <label className="field-label">
                      <Description sx={{ fontSize: 20 }} />
                      Observaciones (opcional)
                    </label>
                    <textarea 
                      placeholder="Notas adicionales sobre esta compra de material..." 
                      rows={3}
                      value={formCompraMaterial.observaciones}
                      onChange={(e) => setFormCompraMaterial({ ...formCompraMaterial, observaciones: e.target.value })}
                    />
                  </div>
                </div>
              ) : (
                <div className="form-grid">
                  <div className="form-field col-6">
                    <label className="field-label">
                      <Description sx={{ fontSize: 20 }} />
                      Descripción del Gasto
                    </label>
                    <input 
                      type="text" 
                      placeholder='Ej: Arriendo, servicios, publicidad, envíos...' 
                      value={formGasto.descripcion}
                      onChange={(e) => setFormGasto({ ...formGasto, descripcion: e.target.value })}
                    />
                  </div>

                  <div className="form-field col-6">
                    <label className="field-label">
                      <AttachMoney sx={{ fontSize: 20 }} />
                      Monto del Gasto
                    </label>
                    <input 
                      type="number" 
                      placeholder="$ 0" 
                      min={0} 
                      step={100} 
                      value={formGasto.monto}
                      onChange={(e) => setFormGasto({ ...formGasto, monto: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="form-field col-6">
                    <label className="field-label">
                      <CalendarToday sx={{ fontSize: 20 }} />
                      Fecha
                    </label>
                    <input 
                      type="date" 
                      value={formGasto.fecha}
                      onChange={(e) => setFormGasto({ ...formGasto, fecha: e.target.value })}
                    />
                  </div>

                  <div className="form-field col-6">
                    <label className="field-label">Método de Pago</label>
                    <select 
                      value={formGasto.idMetodoPago}
                      onChange={(e) => setFormGasto({ ...formGasto, idMetodoPago: e.target.value })}
                    >
                      <option value="">Seleccionar método...</option>
                      {metodosPago.map(m => (
                        <option key={m.idMetodoPago} value={m.idMetodoPago}>
                          {m.nombre} {m.comisionAsociada > 0 ? `(${m.comisionAsociada}% comisión)` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="toolbar">
                <button className="btn" onClick={
                  tipoEgreso === 'compra' ? handleGuardarCompra :
                  tipoEgreso === 'material' ? handleGuardarCompraMaterial :
                  handleGuardarGasto
                }>
                  {tipoEgreso === 'material' ? <LocalShipping sx={{ fontSize: 20 }} /> : <AttachMoney sx={{ fontSize: 20 }} />}
                  Registrar {tipoEgreso === 'compra' ? 'Compra' : tipoEgreso === 'material' ? 'Compra de Material' : 'Gasto'}
                </button>
                <button className="btn ghost" onClick={handleCancelar}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Panel de Análisis */}
        <div style={{ gridColumn: 'span 12' }}>
          <div className="egresos-card">
            <div className="card-header">
              <h2 className="card-title">Análisis de Egresos</h2>
              <p className="card-subtitle">Distribución y tendencias de compras vs gastos</p>
            </div>
            <div className="card-body">
              <div className="chart-placeholder">
                <div style={{ textAlign: 'center', color: '#8D6E63' }}>
                  <Analytics sx={{ fontSize: 64, color: '#8D6E63', marginBottom: '1rem', opacity: 0.5 }} />
                  <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Dashboard de Egresos</div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                    Visualización de compras vs gastos mensuales
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Movimientos */}
      <div className="egresos-card">
        <div className="card-header">
          <h2 className="card-title">Movimientos Recientes</h2>
          <p className="card-subtitle">Últimos egresos registrados en el sistema</p>
        </div>
        <div className="card-body">
          <div className="tabla-container">
            <table className="tabla">
              <thead>
                 <tr>
                  <th><SortHeaderButton label="Fecha" columnKey="fecha" /></th>
                  <th><SortHeaderButton label="Tipo" columnKey="tipo" /></th>
                  <th><SortHeaderButton label="Detalle" columnKey="detalle" /></th>
                  <th><SortHeaderButton label="Monto Bruto" columnKey="bruto" /></th>
                  <th><SortHeaderButton label="Monto Neto" columnKey="neto" /></th>
                  <th><SortHeaderButton label="Medio Pago" columnKey="metodo" /></th>
                  <th>Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {tablaEgresos.map((fila, index) => (
                  <tr key={index}>
                    {fila.map((celda, celdaIndex) => (
                      <td key={celdaIndex}>{celda}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Observaciones */}
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
            padding: '1rem'
          }}
          onClick={() => setObservacionesModal(null)}
        >
          <div 
            style={{
              background: '#FAF9F7',
              borderRadius: '16px',
              padding: '2rem',
              maxWidth: '600px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              border: '2px solid #D7CCC8'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              marginBottom: '1.5rem', 
              paddingBottom: '1rem', 
              borderBottom: '2px solid #D7CCC8' 
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #5D4037, #8D6E63)',
                padding: '0.75rem',
                borderRadius: '12px',
                color: 'white'
              }}>
                <Description sx={{ fontSize: 24 }} />
              </div>
              <h3 style={{ 
                margin: 0, 
                fontSize: '1.5rem', 
                color: '#3E2723', 
                fontWeight: '600' 
              }}>
                Observaciones del Egreso
              </h3>
            </div>
            <div style={{
              background: '#D7CCC8',
              padding: '1.5rem',
              borderRadius: '12px',
              borderLeft: '4px solid #5D4037',
              marginBottom: '1.5rem'
            }}>
              <p style={{ 
                margin: 0, 
                fontSize: '1.05rem', 
                lineHeight: '1.6', 
                color: '#3E2723', 
                whiteSpace: 'pre-wrap' 
              }}>
                {observacionesModal}
              </p>
            </div>
            <button className="btn" onClick={() => setObservacionesModal(null)} style={{ width: '100%' }}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}