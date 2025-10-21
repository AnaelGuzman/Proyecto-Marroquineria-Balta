// hooks/useInventario.js
import { useState, useEffect } from 'react'
import { api } from '../../../services/api/index'

export function useInventario() {
  const [inventario, setInventario] = useState([])
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [bajoStock, setBajoStock] = useState([])
  const [filtro, setFiltro] = useState({ 
    buscar: '', 
    categoria: 'all',
    stockBajo: false 
  })

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
    } catch (error) {
      console.error('Error al cargar inventario:', error)
    } finally {
      setLoading(false)
    }
  }

  const buscarProductos = async (termino) => {
    if (!termino.trim()) {
      cargarDatos()
      return
    }
    
    try {
      const resultados = await api.productos.buscar(termino)
      setProductos(resultados)
      
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

  const eliminarProducto = async (producto) => {
    try {
      const inventarioItem = inventario.find(i => i.producto?.idProducto === producto.idProducto)
      if (inventarioItem) {
        await api.inventario.delete(inventarioItem.idInventario)
      }
      
      await api.productos.delete(producto.idProducto)
      
      await cargarDatos()
      alert('Producto eliminado exitosamente')
      return true
    } catch (error) {
      console.error('Error al eliminar producto:', error)
      alert('Error al eliminar el producto: ' + (error.message || 'Error desconocido'))
      return false
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  return {
    inventario,
    productos,
    categorias,
    loading,
    bajoStock,
    filtro,
    setFiltro,
    cargarDatos,
    buscarProductos,
    filtrarPorCategoria,
    ajustarStock,
    actualizarPrecio,
    actualizarCategoria,
    eliminarProducto
  }
}