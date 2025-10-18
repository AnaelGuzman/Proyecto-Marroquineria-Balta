import React, { useState, useEffect } from 'react'
import { Card, Table, Toolbar, Button, Field } from '../components/UI.jsx'
import { api } from '../services/api/index.js'
import { 
  Inventory, 
  Add, 
  Warning, 
  TrendingUp, 
  Category, 
  Search,
  FilterList,
  Refresh,
  Edit,
  Visibility,
  Delete
} from '@mui/icons-material';

export default function Inventario() {
  const [inventario, setInventario] = useState([])
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState({ 
    buscar: '', 
    categoria: 'all',
    stockBajo: false 
  })
  const [showForm, setShowForm] = useState(false)
  const [showAjuste, setShowAjuste] = useState(false)
  const [showDetalles, setShowDetalles] = useState(null)
  const [showConfirmDelete, setShowConfirmDelete] = useState(null)
  const [productoEdit, setProductoEdit] = useState(null)
  const [bajoStock, setBajoStock] = useState([])
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: 0,
    idCategoria: '',
    cantidad: 0
  })
  const [ajusteData, setAjusteData] = useState({
    idProducto: '',
    cantidad: 0,
    motivo: ''
  })

  const [resumen, setResumen] = useState([
    { 
      label: 'Total Productos', 
      value: '0',
      icon: <Inventory sx={{ fontSize: 32, color: 'var(--brand)' }} />,
      trend: 'neutral'
    },
    { 
      label: 'Bajo Stock', 
      value: '0',
      icon: <Warning sx={{ fontSize: 32, color: 'var(--warning)' }} />,
      trend: 'down'
    },
    { 
      label: 'Valor Total', 
      value: '$ 0',
      icon: <TrendingUp sx={{ fontSize: 32, color: 'var(--success)' }} />,
      trend: 'up'
    },
  ])

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const [inv, prods, cats, bajoStockData] = await Promise.all([
        api.inventario.getAll().catch(() => []),
        api.productos.getAll().catch(() => []),
        api.categorias.getAll().catch(() => []),
        api.inventario.getBajoStock(10).catch(() => [])
      ])
      
      setInventario(inv)
      setProductos(prods)
      setCategorias(cats)
      setBajoStock(bajoStockData)

      // Calcular resumen
      const valorTotal = inv.reduce((total, item) => {
        const precio = item.producto?.precio || 0
        const cantidad = item.cantidadProducto || 0
        return total + (precio * cantidad)
      }, 0)

      setResumen([
        { 
          label: 'N° de Productos', 
          value: prods.length.toString(),
          icon: <Inventory sx={{ fontSize: 32, color: 'var(--brand)' }} />,
          trend: 'neutral'
        },
        { 
          label: 'N° Productos con Bajo Stock', 
          value: bajoStockData.length.toString(),
          icon: <Warning sx={{ fontSize: 32, color: 'var(--warning)' }} />,
          trend: 'down'
        },
        { 
          label: 'Valor total del Inventario Actual', 
          value: `$ ${Math.round(valorTotal).toLocaleString('es-CL')}`,
          icon: <TrendingUp sx={{ fontSize: 32, color: 'var(--success)' }} />,
          trend: 'up'
        },
      ])
    } catch (error) {
      console.error('Error al cargar inventario:', error)
    } finally {
      setLoading(false)
    }
  }

  // MEJORA: Búsqueda de productos por nombre
  const buscarProductos = async (termino) => {
    if (!termino.trim()) {
      cargarDatos()
      return
    }
    
    try {
      const resultados = await api.productos.buscar(termino)
      setProductos(resultados)
      
      // Actualizar inventario con los productos encontrados
      const inventarioFiltrado = await Promise.all(
        resultados.map(async (producto) => {
          try {
            const inventarioItem = await api.inventario.getPorProducto(producto.idProducto)
            return inventarioItem
          } catch {
            return null
          }
        })
      )
      
      setInventario(inventarioFiltrado.filter(item => item !== null))
    } catch (error) {
      console.error('Error en búsqueda:', error)
    }
  }

  // MEJORA: Filtrar productos por categoría
  const filtrarPorCategoria = async (idCategoria) => {
    if (idCategoria === 'all') {
      cargarDatos()
      return
    }
    
    try {
      const productosFiltrados = await api.productos.getPorCategoria(idCategoria)
      setProductos(productosFiltrados)
      
      const inventarioFiltrado = await Promise.all(
        productosFiltrados.map(async (producto) => {
          try {
            const inventarioItem = await api.inventario.getPorProducto(producto.idProducto)
            return inventarioItem
          } catch {
            return null
          }
        })
      )
      
      setInventario(inventarioFiltrado.filter(item => item !== null))
    } catch (error) {
      console.error('Error al filtrar por categoría:', error)
    }
  }

  const ajustarStock = async (idProducto, delta) => {
    try {
      const item = inventario.find(i => i.producto?.idProducto === idProducto)
      if (!item) return
      
      const nuevaCantidad = item.cantidadProducto + delta
      if (nuevaCantidad < 0) {
        alert('No se puede tener stock negativo')
        return
      }
      
      await api.inventario.ajustarCantidad(idProducto, delta)
      
      // CORRECCIÓN: Actualizar manteniendo el orden original
      const nuevoInventario = inventario.map(item => 
        item.producto?.idProducto === idProducto 
          ? { 
              ...item, 
              cantidadProducto: nuevaCantidad, 
              fechaActualizacion: new Date(),
              idInventario: item.idInventario,
              producto: { ...item.producto }
            }
          : item
      )
      
      setInventario(nuevoInventario)
      
      // NUEVO: Recalcular el valor total del inventario
      const valorTotal = nuevoInventario.reduce((total, item) => {
        const precio = item.producto?.precio || 0
        const cantidad = item.cantidadProducto || 0
        return total + (precio * cantidad)
      }, 0)
      
      // NUEVO: Actualizar el resumen con el nuevo valor
      setResumen(prev => prev.map(stat => 
        stat.label === 'Valor total del Inventario Actual'
          ? { ...stat, value: `$ ${Math.round(valorTotal).toLocaleString('es-CL')}` }
          : stat
      ))
      
    } catch (error) {
      console.error('Error al ajustar stock:', error)
      alert('Error al ajustar el stock')
    }
  }

  const actualizarPrecio = async (idProducto, delta) => {
    try {
      const producto = productos.find(p => p.idProducto === idProducto)
      if (!producto) return
      
      const nuevoPrecio = Math.max(0, producto.precio + delta)
      
      await api.productos.update(idProducto, {
        ...producto,
        precio: nuevoPrecio
      })
      
      // CORRECCIÓN: Actualizar el estado local inmediatamente
      setProductos(prev => prev.map(p => 
        p.idProducto === idProducto ? { ...p, precio: nuevoPrecio } : p
      ))
      
      await cargarDatos()
    } catch (error) {
      console.error('Error al actualizar precio:', error)
      alert('Error al actualizar el precio')
    }
  }

  const actualizarCategoria = async (idProducto, nuevaCategoriaId) => {
    try {
      const producto = productos.find(p => p.idProducto === idProducto)
      if (!producto) return
      
      await api.productos.update(idProducto, {
        ...producto,
        categoria: { idCategoria: parseInt(nuevaCategoriaId) }
      })
      await cargarDatos()
    } catch (error) {
      console.error('Error al actualizar categoría:', error)
      alert('Error al actualizar la categoría')
    }
  }

  // NUEVA FUNCIÓN: Eliminar producto
  const eliminarProducto = async (producto) => {
    try {
      // Primero eliminar el registro de inventario si existe
      const inventarioItem = inventario.find(i => i.producto?.idProducto === producto.idProducto)
      if (inventarioItem) {
        await api.inventario.delete(inventarioItem.idInventario)
      }
      
      // Luego eliminar el producto
      await api.productos.delete(producto.idProducto)
      
      setShowConfirmDelete(null)
      await cargarDatos()
      alert('Producto eliminado exitosamente')
    } catch (error) {
      console.error('Error al eliminar producto:', error)
      alert('Error al eliminar el producto: ' + (error.message || 'Error desconocido'))
    }
  }

  const handleCrearProducto = async (e) => {
    e.preventDefault()
    try {
      // Primero crear el producto
      const productoData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        precio: parseFloat(formData.precio),
        categoria: { idCategoria: parseInt(formData.idCategoria) }
      }

      const nuevoProducto = await api.productos.create(productoData)
      
      // Luego registrar en inventario
      const inventarioData = {
        producto: { idProducto: nuevoProducto.idProducto },
        cantidadProducto: parseInt(formData.cantidad)
      }

      await api.inventario.registrar(inventarioData)
      
      setShowForm(false)
      setFormData({ nombre: '', descripcion: '', precio: 0, idCategoria: '', cantidad: 0 })
      await cargarDatos()
      alert('Producto creado exitosamente')
    } catch (error) {
      console.error('Error al crear producto:', error)
      alert('Error al crear el producto')
    }
  }

  const handleAjusteStock = async (e) => {
    e.preventDefault()
    try {
      await api.inventario.ajustarCantidad(
        parseInt(ajusteData.idProducto), 
        parseInt(ajusteData.cantidad)
      )
      
      setShowAjuste(false)
      setAjusteData({ idProducto: '', cantidad: 0, motivo: '' })
      await cargarDatos()
      alert('Stock ajustado exitosamente')
    } catch (error) {
      console.error('Error al ajustar stock:', error)
      alert('Error al ajustar el stock')
    }
  }

  const handleEditarProducto = (producto) => {
    setProductoEdit(producto)
    setFormData({
      nombre: producto.nombre || '',
      descripcion: producto.descripcion || '',
      precio: producto.precio || 0,
      idCategoria: producto.categoria?.idCategoria || '',
      cantidad: inventario.find(i => i.producto?.idProducto === producto.idProducto)?.cantidadProducto || 0
    })
    setShowForm(true)
  }

  const handleActualizarProducto = async (e) => {
    e.preventDefault()
    try {
      await api.productos.update(productoEdit.idProducto, {
        ...productoEdit,
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        precio: parseFloat(formData.precio),
        categoria: { idCategoria: parseInt(formData.idCategoria) }
      })

      setShowForm(false)
      setProductoEdit(null)
      setFormData({ nombre: '', descripcion: '', precio: 0, idCategoria: '', cantidad: 0 })
      await cargarDatos()
      alert('Producto actualizado exitosamente')
    } catch (error) {
      console.error('Error al actualizar producto:', error)
      alert('Error al actualizar el producto')
    }
  }

  // MEJORA: Ver detalles del producto
  const handleVerDetalles = (producto) => {
    const inventarioItem = inventario.find(i => i.producto?.idProducto === producto.idProducto)
    setShowDetalles({
      producto,
      inventario: inventarioItem
    })
  }

  const fixedButtonStyle = {
    minWidth: '30px',
    textAlign: 'center'
  }

  const controlContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    height: '62px'
  }

  const categoryOptions = categorias.map(c => ({ 
    value: c.idCategoria, 
    label: c.nombre 
  }))

  // MEJORA: Filtrado mejorado
  const inventarioFiltrado = inventario.filter(item => {
    const producto = item.producto || {}
    const nombreMatch = filtro.buscar === '' || 
      producto.nombre?.toLowerCase().includes(filtro.buscar.toLowerCase())
    const categoriaMatch = filtro.categoria === 'all' || 
      producto.categoria?.idCategoria === parseInt(filtro.categoria)
    const stockBajoMatch = !filtro.stockBajo || item.cantidadProducto <= 10
    
    return nombreMatch && categoriaMatch && stockBajoMatch
  })

  const filas = inventarioFiltrado.map(item => {
    const prod = item.producto || {}
    

    const itemId = item.idInventario || prod.idProducto
    if (!itemId) {
      console.warn('Item sin ID:', item)
      return null 
    }
    
    let fechaFormateada = 'N/A'
    if (item.fechaActualizacion) {
      if (Array.isArray(item.fechaActualizacion)) {
        const fecha = new Date(item.fechaActualizacion[0], item.fechaActualizacion[1] - 1, item.fechaActualizacion[2])
        fechaFormateada = fecha.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })
      } else {
        const fecha = new Date(item.fechaActualizacion)
        fechaFormateada = fecha.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })
      }
    }
    
    const stockBajo = item.cantidadProducto <= 10
    const stockCritico = item.cantidadProducto <= 5

    return [
      <div key={`${itemId}-nombre`} style={{ display: 'flex', alignItems: 'center', height: '62px' }}>
        <span style={{ fontWeight: '600' }}>{prod.nombre || 'Sin nombre'}</span>
        <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '0.5rem' }}>
          <Button
            variant="ghost"
            small
            style={fixedButtonStyle}
            aria-label="Ver detalles"
            onClick={() => handleVerDetalles(prod)}
          >
            <Visibility sx={{ fontSize: 16 }} />
          </Button>
          <Button
            variant="ghost"
            small
            style={fixedButtonStyle}
            aria-label="Editar producto"
            onClick={() => handleEditarProducto(prod)}
          >
            <Edit sx={{ fontSize: 16 }} />
          </Button>
          <Button
            variant="ghost"
            small
            style={fixedButtonStyle}
            aria-label="Eliminar producto"
            onClick={() => setShowConfirmDelete(prod)}
            sx={{ color: 'var(--error)' }}
          >
            <Delete sx={{ fontSize: 16 }} />
          </Button>
        </div>
      </div>,
      <div key={`${itemId}-stock`} style={controlContainerStyle}>
        <Button
          variant="ghost"
          small
          aria-label="Disminuir stock"
          style={fixedButtonStyle}
          onClick={() => ajustarStock(prod.idProducto, -1)}
        >
          −
        </Button>
        <span style={{ 
          color: stockCritico ? '#F44336' : stockBajo ? '#FF9800' : '#4CAF50',
          fontWeight: stockBajo ? '600' : '400',
          background: stockCritico ? '#FFEBEE' : stockBajo ? '#FFF3E0' : 'transparent',
          padding: stockBajo ? '0.25rem 0.5rem' : '0',
          borderRadius: stockBajo ? '4px' : '0',
          minWidth: '40px',
          display: 'inline-block',
          textAlign: 'center'
        }}>
          {item.cantidadProducto || 0}
        </span>
        <Button
          variant="ghost"
          small
          aria-label="Aumentar stock"
          style={fixedButtonStyle}
          onClick={() => ajustarStock(prod.idProducto, 1)}
        >
          +
        </Button>
      </div>,
      <div key={`${itemId}-precio`} style={controlContainerStyle}>
        <Button
          variant="ghost"
          small
          aria-label="Disminuir precio"
          style={fixedButtonStyle}
          onClick={() => actualizarPrecio(prod.idProducto, -1000)}
        >
          −
        </Button>
        <span style={{ fontWeight: '600', color: 'var(--brand)', minWidth: '80px', display: 'inline-block', textAlign: 'center' }}>
          ${(prod.precio || 0).toLocaleString('es-CL')}
        </span>
        <Button
          variant="ghost"
          small
          aria-label="Aumentar precio"
          style={fixedButtonStyle}
          onClick={() => actualizarPrecio(prod.idProducto, 1000)}
        >
          +
        </Button>
      </div>,
      <select 
        key={`${itemId}-categoria`}
        value={prod.categoria?.idCategoria || ''} 
        onChange={(e) => actualizarCategoria(prod.idProducto, e.target.value)}
        style={{ 
          height: '62px', 
          padding: '0 1.1rem', 
          borderRadius: '8px', 
          border: '1px solid var(--border)', 
          fontSize: '1rem',
          background: 'var(--panel)'
        }}
      >
        <option value="">Sin categoría</option>
        {categoryOptions.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>,
      <span key={`${itemId}-fecha`}>{fechaFormateada}</span>
    ]
  }).filter(Boolean) // Filtrar nulls por si hay items sin ID

  if (loading) {
    return <div className="stack"><Card title="Cargando..."><p>Obteniendo inventario...</p></Card></div>
  }

  return (
    <div className="stack">
      <Card title="Resumen de Inventario" subtitle="Vista general del stock y productos" accent="accent">
        <div className="stats">
          {resumen.map((r, index) => (
            <div key={r.label} className="stat">
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                {r.icon}
                <span style={{
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  background: r.trend === 'up' ? '#E8F5E8' : r.trend === 'down' ? '#FFEBEE' : '#F3E5F5',
                  color: r.trend === 'up' ? '#2E7D32' : r.trend === 'down' ? '#C62828' : '#7B1FA2'
                }}>
                  {r.trend === 'up' ? '↑' : r.trend === 'down' ? '↓' : '→'}
                </span>
              </div>
              <span className="stat-label">{r.label}</span>
              <span className="stat-value">{r.value}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Gestión de Inventario" subtitle="Administra todos los productos en stock">
        {/* MEJORA: Filtros mejorados */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr auto', 
          gap: '1rem', 
          alignItems: 'flex-end', 
          marginBottom: '1.5rem' 
        }}>
          <div>
            <label className="field-label">
              <Search sx={{ fontSize: 20, marginRight: 1 }} />
              Buscar Producto
            </label>
            <input 
              type="text" 
              placeholder="Nombre del producto..." 
              value={filtro.buscar}
              onChange={(e) => {
                setFiltro({ ...filtro, buscar: e.target.value })
                buscarProductos(e.target.value)
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid var(--border)',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
          </div>
          
          <div>
            <label className="field-label">
              <Category sx={{ fontSize: 20, marginRight: 1 }} />
              Filtrar por Categoría
            </label>
            <select
              value={filtro.categoria}
              onChange={(e) => {
                setFiltro({ ...filtro, categoria: e.target.value })
                filtrarPorCategoria(e.target.value)
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid var(--border)',
                borderRadius: '8px',
                fontSize: '1rem',
                background: 'var(--panel)'
              }}
            >
              <option value="all">Todas las categorías</option>
              {categoryOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label" style={{ opacity: 0 }}>Filtros</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button 
                variant={filtro.stockBajo ? 'primary' : 'ghost'} 
                small 
                onClick={() => setFiltro({ ...filtro, stockBajo: !filtro.stockBajo })}
              >
                <Warning sx={{ fontSize: 20 }} />
                Bajo Stock
              </Button>
              <Button variant="ghost" small onClick={cargarDatos}>
                <Refresh sx={{ fontSize: 20 }} />
                Actualizar
              </Button>
            </div>
          </div>
        </div>

        <Toolbar style={{ marginBottom: '1.5rem' }}>
          <Button onClick={() => { setProductoEdit(null); setShowForm(true); }}>
            <Add sx={{ fontSize: 20 }} />
            Nuevo producto
          </Button>
          <Button variant="ghost" onClick={() => setShowAjuste(true)}>
            Ajuste de stock
          </Button>
          <div style={{ flex: 1 }} />
          <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
            Mostrando {inventarioFiltrado.length} de {inventario.length} productos
          </span>
        </Toolbar>
        
        <div style={{ marginTop: '1.5rem' }}>
          <Table 
            columns={['Producto', 'Stock', 'Precio', 'Categoría', 'Último mov.']} 
            rows={filas} 
          />
        </div>
      </Card>

      {/* Modal para crear/editar producto */}
      {showForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '1rem',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'var(--panel)',
            padding: '2rem',
            borderRadius: '16px',
            minWidth: '500px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            border: '2px solid var(--border)'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem', 
              marginBottom: '1.5rem',
              paddingBottom: '1rem',
              borderBottom: '2px solid var(--border)'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, var(--brand), var(--brand-2))',
                padding: '0.75rem',
                borderRadius: '12px',
                color: 'white'
              }}>
                <Inventory />
              </div>
              <h3 style={{ margin: 0, color: 'var(--text)', fontSize: '1.5rem' }}>
                {productoEdit ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
            </div>
            
            <form onSubmit={productoEdit ? handleActualizarProducto : handleCrearProducto} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <label>
                <span style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)', fontWeight: '500' }}>
                  Nombre *
                </span>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    background: 'var(--panel)'
                  }}
                />
              </label>

              <label>
                <span style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)', fontWeight: '500' }}>
                  Descripción
                </span>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    background: 'var(--panel)',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <label>
                  <span style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)', fontWeight: '500' }}>
                    Precio *
                  </span>
                  <input
                    type="number"
                    value={formData.precio}
                    onChange={(e) => setFormData({ ...formData, precio: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="100"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      background: 'var(--panel)'
                    }}
                  />
                </label>

                <label>
                  <span style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)', fontWeight: '500' }}>
                    Stock Inicial
                  </span>
                  <input
                    type="number"
                    value={formData.cantidad}
                    onChange={(e) => setFormData({ ...formData, cantidad: parseInt(e.target.value) || 0 })}
                    min="0"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      background: 'var(--panel)'
                    }}
                  />
                </label>
              </div>

              <label>
                <span style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)', fontWeight: '500' }}>
                  Categoría
                </span>
                <select
                  value={formData.idCategoria}
                  onChange={(e) => setFormData({ ...formData, idCategoria: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    background: 'var(--panel)'
                  }}
                >
                  <option value="">Seleccionar categoría</option>
                  {categoryOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setProductoEdit(null); }}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {productoEdit ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para ajuste de stock */}
      {showAjuste && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '1rem',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'var(--panel)',
            padding: '2rem',
            borderRadius: '16px',
            minWidth: '400px',
            maxWidth: '90vw',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            border: '2px solid var(--border)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Ajuste de Stock</h3>
            
            <form onSubmit={handleAjusteStock} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label>
                <span style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)' }}>
                  Producto *
                </span>
                <select
                  value={ajusteData.idProducto}
                  onChange={(e) => setAjusteData({ ...ajusteData, idProducto: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="">Seleccionar producto</option>
                  {productos.map(prod => (
                    <option key={prod.idProducto} value={prod.idProducto}>
                      {prod.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)' }}>
                  Cantidad a ajustar *
                </span>
                <input
                  type="number"
                  value={ajusteData.cantidad}
                  onChange={(e) => setAjusteData({ ...ajusteData, cantidad: parseInt(e.target.value) || 0 })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
                <small style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                  Use números negativos para disminuir el stock
                </small>
              </label>

              <label>
                <span style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)' }}>
                  Motivo del ajuste
                </span>
                <input
                  type="text"
                  value={ajusteData.motivo}
                  onChange={(e) => setAjusteData({ ...ajusteData, motivo: e.target.value })}
                  placeholder="Ej: Ajuste físico, Daño, etc."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </label>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <Button type="button" variant="ghost" onClick={() => setShowAjuste(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Aplicar Ajuste
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MEJORA: Modal de detalles del producto */}
      {showDetalles && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '1rem',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'var(--panel)',
            padding: '2rem',
            borderRadius: '16px',
            minWidth: '400px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            border: '2px solid var(--border)'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem', 
              marginBottom: '1.5rem',
              paddingBottom: '1rem',
              borderBottom: '2px solid var(--border)'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, var(--brand), var(--brand-2))',
                padding: '0.75rem',
                borderRadius: '12px',
                color: 'white'
              }}>
                <Visibility />
              </div>
              <h3 style={{ margin: 0, color: 'var(--text)', fontSize: '1.5rem' }}>
                Detalles del Producto
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <strong style={{ color: 'var(--text)' }}>Nombre:</strong>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.1rem' }}>
                  {showDetalles.producto.nombre}
                </p>
              </div>

              {showDetalles.producto.descripcion && (
                <div>
                  <strong style={{ color: 'var(--text)' }}>Descripción:</strong>
                  <p style={{ margin: '0.5rem 0 0 0', color: 'var(--muted)' }}>
                    {showDetalles.producto.descripcion}
                  </p>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <strong style={{ color: 'var(--text)' }}>Precio:</strong>
                  <p style={{ margin: '0.5rem 0 0 0', color: 'var(--brand)', fontWeight: '600' }}>
                    ${showDetalles.producto.precio?.toLocaleString('es-CL')}
                  </p>
                </div>

                <div>
                  <strong style={{ color: 'var(--text)' }}>Stock Actual:</strong>
                  <p style={{ 
                    margin: '0.5rem 0 0 0', 
                    color: showDetalles.inventario?.cantidadProducto <= 5 ? '#F44336' : 
                           showDetalles.inventario?.cantidadProducto <= 10 ? '#FF9800' : '#4CAF50',
                    fontWeight: '600'
                  }}>
                    {showDetalles.inventario?.cantidadProducto || 0} unidades
                  </p>
                </div>
              </div>

              {showDetalles.producto.categoria && (
                <div>
                  <strong style={{ color: 'var(--text)' }}>Categoría:</strong>
                  <p style={{ margin: '0.5rem 0 0 0', color: 'var(--muted)' }}>
                    {showDetalles.producto.categoria.nombre}
                  </p>
                </div>
              )}

              {showDetalles.inventario?.fechaActualizacion && (
                <div>
                  <strong style={{ color: 'var(--text)' }}>Última Actualización:</strong>
                  <p style={{ margin: '0.5rem 0 0 0', color: 'var(--muted)' }}>
                    {new Date(showDetalles.inventario.fechaActualizacion).toLocaleDateString('es-CL')}
                  </p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <Button variant="ghost" onClick={() => setShowDetalles(null)}>
                Cerrar
              </Button>
              <Button onClick={() => {
                handleEditarProducto(showDetalles.producto)
                setShowDetalles(null)
              }}>
                Editar Producto
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* NUEVO: Modal de confirmación para eliminar producto */}
      {showConfirmDelete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '1rem',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'var(--panel)',
            padding: '2rem',
            borderRadius: '16px',
            minWidth: '400px',
            maxWidth: '90vw',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            border: '2px solid var(--border)'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem', 
              marginBottom: '1.5rem',
              paddingBottom: '1rem',
              borderBottom: '2px solid var(--border)'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, var(--error), #E57373)',
                padding: '0.75rem',
                borderRadius: '12px',
                color: 'white'
              }}>
                <Warning sx={{ fontSize: 24 }} />
              </div>
              <h3 style={{ margin: 0, color: 'var(--text)', fontSize: '1.5rem' }}>
                Confirmar Eliminación
              </h3>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <p style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: 'var(--text)' }}>
                ¿Estás seguro de que deseas eliminar el producto?
              </p>
              <div style={{
                background: 'var(--accent)',
                padding: '1rem',
                borderRadius: '8px',
                borderLeft: '4px solid var(--error)'
              }}>
                <strong style={{ color: 'var(--error)' }}>Producto a eliminar:</strong>
                <p style={{ margin: '0.5rem 0 0 0', fontWeight: '600' }}>
                  {showConfirmDelete.nombre}
                </p>
                {showConfirmDelete.categoria && (
                  <p style={{ margin: '0.25rem 0 0 0', color: 'var(--muted)' }}>
                    Categoría: {showConfirmDelete.categoria.nombre}
                  </p>
                )}
              </div>
              <p style={{ margin: '1rem 0 0 0', color: 'var(--warning)', fontSize: '0.9rem' }}>
                ⚠️ Esta acción no se puede deshacer. Se eliminará el producto y su registro de inventario.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setShowConfirmDelete(null)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => eliminarProducto(showConfirmDelete)}
                style={{ background: 'var(--error)' }}
              >
                <Delete sx={{ fontSize: 20, marginRight: '0.5rem' }} />
                Eliminar Producto
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}