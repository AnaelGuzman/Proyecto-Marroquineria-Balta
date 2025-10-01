import React, { useState, useEffect } from 'react'
import { Card, Table, Toolbar, Button, Field } from '../components/UI.jsx'
import { api } from '../services/api/index.js'

export default function Inventario() {
  const [inventario, setInventario] = useState([])
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState({ buscar: '', categoria: 'all' })

  const categoryOptions = categorias.map(c => ({ 
    value: c.idCategoria, 
    label: c.nombre 
  }))

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      const [inv, prods, cats] = await Promise.all([
        api.inventario.getAll(),
        api.productos.getAll(),
        api.categorias.getAll()
      ])
      setInventario(inv)
      setProductos(prods)
      setCategorias(cats)
    } catch (error) {
      console.error('Error al cargar inventario:', error)
    } finally {
      setLoading(false)
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
      await cargarDatos()
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

  const inventarioFiltrado = inventario.filter(item => {
    const producto = item.producto || {}
    const nombreMatch = filtro.buscar === '' || 
      producto.nombre?.toLowerCase().includes(filtro.buscar.toLowerCase())
    const categoriaMatch = filtro.categoria === 'all' || 
      producto.categoria?.idCategoria === parseInt(filtro.categoria)
    return nombreMatch && categoriaMatch
  })

  const filas = inventarioFiltrado.map(item => {
    const prod = item.producto || {}
    
    // Formatear fecha
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
    
    return [
      <div key="prod" style={{ display: 'flex', alignItems: 'center', height: '62px' }}>
        <span>{prod.nombre || 'Sin nombre'}</span>
        <Button
          variant="ghost"
          small
          style={{ marginLeft: '0.5rem', ...fixedButtonStyle }}
          aria-label="Editar producto"
        >
          ✎
        </Button>
      </div>,
      <div key="stock" style={controlContainerStyle}>
        <Button
          variant="ghost"
          small
          aria-label="Disminuir stock"
          style={fixedButtonStyle}
          onClick={() => ajustarStock(prod.idProducto, -1)}
        >
          −
        </Button>
        <span>{item.cantidadProducto || 0}</span>
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
      <div key="price" style={controlContainerStyle}>
        <Button
          variant="ghost"
          small
          aria-label="Disminuir precio"
          style={fixedButtonStyle}
          onClick={() => actualizarPrecio(prod.idProducto, -1000)}
        >
          −
        </Button>
        <span>${(prod.precio || 0).toLocaleString('es-CL')}</span>
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
        key="cat" 
        value={prod.categoria?.idCategoria || ''} 
        onChange={(e) => actualizarCategoria(prod.idProducto, e.target.value)}
        style={{ height: '62px', padding: '0 1.1rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1.18rem' }}
      >
        <option value="">Sin categoría</option>
        {categoryOptions.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>,
      fechaFormateada
    ]
  })

  if (loading) {
    return <div className="stack"><Card title="Cargando..."><p>Obteniendo inventario...</p></Card></div>
  }

  return (
    <div className="stack">
      <Card title="Inventario" subtitle="Agregue, edite y administre los productos en stock">
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '1rem' }}>
          <Field 
            label="Buscar" 
            type="text" 
            placeholder="Nombre o categoría" 
            value={filtro.buscar}
            onChange={(e) => setFiltro({ ...filtro, buscar: e.target.value })}
          />
          <Field
            label="Categoría"
            type="select"
            value={filtro.categoria}
            onChange={(e) => setFiltro({ ...filtro, categoria: e.target.value })}
            options={[
              { value: 'all', label: 'Todas' },
              ...categoryOptions
            ]}
          />
        </div>
        <Toolbar style={{ marginBottom: '1.5rem' }}>
          <Button>Nuevo producto</Button>
          <Button variant="ghost">Ajuste de stock</Button>
        </Toolbar>
        <div style={{ marginTop: '1.5rem' }}>
          <Table 
            columns={['Producto', 'Stock', 'Precio', 'Categoría', 'Último mov.']} 
            rows={filas} 
            style={{ background: 'var(--panel)', borderColor: 'var(--border)' }} 
          />
        </div>
      </Card>
    </div>
  )
}