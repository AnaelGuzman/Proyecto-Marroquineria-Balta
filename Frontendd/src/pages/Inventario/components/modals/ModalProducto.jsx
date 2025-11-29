// components/modals/ModalProducto.jsx
import React, { useState, useEffect } from 'react'
import { Button } from '../../../../components/UI'
import { Inventory, Add, Delete, Calculate } from '@mui/icons-material'
import { api } from '../../../../services/api/index.js'

export default function ModalProducto({
  showForm,
  setShowForm,
  productoEdit,
  setProductoEdit,
  formData,
  setFormData,
  categorias,
  handleCrearProducto,
  handleActualizarProducto
}) {
  const categoryOptions = categorias.map(c => ({ 
    value: c.idCategoria, 
    label: c.nombre 
  }))

  const [materiales, setMateriales] = useState([])
  const [receta, setReceta] = useState([])
  const [costoCalculado, setCostoCalculado] = useState(0)
  const [loadingMateriales, setLoadingMateriales] = useState(false)

  // Cargar materiales disponibles
  useEffect(() => {
    const cargarMateriales = async () => {
      if (!showForm) return
      
      setLoadingMateriales(true)
      try {
        const materialesData = await api.materiales.getAll()
        setMateriales(materialesData || [])
      } catch (error) {
        console.error('Error al cargar materiales:', error)
        setMateriales([])
      } finally {
        setLoadingMateriales(false)
      }
    }

    cargarMateriales()
  }, [showForm])

  // Cargar receta existente si estamos editando
  useEffect(() => {
    const cargarRecetaExistente = async () => {
      if (productoEdit && productoEdit.idProducto) {
        try {
          const recetaData = await api.recetas.getMaterialesPorProducto(productoEdit.idProducto)
          setReceta(recetaData || [])
        } catch (error) {
          console.error('Error al cargar receta:', error)
          setReceta([])
        }
      } else {
        setReceta([])
      }
    }

    cargarRecetaExistente()
  }, [productoEdit])

  // Calcular costo total cuando cambia la receta
  useEffect(() => {
    const calcularCosto = () => {
      const total = receta.reduce((sum, item) => {
        return sum + (item.costoCalculado || 0)
      }, 0)
      setCostoCalculado(total)
    }

    calcularCosto()
  }, [receta])

  const agregarMaterial = () => {
    setReceta([...receta, {
      idMaterial: '',
      cantidad: 1,
      material: null,
      costoCalculado: 0
    }])
  }

  const eliminarMaterial = (index) => {
    const nuevaReceta = receta.filter((_, i) => i !== index)
    setReceta(nuevaReceta)
  }

  const actualizarMaterial = (index, campo, valor) => {
    const nuevaReceta = [...receta]
    nuevaReceta[index] = { ...nuevaReceta[index], [campo]: valor }
    
    // Si cambió el material, buscar información del material
    if (campo === 'idMaterial' && valor) {
      const materialSeleccionado = materiales.find(m => m.idMaterial === parseInt(valor))
      if (materialSeleccionado) {
        nuevaReceta[index].material = materialSeleccionado
        // Calcular costo inicial
        const cantidad = nuevaReceta[index].cantidad || 1
        const costoUnitario = materialSeleccionado.costoPromedio || 0
        nuevaReceta[index].costoCalculado = cantidad * costoUnitario
      }
    }
    
    // Si cambió la cantidad, recalcular costo
    if (campo === 'cantidad' && nuevaReceta[index].material) {
      const cantidad = parseFloat(valor) || 0
      const costoUnitario = nuevaReceta[index].material.costoPromedio || 0
      nuevaReceta[index].costoCalculado = cantidad * costoUnitario
    }
    
    setReceta(nuevaReceta)
  }

  const getStockDisponible = (idMaterial) => {
    const material = materiales.find(m => m.idMaterial === parseInt(idMaterial))
    return material?.stockActual || 0
  }

  const validarStock = () => {
    // Si estamos editando, no validamos stock porque no vamos a consumir
    if (productoEdit) {
      return { valido: true }
    }
    
    // Solo validamos stock al crear nuevo producto
    for (const item of receta) {
      if (item.idMaterial && item.cantidad) {
        const stockDisponible = getStockDisponible(item.idMaterial)
        const cantidadNecesaria = item.cantidad * (formData.cantidad || 1)
        
        if (cantidadNecesaria > stockDisponible) {
          const material = materiales.find(m => m.idMaterial === parseInt(item.idMaterial))
          return {
            valido: false,
            mensaje: `Stock insuficiente para ${material?.nombre}. 
                    Disponible: ${stockDisponible}, 
                    Requerido: ${cantidadNecesaria}`
          }
        }
      }
    }
    return { valido: true }
  }
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validar que haya al menos un material en la receta
    if (receta.length === 0) {
      alert('Debe agregar al menos un material a la receta')
      return
    }

    // Validar stock disponible
    const validacionStock = validarStock()
    if (!validacionStock.valido) {
      alert(validacionStock.mensaje)
      return
    }

    // Preparar datos del producto
    const productoData = {
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      precio: parseFloat(formData.precio),
      categoria: formData.idCategoria ? { idCategoria: parseInt(formData.idCategoria) } : null
    }

    try {
      let productoGuardado
      if (productoEdit) {
        // Editar producto existente
        productoGuardado = await api.productos.update(productoEdit.idProducto, productoData)
        
        // Actualizar receta - SOLO actualiza los parámetros, NO consume materiales
        const recetaData = receta.map(item => ({
          producto: { idProducto: productoEdit.idProducto },
          material: { idMaterial: parseInt(item.idMaterial) },
          cantidad: parseFloat(item.cantidad)
          // El costoCalculado lo calcula automáticamente el backend
        }))
        
        await api.recetas.actualizarReceta(productoEdit.idProducto, recetaData)
        
        //  REMOVER completamente el consumo de materiales en edición
        // NO consumir materiales al editar, solo se actualiza la receta
        
      } else {
        // Crear nuevo producto - SÍ consume materiales
        productoGuardado = await api.productos.create(productoData)
        
        // Crear inventario inicial
        if (formData.cantidad > 0) {
          const inventarioData = {
            producto: { idProducto: productoGuardado.idProducto },
            cantidadProducto: parseInt(formData.cantidad)
          }
          await api.inventario.registrar(inventarioData)
        }

        // Crear receta
        for (const item of receta) {
          await api.recetas.agregarMaterial({
            producto: { idProducto: productoGuardado.idProducto },
            material: { idMaterial: parseInt(item.idMaterial) },
            cantidad: parseFloat(item.cantidad),
            costoCalculado: item.costoCalculado
          })
        }

        // ✅ Consumir materiales del inventario SOLO para nuevos productos
        for (const item of receta) {
          if (item.idMaterial && item.cantidad) {
            const cantidadTotal = item.cantidad * (formData.cantidad || 1)
            try {
              await api.inventarioMateriales.registrarSalida(
                parseInt(item.idMaterial),
                cantidadTotal,
                `Producción de producto: ${formData.nombre}`
              )
            } catch (consumoError) {
              console.warn(`Error al consumir material ${item.idMaterial}:`, consumoError)
              alert(`Advertencia: No se pudo consumir el material ${item.material?.nombre}. Verifique el stock disponible.`)
            }
          }
        }
      }

      // Éxito - limpiar y cerrar
      setShowForm(false)
      setProductoEdit(null)
      setFormData({ nombre: '', descripcion: '', precio: 0, idCategoria: '', cantidad: 0 })
      setReceta([])
      
      alert('Producto guardado exitosamente')
      
      // Recargar datos
      setTimeout(() => {
        window.location.reload()
      }, 1000)
      
    } catch (error) {
      console.error('Error al guardar producto:', error)
      alert('Error al guardar el producto: ' + (error.message || 'Error desconocido'))
    }
  }

  if (!showForm) return null

  return (
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
        minWidth: '600px',
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
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Información básica del producto */}
          <div style={{ borderBottom: '2px solid var(--border)', paddingBottom: '1.5rem' }}>
            <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text)' }}>Información del Producto</h4>
            
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
                  Precio de Venta *
                </span>
                <input
                  type="number"
                  value={formData.precio}
                  onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
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
          </div>

          {/* Sección de Receta/Materiales */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h4 style={{ margin: 0, color: 'var(--text)' }}>Receta del Producto</h4>
              <Button type="button" variant="ghost" small onClick={agregarMaterial}>
                <Add sx={{ fontSize: 16 }} />
                Agregar Material
              </Button>
            </div>

            {receta.length === 0 ? (
              <div style={{
                background: 'var(--accent)',
                padding: '1.5rem',
                borderRadius: '8px',
                textAlign: 'center',
                color: 'var(--muted)'
              }}>
                No hay materiales agregados a la receta
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {receta.map((item, index) => (
                  <div key={index} style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr auto',
                    gap: '0.5rem',
                    alignItems: 'end',
                    padding: '1rem',
                    background: 'var(--panel-2)',
                    borderRadius: '8px',
                    border: '1px solid var(--border)'
                  }}>
                    <div>
                      <span style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text)' }}>
                        Material
                      </span>
                      <select
                        value={item.idMaterial}
                        onChange={(e) => actualizarMaterial(index, 'idMaterial', e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid var(--border)',
                          borderRadius: '4px',
                          fontSize: '0.9rem'
                        }}
                      >
                        <option value="">Seleccionar material</option>
                        {materiales.map(material => (
                          <option key={material.idMaterial} value={material.idMaterial}>
                            {material.nombre} ({material.unidadMedida?.abreviatura}) - Stock: {material.stockActual}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <span style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text)' }}>
                        Cantidad
                      </span>
                      <input
                        type="number"
                        value={item.cantidad}
                        onChange={(e) => actualizarMaterial(index, 'cantidad', e.target.value)}
                        min="0.1"
                        step="0.1"
                        required
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid var(--border)',
                          borderRadius: '4px',
                          fontSize: '0.9rem'
                        }}
                      />
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      small
                      onClick={() => eliminarMaterial(index)}
                      style={{ background: 'var(--error)', color: 'white' }}
                    >
                      <Delete sx={{ fontSize: 16 }} />
                    </Button>

                    {item.costoCalculado > 0 && (
                      <div style={{
                        gridColumn: '1 / -1',
                        padding: '0.5rem',
                        background: 'var(--accent)',
                        borderRadius: '4px',
                        fontSize: '0.9rem',
                        textAlign: 'center'
                      }}>
                        Costo: ${item.costoCalculado.toFixed(2)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Resumen de costos */}
            {costoCalculado > 0 && (
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                background: 'linear-gradient(135deg, var(--success), #4CAF50)',
                borderRadius: '8px',
                color: 'white',
                textAlign: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <Calculate sx={{ fontSize: 20 }} />
                  <strong>Costo Total de Materiales: ${costoCalculado.toFixed(2)}</strong>
                </div>
                {formData.precio > 0 && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                    Margen: ${(formData.precio - costoCalculado).toFixed(2)} 
                    ({(formData.precio > 0 ? ((formData.precio - costoCalculado) / formData.precio * 100).toFixed(1) : '0')}%)
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <Button type="button" variant="ghost" onClick={() => { 
              setShowForm(false); 
              setProductoEdit(null); 
              setReceta([]);
            }}>
              Cancelar
            </Button>
            <Button type="submit">
              {productoEdit ? 'Actualizar' : 'Crear'} Producto
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}