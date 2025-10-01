import React, { useState, useEffect } from 'react'
import { Card, Table } from '../components/UI.jsx'
import { api } from '../services/api/index.js'

export default function Dashboard() {
  const [resumen, setResumen] = useState([
    { label: 'Ingresos (mes)', value: '$ 0' },
    { label: 'Egresos (mes)', value: '$ 0' },
    { label: 'Saldo estimado', value: '$ 0' },
  ])
  const [recientes, setRecientes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      const now = new Date()
      const inicio = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const fin = now.toISOString()

      const [totalVentas, totalCompras, totalGastos, ventas] = await Promise.all([
        api.ventas.getTotalPorPeriodo(inicio, fin).catch(() => 0),
        api.compras.getTotalPorPeriodo(inicio, fin).catch(() => 0),
        api.gastos.getTotalPorPeriodo(inicio, fin).catch(() => 0),
        api.ventas.getAll().catch(() => [])
      ])

      const ingresos = totalVentas || 0
      const egresos = (totalCompras || 0) + (totalGastos || 0)
      const saldo = ingresos - egresos

      setResumen([
        { label: 'Ingresos (mes)', value: `$ ${ingresos.toLocaleString('es-CL')}` },
        { label: 'Egresos (mes)', value: `$ ${egresos.toLocaleString('es-CL')}` },
        { label: 'Saldo estimado', value: `$ ${saldo.toLocaleString('es-CL')}` },
      ])

      const ultimasVentas = ventas.slice(-4).reverse().map(v => {
        const primerProducto = v.detalles && v.detalles.length > 0 ? v.detalles[0].producto?.nombre : 'Sin producto'
        
        // Manejar fecha que viene como array
        let fechaFormateada = 'N/A'
        if (v.fecha && Array.isArray(v.fecha)) {
          const fecha = new Date(v.fecha[0], v.fecha[1] - 1, v.fecha[2])
          fechaFormateada = fecha.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })
        }
        
        return [
          fechaFormateada,
          primerProducto,
          `$ ${(v.montoTotal || 0).toLocaleString('es-CL')}`,
          'Venta'
        ]
      })
      
      setRecientes(ultimasVentas)
    } catch (error) {
      console.error('Error al cargar dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="stack"><Card title="Cargando..."><p>Obteniendo datos...</p></Card></div>
  }

  return (
    <div className="stack">
      <Card title="Resumen" subtitle="Vista rápida del mes" accent="accent">
        <div className="stats">
          {resumen.map((r) => (
            <div key={r.label} className="stat">
              <span className="stat-label">{r.label}</span>
              <span className="stat-value">{r.value}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card title="Movimientos recientes" subtitle="Últimos ingresos y egresos">
        <Table columns={["Fecha","Detalle","Monto","Tipo"]} rows={recientes} />
      </Card>
    </div>
  )
}