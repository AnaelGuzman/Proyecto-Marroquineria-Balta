// Inventario.jsx (archivo principal simplificado)
import React, { useState, useMemo } from 'react'
import { Card, Toolbar, Button } from '../../components/UI.jsx'
import { Add } from '@mui/icons-material'
import {api} from '../../services/api/index.js'
 
// Importar componentes modulares
import { useInventario } from './hooks/useInventario'
import ResumenInventario from './components/ResumenInventario'
import FiltrosInventario from './components/FiltrosInventario'
import TablaInventario from './components/TablaInventario'
import ModalProducto from './components/modals/ModalProducto'
import ModalAjusteStock from './components/modals/ModalAjusteStock'
import ModalDetalles from './components/modals/ModalDetalles'
import ModalConfirmacion from './components/modals/ModalConfirmacion'

export default function Inventario() {
  const {
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
  } = useInventario()

  const [showForm, setShowForm] = useState(false)
  const [showAjuste, setShowAjuste] = useState(false)
  const [showDetalles, setShowDetalles] = useState(null)
  const [showConfirmDelete, setShowConfirmDelete] = useState(null)
  const [productoEdit, setProductoEdit] = useState(null)
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

  const inventarioFiltrado = useMemo(() => 
    inventario.filter(item => {
      const producto = item.producto || {}
      const nombreMatch = filtro.buscar === '' || 
        producto.nombre?.toLowerCase().includes(filtro.buscar.toLowerCase())
      const categoriaMatch = filtro.categoria === 'all' || 
        producto.categoria?.idCategoria === parseInt(filtro.categoria)
      const stockBajoMatch = !filtro.stockBajo || item.cantidadProducto <= 10
      
      return nombreMatch && categoriaMatch && stockBajoMatch
    }), [inventario, filtro]
  )

  const handleCrearProducto = async (e) => {
    e.preventDefault()
    try {
      const productoData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        precio: parseFloat(formData.precio),
        categoria: { idCategoria: parseInt(formData.idCategoria) }
      }

      const nuevoProducto = await api.productos.create(productoData)
      
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

  const handleVerDetalles = (producto) => {
    const inventarioItem = inventario.find(i => i.producto?.idProducto === producto.idProducto)
    setShowDetalles({
      producto,
      inventario: inventarioItem
    })
  }

  const handleEliminarProducto = async (producto) => {
    const success = await eliminarProducto(producto)
    if (success) {
      setShowConfirmDelete(null)
    }
  }

  if (loading) {
    return <div className="stack"><Card title="Cargando..."><p>Obteniendo inventario...</p></Card></div>
  }

  return (
    <div className="stack">
      <ResumenInventario 
        productos={productos} 
        bajoStock={bajoStock} 
        inventario={inventario} 
      />

      <Card title="Gestión de Inventario" subtitle="Administra todos los productos en stock">
        <FiltrosInventario
          filtro={filtro}
          setFiltro={setFiltro}
          categorias={categorias}
          buscarProductos={buscarProductos}
          filtrarPorCategoria={filtrarPorCategoria}
          cargarDatos={cargarDatos}
          inventario={inventario}
          inventarioFiltrado={inventarioFiltrado}
        />

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
        
        <TablaInventario
          inventarioFiltrado={inventarioFiltrado}
          categorias={categorias}
          ajustarStock={ajustarStock}
          actualizarPrecio={actualizarPrecio}
          actualizarCategoria={actualizarCategoria}
          handleVerDetalles={handleVerDetalles}
          handleEditarProducto={handleEditarProducto}
          setShowConfirmDelete={setShowConfirmDelete}
        />
      </Card>

      {/* Modales */}
      <ModalProducto
        showForm={showForm}
        setShowForm={setShowForm}
        productoEdit={productoEdit}
        setProductoEdit={setProductoEdit}
        formData={formData}
        setFormData={setFormData}
        categorias={categorias}
        handleCrearProducto={handleCrearProducto}
        handleActualizarProducto={handleActualizarProducto}
      />

      <ModalAjusteStock
        showAjuste={showAjuste}
        setShowAjuste={setShowAjuste}
        ajusteData={ajusteData}
        setAjusteData={setAjusteData}
        productos={productos}
        handleAjusteStock={handleAjusteStock}
      />

      <ModalDetalles
        showDetalles={showDetalles}
        setShowDetalles={setShowDetalles}
        handleEditarProducto={handleEditarProducto}
      />

      <ModalConfirmacion
        showConfirmDelete={showConfirmDelete}
        setShowConfirmDelete={setShowConfirmDelete}
        handleEliminarProducto={handleEliminarProducto}
      />
    </div>
  )
}