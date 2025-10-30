import React, { useState, useEffect } from 'react'
import { Card, Field, Toolbar, Button, Table } from '../components/UI.jsx'
import { api } from '../services/api/index.js'
import { API_BASE_URL } from '../services/api/config.js'


export default function Reportes() {
  const now = new Date()
  const [periodo, setPeriodo] = useState({
    desde: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0].slice(0, 7),
    hasta: now.toISOString().split('T')[0].slice(0, 7)
  })
  const [balance, setBalance] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarReportes()
  }, [])

  const cargarReportes = async () => {
    setLoading(true)
    try {
      const inicioDate = new Date(periodo.desde + '-01').toISOString()
      const finDate = new Date(periodo.hasta + '-01')
      finDate.setMonth(finDate.getMonth() + 1)
      finDate.setDate(0)
      const finDateISO = finDate.toISOString()

      const [totalVentas, totalCompras, totalGastos] = await Promise.all([
        api.ventas.getTotalPorPeriodo(inicioDate, finDateISO).catch(() => 0),
        api.compras.getTotalPorPeriodo(inicioDate, finDateISO).catch(() => 0),
        api.gastos.getTotalPorPeriodo(inicioDate, finDateISO).catch(() => 0)
      ])

      const ingresos = totalVentas || 0
      const egresos = (totalCompras || 0) + (totalGastos || 0)
      const saldo = ingresos - egresos

      setBalance([
        ['Periodo', `${periodo.desde} - ${periodo.hasta}`],
        ['Ingresos', `$ ${ingresos.toLocaleString('es-CL')}`],
        ['Egresos', `$ ${egresos.toLocaleString('es-CL')}`],
        ['Saldo', `$ ${saldo.toLocaleString('es-CL')}`],
      ])
    } catch (error) {
      console.error('Error al cargar reportes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAplicar = () => {
    cargarReportes()
  }

  const handleLimpiar = () => {
    const now = new Date()
    setPeriodo({
      desde: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0].slice(0, 7),
      hasta: now.toISOString().split('T')[0].slice(0, 7)
    })
  }

  const descargarReporteExcel = async () => {
    try {
      const desde = periodo.desde  // yyyy-MM
      const hasta = periodo.hasta  // yyyy-MM
      const url = `${API_BASE_URL}/estadisticas/reporte-mensual?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      })

      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || 'Error al descargar reporte')
      }

      const blob = await res.blob()
      const urlBlob = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = urlBlob
      a.download = `reporte_mensual_${desde}_${hasta}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(urlBlob)
    } catch (err) {
      console.error('Error descargando reporte:', err)
      alert('No se pudo descargar el reporte. Revisa la consola.')
    }
  }

  const porCategoria = [
    ['Insumos', '$ 338.000'],
    ['Publicidad', '$ 140.000'],
    ['Otros', '$ 262.000'],
  ]

  return (
    <div className="stack">
      <Card title="Filtros" subtitle="Ajusta periodo y categoría para las estadísticas">
        <div className="form-grid">
          <Field 
            label="Desde" 
            type="month" 
            value={periodo.desde}
            onChange={(e) => setPeriodo({ ...periodo, desde: e.target.value })}
          />
          <Field 
            label="Hasta" 
            type="month" 
            value={periodo.hasta}
            onChange={(e) => setPeriodo({ ...periodo, hasta: e.target.value })}
          />
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
          <Button onClick={handleAplicar}>Aplicar</Button>
          <Button variant="ghost" onClick={handleLimpiar}>Limpiar</Button>
          <Button variant="primary" onClick={descargarReporteExcel}>Descargar Excel</Button>
        </Toolbar>
      </Card>

      <div className="stack">
        {loading ? (
          <Card title="Cargando..."><p>Obteniendo datos del período...</p></Card>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  )
}