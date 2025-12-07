// Inventario.jsx (con stock editable que calcula la diferencia)
import React, { useState, useMemo } from 'react'
import { Card, Toolbar, Button, Table } from '../../components/UI.jsx'
import { Add, Edit, Delete, Visibility } from '@mui/icons-material'
import { api } from '../../services/api/index.js'
import { useInventario } from './hooks/useInventario'

export default function Inventario() {
  const {
    inventario,
    productos,
    categorias,
    loading,
    cargarDatos
  } = useInventario()

  const [showForm, setShowForm] = useState(false)
  const [showDetalles, setShowDetalles] = useState(null)
  const [showConfirmDelete, setShowConfirmDelete] = useState(null)
  const [productoEdit, setProductoEdit] = useState(null)
  const [filtro, setFiltro] = useState({ buscar: '', categoria: 'all', stockBajo: false })
  
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: 0,
    idCategoria: '',
    cantidad: 0
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
      alert('✅ Producto creado')
    } catch (error) {
      alert('❌ Error al crear producto')
    }
  }

  const handleEditarProducto = (producto) => {
    setProductoEdit(producto)
    const stockActual = inventario.find(i => i.producto?.idProducto === producto.idProducto)?.cantidadProducto || 0
    setFormData({
      nombre: producto.nombre || '',
      descripcion: producto.descripcion || '',
      precio: producto.precio || 0,
      idCategoria: producto.categoria?.idCategoria || '',
      cantidad: stockActual
    })
    setShowForm(true)
  }

  const handleActualizarProducto = async (e) => {
    e.preventDefault()
    try {
      // Actualizar producto
      await api.productos.update(productoEdit.idProducto, {
        ...productoEdit,
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        precio: parseFloat(formData.precio),
        categoria: { idCategoria: parseInt(formData.idCategoria) }
      })

      // Actualizar stock - calcular la diferencia
      const stockActual = inventario.find(i => i.producto?.idProducto === productoEdit.idProducto)?.cantidadProducto || 0
      const stockNuevo = parseInt(formData.cantidad)
      const diferencia = stockNuevo - stockActual

      if (diferencia !== 0) {
        await api.inventario.ajustarCantidad(
          productoEdit.idProducto,
          diferencia
        )
      }

      setShowForm(false)
      setProductoEdit(null)
      setFormData({ nombre: '', descripcion: '', precio: 0, idCategoria: '', cantidad: 0 })
      await cargarDatos()
      alert('✅ Producto actualizado')
    } catch (error) {
      console.error('Error:', error)
      alert('❌ Error al actualizar')
    }
  }

  const handleEliminarProducto = async () => {
    try {
      await api.productos.delete(showConfirmDelete.idProducto)
      setShowConfirmDelete(null)
      await cargarDatos()
      alert('✅ Producto eliminado')
    } catch (error) {
      alert('❌ Error al eliminar')
    }
  }

  const rows = inventarioFiltrado.map(item => {
    const producto = item.producto || {}
    return [
      producto.nombre || '-',
      producto.categoria?.nombre || '-',
      `$ ${(producto.precio || 0).toLocaleString('es-CL')}`,
      item.cantidadProducto || 0,
      <div key={producto.idProducto} style={{ display: 'flex', gap: '0.5rem' }}>
        <Button small variant="ghost" onClick={() => setShowDetalles({ producto, inventario: item })}>
          <Visibility sx={{ fontSize: 18 }} />
        </Button>
        <Button small variant="ghost" onClick={() => handleEditarProducto(producto)}>
          <Edit sx={{ fontSize: 18 }} />
        </Button>
        <Button 
          small 
          variant="ghost" 
          onClick={() => setShowConfirmDelete(producto)}
          style={{ background: 'var(--error)', color: 'white' }}
        >
          <Delete sx={{ fontSize: 18 }} />
        </Button>
      </div>
    ]
  })

  if (loading) {
    return (
      <div className="stack" style={{ padding: '0.75rem' }}>
        <Card>
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
            Cargando...
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="stack" style={{ padding: '0.75rem' }}>
      <Card>
        {/* FILTROS */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '2fr 1fr auto', 
          gap: '0.75rem',
          marginBottom: '1rem'
        }}>
          <input
            type="text"
            placeholder="Buscar producto..."
            value={filtro.buscar}
            onChange={(e) => setFiltro(prev => ({ ...prev, buscar: e.target.value }))}
            style={{
              padding: '0.5rem',
              border: '2px solid var(--border)',
              borderRadius: '6px',
              fontSize: '0.9rem'
            }}
          />
          
          <select
            value={filtro.categoria}
            onChange={(e) => setFiltro(prev => ({ ...prev, categoria: e.target.value }))}
            style={{
              padding: '0.5rem',
              border: '2px solid var(--border)',
              borderRadius: '6px',
              fontSize: '0.9rem'
            }}
          >
            <option value="all">Todas las categorías</option>
            {categorias.map(cat => (
              <option key={cat.idCategoria} value={cat.idCategoria}>
                {cat.nombre}
              </option>
            ))}
          </select>

          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            fontSize: '0.9rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}>
            <input
              type="checkbox"
              checked={filtro.stockBajo}
              onChange={(e) => setFiltro(prev => ({ ...prev, stockBajo: e.target.checked }))}
            />
            Bajo stock
          </label>
        </div>

        {/* TOOLBAR */}
        <Toolbar style={{ marginBottom: '1rem' }}>
          <Button onClick={() => { setProductoEdit(null); setShowForm(true); }}>
            <Add sx={{ fontSize: 18 }} />
            Nuevo
          </Button>
          <div style={{ flex: 1 }} />
          <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
            {inventarioFiltrado.length} de {inventario.length} productos
          </span>
        </Toolbar>

        {/* TABLA */}
        <Table
          columns={['Producto', 'Categoría', 'Precio', 'Stock', 'Acciones']}
          rows={rows}
        />
      </Card>

      {/* MODAL FORMULARIO */}
      {showForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--panel)',
            padding: '2rem',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '500px',
            border: '2px solid var(--border)'
          }}>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.3rem' }}>
              {productoEdit ? 'Editar' : 'Nuevo'} Producto
            </h3>
            
            <form onSubmit={productoEdit ? handleActualizarProducto : handleCrearProducto}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  rows="2"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>
                    Precio *
                  </label>
                  <input
                    type="number"
                    value={formData.precio}
                    onChange={(e) => setFormData(prev => ({ ...prev, precio: e.target.value }))}
                    required
                    min="0"
                    step="1"
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
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>
                    {productoEdit ? 'Stock *' : 'Stock inicial *'}
                  </label>
                  <input
                    type="number"
                    value={formData.cantidad}
                    onChange={(e) => setFormData(prev => ({ ...prev, cantidad: e.target.value }))}
                    required
                    min="0"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>
                  Categoría *
                </label>
                <select
                  value={formData.idCategoria}
                  onChange={(e) => setFormData(prev => ({ ...prev, idCategoria: e.target.value }))}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="">Seleccione categoría</option>
                  {categorias.map(cat => (
                    <option key={cat.idCategoria} value={cat.idCategoria}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => {
                    setShowForm(false)
                    setProductoEdit(null)
                    setFormData({ nombre: '', descripcion: '', precio: 0, idCategoria: '', cantidad: 0 })
                  }}
                >
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

      {/* MODAL DETALLES */}
      {showDetalles && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--panel)',
            padding: '2rem',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '500px',
            border: '2px solid var(--border)'
          }}>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.3rem' }}>
              {showDetalles.producto.nombre}
            </h3>

            <div style={{ marginBottom: '1rem' }}>
              <strong>Descripción:</strong> {showDetalles.producto.descripcion || '-'}
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Categoría:</strong> {showDetalles.producto.categoria?.nombre || '-'}
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Precio:</strong> $ {(showDetalles.producto.precio || 0).toLocaleString('es-CL')}
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Stock:</strong> {showDetalles.inventario?.cantidadProducto || 0} unidades
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <Button variant="ghost" onClick={() => setShowDetalles(null)}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR ELIMINACIÓN */}
      {showConfirmDelete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1001
        }}>
          <div style={{
            background: 'var(--panel)',
            padding: '2rem',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '400px',
            textAlign: 'center',
            border: '2px solid var(--border)'
          }}>
            <Delete sx={{ fontSize: 48, color: '#F44336', marginBottom: '1rem' }} />
            
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.3rem' }}>
              ¿Eliminar "{showConfirmDelete.nombre}"?
            </h3>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem' }}>
              <Button variant="ghost" onClick={() => setShowConfirmDelete(null)}>
                Cancelar
              </Button>
              <Button onClick={handleEliminarProducto} style={{ background: 'var(--error)' }}>
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}