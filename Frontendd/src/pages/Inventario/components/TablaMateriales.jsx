// TablaMateriales.jsx - SIN BOTÓN DE AJUSTAR STOCK EN ACCIONES
import React from 'react'
import { Table, Button } from '../../../components/UI.jsx'
import { Visibility, Edit, Delete } from '@mui/icons-material'

export default function TablaMateriales({ 
  materialesFiltrados,
  setShowDetallesMaterial,
  handleEditarMaterial,
  setShowConfirmDeleteMaterial
}) {
  const getStockStatus = (material) => {
    const stock = material.stockActual || 0
    const stockMinimo = material.stockMinimo || 10
    
    if (stock === 0) return { text: 'Sin Stock', color: '#F44336' }
    if (stock < stockMinimo) return { text: 'Bajo', color: '#FF9800' }
    if (stock <= stockMinimo * 2) return { text: 'Medio', color: '#FFC107' }
    return { text: 'OK', color: '#4CAF50' }
  }

  const rows = materialesFiltrados.map(material => {
    const status = getStockStatus(material)
    return [
      material.nombre || '-',
      `${material.stockActual || 0} ${material.unidadMedida?.abreviatura || ''}`,
      `${material.stockMinimo || 10} ${material.unidadMedida?.abreviatura || ''}`,
      <span 
        key={`status-${material.idMaterial}`}
        style={{ 
          color: status.color, 
          fontWeight: '600',
          padding: '0.25rem 0.5rem',
          borderRadius: '4px',
          background: `${status.color}15`
        }}
      >
        {status.text}
      </span>,
      <div key={material.idMaterial} style={{ display: 'flex', gap: '0.5rem' }}>
        <Button 
          small 
          variant="ghost" 
          onClick={() => setShowDetallesMaterial(material)}
          title="Ver detalles"
        >
          <Visibility sx={{ fontSize: 18 }} />
        </Button>
        <Button 
          small 
          variant="ghost" 
          onClick={() => handleEditarMaterial(material)}
          title="Editar material"
        >
          <Edit sx={{ fontSize: 18 }} />
        </Button>
        <Button 
          small 
          variant="ghost" 
          onClick={() => setShowConfirmDeleteMaterial(material)}
          style={{ color: '#f97066' }}
          title="Eliminar material"
        >
          <Delete sx={{ fontSize: 18 }} />
        </Button>
      </div>
    ]
  })

  return (
    <Table
      columns={['Material', 'Stock', 'Stock Mínimo', 'Estado', 'Acciones']}
      rows={rows}
    />
  )
}