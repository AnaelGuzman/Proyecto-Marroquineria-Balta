import React, { useState, useEffect } from 'react'
import { Card, Table } from '../components/UI.jsx'
import { api } from '../services/api/index.js'

export default function Dashboard() {
  const [resumen, setResumen] = useState([
    { label: 'Ingresos netos (mes)', value: '$ 0' },
    { label: 'Egresos netos (mes)', value: '$ 0' },
    { label: 'Utilidad neta', value: '$ 0' },
  ])
  const [recientes, setRecientes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      const now = new Date()
      const inicio = new Date(now.getFullYear(), now.getMonth(), 1)
      const fin = new Date(now)

      // Obtener todas las ventas, compras y gastos del mes
      const [ventas, compras, gastos] = await Promise.all([
        api.ventas.getPorPeriodo(inicio.toISOString(), fin.toISOString()).catch(() => []),
        api.compras.getAll().catch(() => []),
        api.gastos.getAll().catch(() => [])
      ])

      // Calcular INGRESOS NETOS (suma de montoNeto de todas las ventas)
      const ingresosNetos = ventas.reduce((sum, v) => {
        const montoNeto = v.montoNeto || 0
        return sum + montoNeto
      }, 0)

      // Calcular EGRESOS NETOS (suma de montoNeto de compras + gastos)
      const comprasDelMes = compras.filter(c => {
        const fechaCompra = Array.isArray(c.fecha) 
          ? new Date(c.fecha[0], c.fecha[1] - 1, c.fecha[2])
          : new Date(c.fecha)
        return fechaCompra >= inicio && fechaCompra <= fin
      })

      const gastosDelMes = gastos.filter(g => {
        const fechaGasto = Array.isArray(g.fecha)
          ? new Date(g.fecha[0], g.fecha[1] - 1, g.fecha[2])
          : new Date(g.fecha)
        return fechaGasto >= inicio && fechaGasto <= fin
      })

      const egresosCompras = comprasDelMes.reduce((sum, c) => {
        // Si tiene montoNeto (con IVA recuperable), usamos ese
        // Si no, usamos montoTotal (sin IVA recuperable)
        const montoNeto = c.montoNeto || c.montoTotal || 0
        return sum + montoNeto
      }, 0)

      const egresosGastos = gastosDelMes.reduce((sum, g) => {
        return sum + (g.monto || 0)
      }, 0)

      const egresosNetos = egresosCompras + egresosGastos

      // Calcular UTILIDAD NETA
      const utilidadNeta = ingresosNetos - egresosNetos

      setResumen([
        { 
          label: 'Ingresos netos (mes)', 
          value: `$ ${Math.round(ingresosNetos).toLocaleString('es-CL')}`
        },
        { 
          label: 'Egresos netos (mes)', 
          value: `$ ${Math.round(egresosNetos).toLocaleString('es-CL')}`
        },
        { 
          label: 'Utilidad neta', 
          value: `$ ${Math.round(utilidadNeta).toLocaleString('es-CL')}`
        },
      ])

      // Combinar ventas y compras/gastos recientes
      const movimientosRecientes = [
        ...ventas.slice(-5).map(v => ({
          fecha: v.fecha,
          detalle: v.detalles && v.detalles.length > 0 ? v.detalles[0].producto?.nombre : 'Venta',
          monto: v.montoNeto || v.montoTotal || 0,
          tipo: 'Ingreso',
          esIngreso: true
        })),
        ...comprasDelMes.slice(-3).map(c => ({
          fecha: c.fecha,
          detalle: c.detalles && c.detalles.length > 0 ? c.detalles[0].descripcion : 'Compra',
          monto: c.montoNeto || c.montoTotal || 0,
          tipo: 'Egreso',
          esIngreso: false
        })),
        ...gastosDelMes.slice(-2).map(g => ({
          fecha: g.fecha,
          detalle: g.descripcion || 'Gasto',
          monto: g.monto || 0,
          tipo: 'Egreso',
          esIngreso: false
        }))
      ].sort((a, b) => {
        const fechaA = Array.isArray(a.fecha) ? new Date(a.fecha[0], a.fecha[1] - 1, a.fecha[2]) : new Date(a.fecha)
        const fechaB = Array.isArray(b.fecha) ? new Date(b.fecha[0], b.fecha[1] - 1, b.fecha[2]) : new Date(b.fecha)
        return fechaB - fechaA
      }).slice(0, 8)

      const rowsFormateadas = movimientosRecientes.map(m => {
        let fechaFormateada = 'N/A'
        if (m.fecha) {
          if (Array.isArray(m.fecha)) {
            const fecha = new Date(m.fecha[0], m.fecha[1] - 1, m.fecha[2])
            fechaFormateada = fecha.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })
          } else {
            const fecha = new Date(m.fecha)
            fechaFormateada = fecha.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })
          }
        }
        
        return [
          fechaFormateada,
          m.detalle,
          `$ ${Math.round(m.monto).toLocaleString('es-CL')}`,
          m.tipo
        ]
      })
      
      setRecientes(rowsFormateadas)
    } catch (error) {
      console.error('Error al cargar dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="stack large-text"><Card title="Cargando..."><p>Obteniendo datos...</p></Card></div>
  }

  return (
    <div className="stack large-text">
      <Card title="Resumen del negocio" subtitle="Vista rápida del mes actual" accent="accent">
        <div className="stats">
          {resumen.map((r) => (
            <div key={r.label} className="stat">
              <span className="stat-label">{r.label}</span>
              <span 
                className="stat-value" 
                style={{ 
                  color: r.color === 'green' ? 'rgb(60, 140, 60)' : 
                         r.color === 'red' ? 'rgb(180, 60, 60)' : 
                         r.color === 'blue' ? 'rgb(60, 100, 180)' : 'inherit' 
                }}
              >
                {r.value}
              </span>
            </div>
          ))}
        </div>
      </Card>
      
      <Card title="Movimientos recientes" subtitle="Últimos ingresos y egresos del mes">
        <Table columns={["Fecha","Detalle","Monto","Tipo"]} rows={recientes} />
      </Card>
    </div>
  )
}