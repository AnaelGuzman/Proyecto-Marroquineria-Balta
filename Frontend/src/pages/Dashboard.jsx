import React from 'react'
import { Card, Table } from '../components/UI.jsx'

export default function Dashboard() {
  const resumen = [
    { label: 'Ingresos (mes)', value: '$ 1.250.000' },
    { label: 'Egresos (mes)', value: '$ 740.000' },
    { label: 'Saldo estimado', value: '$ 510.000' },
  ]

  const recientes = [
    ['12 Ago', 'Venta billetera', '$ 25.000', 'Venta'],
    ['11 Ago', 'Compra cuero', '$ 320.000', 'Insumos'],
    ['09 Ago', 'Venta cinturón', '$ 28.000', 'Venta'],
    ['08 Ago', 'Publicidad Instagram', '$ 40.000', 'Publicidad'],
  ]

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
