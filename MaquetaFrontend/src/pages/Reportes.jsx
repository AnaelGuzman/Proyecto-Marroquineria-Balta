import React from 'react'
import { Card, Field, Toolbar, Button, Table } from '../components/UI.jsx'

export default function Reportes() {
  const balance = [
    ['Periodo', 'Ago 2025'],
    ['Ingresos', '$ 1.250.000'],
    ['Egresos', '$ 740.000'],
    ['Saldo', '$ 510.000'],
  ]

  const porCategoria = [
    ['Insumos', '$ 338.000'],
    ['Publicidad', '$ 140.000'],
    ['Otros', '$ 262.000'],
  ]

  return (
    <div className="stack">
      <Card title="Filtros" subtitle="Ajusta periodo y categoría para las estadísticas">
        <div className="form-grid">
          <Field label="Desde" type="month" />
          <Field label="Hasta" type="month" />
          <Field label="Tipo" type="select" options={[
            {value:'all',label:'Todos'},
            {value:'ing',label:'Ingresos'},
            {value:'egr',label:'Egresos'},
          ]} />
          <Field label="Categoría" type="select" options={[
            {value:'all',label:'Todas'},
            {value:'ins',label:'Insumos'},
            {value:'mkt',label:'Publicidad/Marketing'},
            {value:'otr',label:'Otros'},
          ]} />
        </div>
        <Toolbar>
          <Button>Aplicar</Button>
          <Button variant="ghost">Limpiar</Button>
        </Toolbar>
      </Card>

      <div className="stack">
        <Card title="Balance del periodo">
          <div className="kpis">
            {balance.map(([k, v]) => (
              <div key={k} className="kpi">
                <span className="muted small">{k}</span>
                <strong>{v}</strong>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Distribución por categoría" subtitle="Gráfico ilustrativo">
          <div className="chart-placeholder" role="img" aria-label="Gráfico circular de ejemplo">
            <div className="slice a" />
            <div className="slice b" />
            <div className="slice c" />
          </div>
          <Table columns={["Categoría","Monto"]} rows={porCategoria} />
        </Card>
      </div>
    </div>
  )
}
