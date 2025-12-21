// Inventario.jsx - COMPLETO CON MATERIALES
import React, { useState, useMemo } from 'react'
import { Card, Toolbar, Button } from '../../components/UI.jsx'
import { Add, Science, Inventory } from '@mui/icons-material'
import { api } from '../../services/api/index.js'
 
// Importar componentes modulares
import { useInventario } from './hooks/useInventario'
import FiltrosInventario from './components/FiltrosInventario'
import TablaInventario from './components/TablaInventario'
import TablaRecetas from './components/TablaRecetas'
import TablaMateriales from './components/TablaMateriales'
import ModalProducto from './components/modals/ModalProducto'
import ModalAjusteStock from './components/modals/ModalAjusteStock'
import ModalDetalles from './components/modals/ModalDetalles'
import ModalConfirmacion from './components/modals/ModalConfirmacion'
import { 
  ModalVerReceta, 
  ModalAgregarMaterial, 
  ModalCalcularCosto, 
  ModalConfirmarEliminacion 
} from './components/modals/ModalesRecetas'
import { 
  ModalMovimiento,
  ModalHistorialMovimientos,
  ModalDetallesMaterial
} from './components/modals/ModalesMateriales'
import { useInventarioMateriales } from './hooks/useInventarioMateriales'

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

  // Hook para materiales
  const {
    materiales: materialesInventario,
    loading: loadingMateriales,
    cargarDatos: cargarDatosMateriales,
    cargarMovimientosPorMaterial,
    registrarEntrada,
    registrarSalida
  } = useInventarioMateriales()

  // Estados de inventario
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

  // Estados de recetas
  const [vistaActual, setVistaActual] = useState('inventario')
  const [showRecetaModal, setShowRecetaModal] = useState(null)
  const [showAgregarMaterialModal, setShowAgregarMaterialModal] = useState(null)
  const [showCostoModal, setShowCostoModal] = useState(null)
  const [deleteConfirmReceta, setDeleteConfirmReceta] = useState(null)
  const [recetaActual, setRecetaActual] = useState([])
  const [costoCalculado, setCostoCalculado] = useState(null)
  const [materiales, setMateriales] = useState([])
  const [filtroRecetas, setFiltroRecetas] = useState({ buscar: '' })
  const [filtroMateriales, setFiltroMateriales] = useState({ buscar: '', stockBajo: false })
  const [formMaterial, setFormMaterial] = useState({
    idMaterial: '',
    cantidad: ''
  })

  // Estados para modales de materiales
  const [showMovimientosModal, setShowMovimientosModal] = useState(null)
  const [showMovimientoModal, setShowMovimientoModal] = useState(null)
  const [showDetallesMaterial, setShowDetallesMaterial] = useState(null)
  const [movimientos, setMovimientos] = useState([])
  const [tipoMovimiento, setTipoMovimiento] = useState('entrada')
  const [formMovimiento, setFormMovimiento] = useState({
    cantidad: '',
    costoUnitario: '',
    observaciones: ''
  })

  // Cargar materiales al cambiar a vista de recetas o materiales
  React.useEffect(() => {
    if ((vistaActual === 'recetas' || vistaActual === 'materiales') && materiales.length === 0) {
      cargarMateriales()
    }
  }, [vistaActual])

  const cargarMateriales = async () => {
    try {
      const materialesData = await api.materiales.getAll()
      setMateriales(materialesData)
      
      // ✅ IMPORTANTE: También recargar los datos del hook
      await cargarDatosMateriales()
    } catch (err) {
      console.error('Error cargando materiales:', err)
    }
  }

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

  const productosFiltrados = useMemo(() =>
    productos.filter(producto =>
      filtroRecetas.buscar === '' ||
      producto.nombre?.toLowerCase().includes(filtroRecetas.buscar.toLowerCase())
    ), [productos, filtroRecetas]
  )

  const materialesFiltrados = useMemo(() =>
    materialesInventario.filter(material => {
      const nombreMatch = filtroMateriales.buscar === '' ||
        material.nombre?.toLowerCase().includes(filtroMateriales.buscar.toLowerCase())
      const stockBajoMatch = !filtroMateriales.stockBajo ||
        (material.stockActual || 0) < (material.stockMinimo || 10)
      
      return nombreMatch && stockBajoMatch
    }), [materialesInventario, filtroMateriales]
  )

  // ========== FUNCIONES DE INVENTARIO ==========
  
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
      console.error('Error al crear producto:', error)
      alert('❌ Error al crear el producto')
    }
  }

  const handleAjusteStock = async (e) => {
    e.preventDefault()
    
    const delta = parseInt(ajusteData.cantidad)
    const idProducto = parseInt(ajusteData.idProducto)
    
    try {
      // Usar ajustarStock del hook (consume materiales)
      await ajustarStock(idProducto, delta)
      
      // ✅ Si fue producción, recargar materiales
      if (delta > 0) {
        await cargarDatosMateriales()
      }
      
      setShowAjuste(false)
      setAjusteData({ idProducto: '', cantidad: 0, motivo: '' })
    } catch (error) {
      console.error('Error al ajustar stock:', error)
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
      alert('✅ Producto actualizado')
    } catch (error) {
      console.error('Error al actualizar producto:', error)
      alert('❌ Error al actualizar el producto')
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

  // ========== FUNCIONES DE RECETAS ==========

  const obtenerRecetaProducto = async (idProducto) => {
    try {
      const receta = await api.recetas.getMaterialesPorProducto(idProducto)
      return receta || []
    } catch (err) {
      console.error('Error obteniendo receta:', err)
      return []
    }
  }

  const handleVerReceta = async (producto) => {
    try {
      const receta = await obtenerRecetaProducto(producto.idProducto)
      setRecetaActual(receta)
      setShowRecetaModal(producto)
    } catch (err) {
      alert('❌ Error al cargar receta')
    }
  }

  const handleEditarReceta = async (producto) => {
    const receta = await obtenerRecetaProducto(producto.idProducto)
    setRecetaActual(receta)
    setShowAgregarMaterialModal(producto)
  }

  const handleAgregarMaterial = async (e) => {
    e.preventDefault()

    if (!formMaterial.idMaterial || !formMaterial.cantidad) {
      alert('⚠️ Complete todos los campos')
      return
    }

    try {
      await api.recetas.agregarMaterial({
        producto: { idProducto: showAgregarMaterialModal.idProducto },
        material: { idMaterial: parseInt(formMaterial.idMaterial) },
        cantidad: parseFloat(formMaterial.cantidad)
      })

      const recetaActualizada = await obtenerRecetaProducto(showAgregarMaterialModal.idProducto)
      setRecetaActual(recetaActualizada)
      setFormMaterial({ idMaterial: '', cantidad: '' })
      alert('✅ Material agregado a la receta')
    } catch (err) {
      alert('❌ Error al agregar material')
    }
  }

  const handleEliminarMaterial = async () => {
    if (!deleteConfirmReceta) return

    try {
      await api.recetas.eliminarMaterial(deleteConfirmReceta.idMaterialProducto)

      const recetaActualizada = await obtenerRecetaProducto(showRecetaModal.idProducto)
      setRecetaActual(recetaActualizada)

      setDeleteConfirmReceta(null)
      alert('✅ Material eliminado de la receta')
    } catch (err) {
      console.error('Error:', err)
      alert('❌ Error al eliminar material')
      setDeleteConfirmReceta(null)
    }
  }

  const handleCalcularCosto = async (producto) => {
    try {
      const costo = await api.recetas.getCostoProducto(producto.idProducto)
      const receta = await obtenerRecetaProducto(producto.idProducto)
      
      setCostoCalculado(costo)
      setRecetaActual(receta)
      setShowCostoModal(producto)
    } catch (err) {
      alert('❌ Error al calcular costo')
    }
  }

  // ========== FUNCIONES DE MATERIALES ==========

  const handleRegistrarMovimiento = async (e) => {
    e.preventDefault()
    
    try {
      if (tipoMovimiento === 'entrada') {
        if (!formMovimiento.costoUnitario) {
          alert('⚠️ El costo unitario es obligatorio para entradas')
          return
        }
        
        await registrarEntrada(
          showMovimientoModal.idMaterial,
          parseFloat(formMovimiento.cantidad),
          parseFloat(formMovimiento.costoUnitario),
          formMovimiento.observaciones
        )
        alert('✅ Entrada registrada')
      } else {
        const stockActual = showMovimientoModal.stockActual || 0
        const cantidadSalida = parseFloat(formMovimiento.cantidad)
        
        if (cantidadSalida > stockActual) {
          alert(`❌ Stock insuficiente. Stock actual: ${stockActual}`)
          return
        }
        
        await registrarSalida(
          showMovimientoModal.idMaterial,
          cantidadSalida,
          formMovimiento.observaciones
        )
        alert('✅ Salida registrada')
      }
      
      // Ya NO es necesario llamar cargarMateriales aquí
      // porque registrarEntrada y registrarSalida ya recargan automáticamente
      
      setShowMovimientoModal(null)
      setFormMovimiento({ cantidad: '', costoUnitario: '', observaciones: '' })
      setTipoMovimiento('entrada')
    } catch (err) {
      console.error('Error al registrar movimiento:', err)
      alert('❌ Error al registrar movimiento')
    }
  }

  if (loading || loadingMateriales) {
    return <div className="stack"><Card><p>Cargando...</p></Card></div>
  }

  return (
    <div className="stack">
      <Card>
        {/* Tabs para cambiar entre vistas */}
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem',
          borderBottom: '2px solid var(--border)',
          marginBottom: '1.5rem'
        }}>
          <Button
            variant={vistaActual === 'inventario' ? 'primary' : 'ghost'}
            onClick={() => setVistaActual('inventario')}
            style={{
              borderRadius: '8px 8px 0 0',
              borderBottom: vistaActual === 'inventario' ? '3px solid var(--brand)' : 'none'
            }}
          >
            📦 Inventario
          </Button>
          <Button
            variant={vistaActual === 'recetas' ? 'primary' : 'ghost'}
            onClick={() => setVistaActual('recetas')}
            style={{
              borderRadius: '8px 8px 0 0',
              borderBottom: vistaActual === 'recetas' ? '3px solid var(--brand)' : 'none'
            }}
          >
            <Science sx={{ fontSize: 18 }} />
            Recetas
          </Button>
          <Button
            variant={vistaActual === 'materiales' ? 'primary' : 'ghost'}
            onClick={() => setVistaActual('materiales')}
            style={{
              borderRadius: '8px 8px 0 0',
              borderBottom: vistaActual === 'materiales' ? '3px solid var(--brand)' : 'none'
            }}
          >
            <Inventory sx={{ fontSize: 18 }} />
            Materiales
          </Button>
        </div>

        {/* VISTA DE INVENTARIO */}
        {vistaActual === 'inventario' && (
          <>
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
          </>
        )}

        {/* VISTA DE RECETAS */}
        {vistaActual === 'recetas' && (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="text"
                placeholder="Buscar producto..."
                value={filtroRecetas.buscar}
                onChange={(e) => setFiltroRecetas(prev => ({ ...prev, buscar: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
            </div>

            <Toolbar style={{ marginBottom: '1.5rem' }}>
              <div style={{ flex: 1 }} />
              <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                Mostrando {productosFiltrados.length} de {productos.length} productos
              </span>
            </Toolbar>

            <TablaRecetas
              productosFiltrados={productosFiltrados}
              handleVerReceta={handleVerReceta}
              handleEditarReceta={handleEditarReceta}
              handleCalcularCosto={handleCalcularCosto}
            />
          </>
        )}

        {/* VISTA DE MATERIALES */}
        {vistaActual === 'materiales' && (
          <>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '2fr auto', 
              gap: '0.75rem',
              marginBottom: '1rem'
            }}>
              <input
                type="text"
                placeholder="Buscar material..."
                value={filtroMateriales.buscar}
                onChange={(e) => setFiltroMateriales(prev => ({ ...prev, buscar: e.target.value }))}
                style={{
                  padding: '0.75rem',
                  border: '2px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />

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
                  checked={filtroMateriales.stockBajo}
                  onChange={(e) => setFiltroMateriales(prev => ({ ...prev, stockBajo: e.target.checked }))}
                />
                Bajo stock
              </label>
            </div>

            <Toolbar style={{ marginBottom: '1.5rem' }}>
              <div style={{ flex: 1 }} />
              <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                {materialesFiltrados.length} de {materialesInventario.length} materiales
              </span>
            </Toolbar>

            <TablaMateriales
              materialesFiltrados={materialesFiltrados}
              setShowMovimientoModal={setShowMovimientoModal}
              handleVerMovimientos={async (material) => {
                try {
                  const movimientosData = await cargarMovimientosPorMaterial(material.idMaterial)
                  setMovimientos(movimientosData)
                  setShowMovimientosModal(material)
                } catch (err) {
                  alert('❌ Error al cargar movimientos')
                }
              }}
              setShowDetallesMaterial={setShowDetallesMaterial}
            />
          </>
        )}
      </Card>

      {/* MODALES DE INVENTARIO */}
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

      {/* MODALES DE RECETAS */}
      <ModalVerReceta
        showRecetaModal={showRecetaModal}
        setShowRecetaModal={setShowRecetaModal}
        recetaActual={recetaActual}
        setShowAgregarMaterialModal={setShowAgregarMaterialModal}
      />

      <ModalAgregarMaterial
        showAgregarMaterialModal={showAgregarMaterialModal}
        setShowAgregarMaterialModal={setShowAgregarMaterialModal}
        recetaActual={recetaActual}
        materiales={materiales}
        formMaterial={formMaterial}
        setFormMaterial={setFormMaterial}
        handleAgregarMaterial={handleAgregarMaterial}
        setDeleteConfirmReceta={setDeleteConfirmReceta}
      />

      <ModalCalcularCosto
        showCostoModal={showCostoModal}
        setShowCostoModal={setShowCostoModal}
        recetaActual={recetaActual}
        costoCalculado={costoCalculado}
      />

      <ModalConfirmarEliminacion
        deleteConfirmReceta={deleteConfirmReceta}
        setDeleteConfirmReceta={setDeleteConfirmReceta}
        handleEliminarMaterial={handleEliminarMaterial}
      />

      {/* MODALES DE MATERIALES */}
      <ModalMovimiento
        showMovimientoModal={showMovimientoModal}
        setShowMovimientoModal={setShowMovimientoModal}
        tipoMovimiento={tipoMovimiento}
        setTipoMovimiento={setTipoMovimiento}
        formMovimiento={formMovimiento}
        setFormMovimiento={setFormMovimiento}
        handleRegistrarMovimiento={handleRegistrarMovimiento}
      />

      <ModalHistorialMovimientos
        showMovimientosModal={showMovimientosModal}
        setShowMovimientosModal={setShowMovimientosModal}
        movimientos={movimientos}
      />

      <ModalDetallesMaterial
        showDetallesMaterial={showDetallesMaterial}
        setShowDetallesMaterial={setShowDetallesMaterial}
      />
    </div>
  )
}