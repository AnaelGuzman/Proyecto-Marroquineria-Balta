import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  TextField,
  MenuItem,
  Button,
  Stack,
  Divider,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material'
import {
  FilterList,
  Download,
  TrendingUp,
  Paid,
  ShoppingCart,
  Assessment,
  PieChart,
  Equalizer,
  InfoOutlined
} from '@mui/icons-material'
import { api } from '../services/api/index.js'
import { API_BASE_URL } from '../services/api/config.js'

const FILTRO_TIPO_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'ing', label: 'Ingresos' },
  { value: 'egr', label: 'Egresos' }
]

const FILTRO_CATEGORIA_OPTIONS = [
  { value: 'all', label: 'Todas' },
  { value: 'ins', label: 'Insumos' },
  { value: 'mkt', label: 'Publicidad / Marketing' },
  { value: 'prod', label: 'Producción' },
  { value: 'adm', label: 'Administración' }
]

const crearPeriodoInicial = () => {
  const now = new Date()
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1)
  return {
    desde: inicioMes.toISOString().slice(0, 7),
    hasta: now.toISOString().slice(0, 7)
  }
}

const numberFormatter = new Intl.NumberFormat('es-CL', { minimumFractionDigits: 0 })

export default function Reportes() {
  const [periodo, setPeriodo] = useState(() => crearPeriodoInicial())
  const [periodoActivo, setPeriodoActivo] = useState(() => crearPeriodoInicial())
  const [filtros, setFiltros] = useState({ tipo: 'all', categoria: 'all' })
  const [loading, setLoading] = useState(false)
  const [resumen, setResumen] = useState({
    ingresos: 0,
    egresos: 0,
    saldo: 0,
    compras: 0,
    gastos: 0,
    operaciones: 0
  })
  const [serieMensual, setSerieMensual] = useState([])
  const [categoriaDistribucion, setCategoriaDistribucion] = useState([])
  const [ventasDetalle, setVentasDetalle] = useState([])

  useEffect(() => {
    let cancelado = false

    const cargarReportes = async () => {
      setLoading(true)
      try {
        const { inicioISO, finISO } = obtenerRangoISO(periodoActivo)

        const [totalVentas, totalCompras, totalGastos, ventasPeriodo] = await Promise.all([
          api.ventas.getTotalPorPeriodo(inicioISO, finISO).catch(() => 0),
          api.compras.getTotalPorPeriodo(inicioISO, finISO).catch(() => 0),
          api.gastos.getTotalPorPeriodo(inicioISO, finISO).catch(() => 0),
          api.ventas.getPorPeriodo(inicioISO, finISO).catch(() => [])
        ])

        if (cancelado) return

        const ingresos = parseFloat(totalVentas) || 0
        const compras = parseFloat(totalCompras) || 0
        const gastos = parseFloat(totalGastos) || 0
        const egresos = compras + gastos
        const saldo = ingresos - egresos

        setResumen({
          ingresos,
          egresos,
          saldo,
          compras,
          gastos,
          operaciones: ventasPeriodo.length
        })

        setVentasDetalle(ventasPeriodo)

        const meses = generarMesesPeriodo(periodoActivo)
        const serie = await Promise.all(
          meses.map(async (mes) => {
            const [ventasMes, comprasMes] = await Promise.all([
              api.ventas.getTotalPorPeriodo(mes.inicio, mes.fin).catch(() => 0),
              api.compras.getTotalPorPeriodo(mes.inicio, mes.fin).catch(() => 0)
            ])
            return {
              label: mes.label,
              ventas: parseFloat(ventasMes) || 0,
              compras: parseFloat(comprasMes) || 0
            }
          })
        )

        if (!cancelado) {
          setSerieMensual(serie)
          setCategoriaDistribucion(construirDistribucionCategorias(ventasPeriodo))
        }
      } catch (error) {
        console.error('Error al cargar reportes:', error)
      } finally {
        if (!cancelado) {
          setLoading(false)
        }
      }
    }

    cargarReportes()
    return () => {
      cancelado = true
    }
  }, [periodoActivo])

  const indicadores = useMemo(() => {
    const ticketPromedio = resumen.operaciones ? resumen.ingresos / resumen.operaciones : 0
    const margen = resumen.ingresos ? (resumen.saldo / resumen.ingresos) * 100 : 0
    const reinversion = resumen.ingresos ? (resumen.egresos / resumen.ingresos) * 100 : 0
    const diasPeriodo = obtenerDiasPeriodo(periodoActivo)
    const promedioDiario = diasPeriodo ? resumen.ingresos / diasPeriodo : 0

    return {
      ticketPromedio,
      margen,
      reinversion,
      promedioDiario,
      diasPeriodo
    }
  }, [resumen, periodoActivo])

  const comparativaSerie = useMemo(() => {
    if (!serieMensual.length) {
      return {
        meses: 0,
        totalVentas: 0,
        totalCompras: 0,
        diferencia: 0,
        mejorMesVentas: { label: '-', ventas: 0 },
        mejorMesCompras: { label: '-', compras: 0 }
      }
    }

    const totalVentas = serieMensual.reduce((sum, item) => sum + item.ventas, 0)
    const totalCompras = serieMensual.reduce((sum, item) => sum + item.compras, 0)
    const mejorMesVentas = serieMensual.reduce((prev, curr) => (curr.ventas > prev.ventas ? curr : prev), serieMensual[0])
    const mejorMesCompras = serieMensual.reduce((prev, curr) => (curr.compras > prev.compras ? curr : prev), serieMensual[0])

    return {
      meses: serieMensual.length,
      totalVentas,
      totalCompras,
      diferencia: totalVentas - totalCompras,
      mejorMesVentas,
      mejorMesCompras
    }
  }, [serieMensual])

  const handleAplicar = () => {
    setPeriodoActivo({ ...periodo })
  }

  const handleLimpiar = () => {
    const base = crearPeriodoInicial()
    setPeriodo(base)
    setPeriodoActivo(base)
    setFiltros({ tipo: 'all', categoria: 'all' })
  }
  
  const descargarReporteExcel = async () => {
    try {
      const { desde, hasta } = periodoActivo
      const url = `${API_BASE_URL}/estadisticas/reporte-mensual/detallado?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`

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
      a.download = `reporte_mensual_detallado_${desde}_${hasta}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(urlBlob)
    } catch (err) {
      console.error('Error descargando reporte:', err)
      alert('No se pudo descargar el reporte. Revisa la consola.')
    }
  }

  const rangoLabel = `${periodoActivo.desde} - ${periodoActivo.hasta}`

  const cards = [
    // Fila 1: Balance del período + Indicadores clave (2 columnas)
    {
      key: 'balance',
      element: (
        <Card sx={{ borderRadius: 3, width: '100%', height: '100%' }}>
          <CardHeader
            title="Balance del período"
            subheader={`Resumen financiero ${rangoLabel}`}
            action={
              <Chip
                label={resumen.saldo >= 0 ? 'Saldo positivo' : 'Saldo negativo'}
                color={resumen.saldo >= 0 ? 'success' : 'error'}
                variant="outlined"
              />
            }
          />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <MetricHighlight
                  label="Ingresos"
                  value={`$ ${numberFormatter.format(resumen.ingresos)}`}
                  icon={<Paid />}
                  color="#4CAF50"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <MetricHighlight
                  label="Egresos"
                  value={`$ ${numberFormatter.format(resumen.egresos)}`}
                  icon={<ShoppingCart />}
                  color="#E57373"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <MetricHighlight
                  label="Saldo"
                  value={`$ ${numberFormatter.format(resumen.saldo)}`}
                  icon={<TrendingUp />}
                  color="#5D4037"
                />
              </Grid>
            </Grid>
            <Divider sx={{ my: 3 }} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Chip label={`Período: ${rangoLabel}`} variant="outlined" />
              <Chip label={`${resumen.operaciones} operaciones registradas`} variant="outlined" />
              <Chip label={`${indicadores.diasPeriodo} días analizados`} variant="outlined" />
            </Stack>
          </CardContent>
        </Card>
      )
    },
    {
      key: 'indicadores',
      element: (
        <Card sx={{ borderRadius: 3, width: '100%', height: '100%', background: 'linear-gradient(160deg,#5D4037,#8D6E63)' }}>
          <CardHeader
            title={<Typography variant="h6" sx={{ color: 'white' }}>Indicadores clave</Typography>}
            subheader={<Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>KPI del período</Typography>}
          />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <KpiBadge
                  titulo="Ticket promedio"
                  valor={`$ ${numberFormatter.format(indicadores.ticketPromedio)}`}
                  icono={<Assessment />}
                  tooltip="Valor medio ingresado por venta en el período seleccionado"
                />
              </Grid>
              <Grid item xs={12}>
                <KpiBadge
                  titulo="Margen"
                  valor={`${indicadores.margen.toFixed(1)}%`}
                  icono={<TrendingUp />}
                  tooltip="Porcentaje del saldo respecto de los ingresos (utilidad)"
                />
              </Grid>
              <Grid item xs={12}>
                <KpiBadge
                  titulo="Promedio diario"
                  valor={`$ ${numberFormatter.format(indicadores.promedioDiario)}`}
                  icono={<Equalizer />}
                  tooltip="Ingresos promedios generados por día dentro del período"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )
    },

    // Fila 2: Resumen ejecutivo + Detalle de egresos + Distribución por categoría (3 columnas)
    {
      key: 'resumen-ejecutivo',
      element: (
        <Card sx={{ borderRadius: 3, width: '100%', height: '100%' }}>
          <CardHeader title="Resumen ejecutivo" subheader="Hallazgos del período" />
          <CardContent>
            <Stack spacing={2}>
              <ResumenItem
                title="Reinversión"
                description="Porcentaje de egresos sobre ventas"
                value={`${indicadores.reinversion.toFixed(1)}%`}
                info="Proporción de las ventas que se destina a cubrir egresos"
              />
              <ResumenItem
                title="Operaciones"
                description="Ventas registradas"
                value={resumen.operaciones}
                info="Número total de ventas contabilizadas en el período"
              />
              <ResumenItem
                title="Saldo"
                description="Resultado neto"
                value={`$ ${numberFormatter.format(resumen.saldo)}`}
                info="Ingresos menos egresos acumulados del período"
              />
            </Stack>
          </CardContent>
        </Card>
      )
    },
    {
      key: 'detalle-egresos',
      element: (
        <Card sx={{ borderRadius: 3, width: '100%', height: '100%' }}>
          <CardHeader title="Detalle de egresos" subheader="Compras vs gastos operativos" />
          <CardContent>
            <Stack spacing={3}>
              <EgresoBreakdown
                label="Compras"
                value={resumen.compras}
                total={resumen.egresos}
                color="#5D4037"
              />
              <EgresoBreakdown
                label="Gastos operativos"
                value={resumen.gastos}
                total={resumen.egresos}
                color="#8D6E63"
              />
            </Stack>
          </CardContent>
        </Card>
      )
    },
    {
      key: 'distribucion-categoria',
      element: (
        <Card sx={{ borderRadius: 3, width: '100%', height: '100%' }}>
          <CardHeader
            title="Distribución por categoría"
            subheader="Top categorías del período"
            action={<PieChart sx={{ color: '#5D4037' }} />}
          />
          <CardContent>
            <CategoryDistribution data={categoriaDistribucion} />
          </CardContent>
        </Card>
      )
    }
  ]

  return (
    <Box sx={{ p: 3, backgroundColor: '#EFEBE9', minHeight: '100%' }}>
      <Box sx={{ maxWidth: 1600, mx: 'auto', width: '100%' }}>
        <Card sx={{ borderRadius: 3, boxShadow: '0 15px 45px rgba(93,64,55,0.12)', width: '100%', mb: 3 }}>
          <CardHeader
            avatar={<FilterList sx={{ color: '#5D4037' }} />}
            title={<Typography variant="h5">Panel de filtros</Typography>}
            subheader="Define el período y los criterios para actualizar el tablero"
          />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Desde"
                  type="month"
                  fullWidth
                  value={periodo.desde}
                  onChange={(e) => setPeriodo({ ...periodo, desde: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Hasta"
                  type="month"
                  fullWidth
                  value={periodo.hasta}
                  onChange={(e) => setPeriodo({ ...periodo, hasta: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Tipo"
                  select
                  fullWidth
                  value={filtros.tipo}
                  onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
                >
                  {FILTRO_TIPO_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Categoría"
                  select
                  fullWidth
                  value={filtros.categoria}
                  onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value })}
                >
                  {FILTRO_CATEGORIA_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
              <Button variant="outlined" color="inherit" onClick={handleLimpiar}>
                Limpiar
              </Button>
              <Button variant="contained" sx={{ backgroundColor: '#5D4037', '&:hover': { backgroundColor: '#3E2723' } }} onClick={handleAplicar}>
                Aplicar
              </Button>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<Download />}
                onClick={descargarReporteExcel}
              >
                Descargar Excel
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {loading ? (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CircularProgress size={28} sx={{ color: '#5D4037' }} />
                  <Typography variant="body1" color="text.secondary">
                    Obteniendo datos del período seleccionado...
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        ) : (
          <>
            {/* Fila 1: 2 columnas, cada card ocupa la mitad del ancho en md+ */}
            <Box
              sx={{
                display: 'grid',
                gap: 3,
                gridTemplateColumns: {
                  xs: '1fr',
                  md: 'repeat(2, minmax(0, 1fr))'
                },
                mt: 1,
                mb: 3
              }}
            >
              {cards
                .filter((card) => card.key === 'balance' || card.key === 'indicadores')
                .map(({ key, element }) => (
                  <Box key={key} sx={{ display: 'flex', width: '100%' }}>
                    {element}
                  </Box>
                ))}
            </Box>

            {/* Fila 2: 3 columnas iguales en md+ */}
            <Box
              sx={{
                display: 'grid',
                gap: 3,
                gridTemplateColumns: {
                  xs: '1fr',
                  md: 'repeat(3, minmax(0, 1fr))'
                }
              }}
            >
              {cards
                .filter(
                  (card) =>
                    card.key === 'resumen-ejecutivo' ||
                    card.key === 'detalle-egresos' ||
                    card.key === 'distribucion-categoria'
                )
                .map(({ key, element }) => (
                  <Box key={key} sx={{ display: 'flex', width: '100%' }}>
                    {element}
                  </Box>
                ))}
            </Box>
          </>
        )}
        {!loading && (
          <Box sx={{ mt: 3 }}>
            <Card sx={{ borderRadius: 3, width: '100%' }}>
              <CardHeader
                title="Ventas vs Compras"
                subheader="Comparativo mensual"
              />
              <CardContent>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <InlineStat
                      label="Meses analizados"
                      value={comparativaSerie.meses}
                      helper="Rango seleccionado"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <InlineStat
                      label="Total ventas"
                      value={`$ ${numberFormatter.format(comparativaSerie.totalVentas)}`}
                      helper="Suma mensual"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <InlineStat
                      label="Total compras"
                      value={`$ ${numberFormatter.format(comparativaSerie.totalCompras)}`}
                      helper="Suma mensual"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <InlineStat
                      label="Mejor mes venta"
                      value={comparativaSerie.mejorMesVentas?.label || '-'}
                      helper={`$ ${numberFormatter.format(comparativaSerie.mejorMesVentas?.ventas || 0)}`}
                    />
                  </Grid>
                </Grid>
                <VentasComprasChart data={serieMensual} />
              </CardContent>
            </Card>
          </Box>
        )}
      </Box>
    </Box>
  )
}

function obtenerRangoISO(periodo) {
  const inicio = new Date(`${periodo.desde}-01T00:00:00`)
  const fin = new Date(`${periodo.hasta}-01T00:00:00`)
  fin.setMonth(fin.getMonth() + 1)
  fin.setDate(0)
  fin.setHours(23, 59, 59, 999)

  return {
    inicioISO: inicio.toISOString(),
    finISO: fin.toISOString()
  }
}

function generarMesesPeriodo(periodo) {
  const inicio = new Date(`${periodo.desde}-01T00:00:00`)
  const fin = new Date(`${periodo.hasta}-01T00:00:00`)
  fin.setMonth(fin.getMonth() + 1)
  fin.setDate(0)

  const meses = []
  const cursor = new Date(inicio)
  let contador = 0
  while (cursor <= fin && contador < 12) {
    const inicioMes = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const finMes = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59, 999)
    meses.push({
      label: inicioMes.toLocaleDateString('es-CL', { month: 'short' }),
      inicio: inicioMes.toISOString(),
      fin: finMes.toISOString()
    })
    cursor.setMonth(cursor.getMonth() + 1)
    contador += 1
  }

  return meses.length ? meses : [{
    label: inicio.toLocaleDateString('es-CL', { month: 'short' }),
    inicio: inicio.toISOString(),
    fin: fin.toISOString()
  }]
}

function obtenerDiasPeriodo(periodo) {
  const inicio = new Date(`${periodo.desde}-01T00:00:00`)
  const fin = new Date(`${periodo.hasta}-01T00:00:00`)
  fin.setMonth(fin.getMonth() + 1)
  fin.setDate(0)
  return Math.max(1, Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)) + 1)
}

function construirDistribucionCategorias(ventas) {
  const acumulado = new Map()
  ventas.forEach((venta) => {
    (venta.detalles || []).forEach((detalle) => {
      const categoria = detalle?.producto?.categoria?.nombre || detalle?.producto?.categoria || 'Sin categoría'
      const cantidad = Number(detalle?.cantidad) || 0
      const precio = Number(detalle?.precioUnitario || detalle?.precio || 0)
      const subtotal = Number(detalle?.subtotal || cantidad * precio) || 0
      acumulado.set(categoria, (acumulado.get(categoria) || 0) + subtotal)
    })
  })

  const data = Array.from(acumulado.entries()).map(([nombre, monto]) => ({ nombre, monto }))
  const total = data.reduce((sum, item) => sum + item.monto, 0) || 1

  return data
    .sort((a, b) => b.monto - a.monto)
    .slice(0, 6)
    .map((item) => ({
      ...item,
      porcentaje: (item.monto / total) * 100
    }))
}

function MetricHighlight({ label, value, icon, color }) {
  return (
    <Stack spacing={1}
      sx={{
        p: 2,
        borderRadius: 2,
        backgroundColor: '#FAF9F7',
        border: '1px solid rgba(93,64,55,0.12)',
        height: '100%'
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            backgroundColor: `${color}20`,
            color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {icon}
        </Box>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </Stack>
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#3E2723' }}>
        {value}
      </Typography>
    </Stack>
  )
}

function KpiBadge({ titulo, valor, icono, tooltip }) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.12)',
        color: '#fff'
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icono}
          </Box>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
            {titulo}
          </Typography>
        </Stack>
        {tooltip && (
          <Tooltip title={tooltip} arrow>
            <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.9)' }}>
              <InfoOutlined fontSize="inherit" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        {valor}
      </Typography>
    </Box>
  )
}

function VentasComprasChart({ data }) {
  if (!data.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        Aún no hay datos suficientes para graficar este período.
      </Typography>
    )
  }

  const maxValue = Math.max(...data.map((item) => Math.max(item.ventas, item.compras)), 1) * 1.1
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(p => ({
    value: maxValue * p,
    percent: p * 100
  }))

  return (
    <Box sx={{ width: '100%', p: 2, bgcolor: '#FAF9F7', borderRadius: 2, border: '1px solid rgba(93,64,55,0.1)' }}>
      <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#4CAF50' }} />
          <Typography variant="caption">Ventas</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#E57373' }} />
          <Typography variant="caption">Compras</Typography>
        </Stack>
      </Stack>

      <Box sx={{ position: 'relative', height: 300, width: '100%', mb: 3 }}>
        {/* Grid Lines & Y Labels */}
        {gridLines.map((line, i) => (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              bottom: `${line.percent}%`,
              left: 0,
              right: 0,
              display: 'flex',
              alignItems: 'center',
              transform: 'translateY(50%)'
            }}
          >
            <Typography variant="caption" sx={{ width: 60, textAlign: 'right', mr: 1, color: 'text.secondary', fontSize: '0.7rem' }}>
              $ {numberFormatter.format(line.value)}
            </Typography>
            <Box sx={{ flex: 1, height: '1px', bgcolor: 'rgba(0,0,0,0.05)' }} />
          </Box>
        ))}

        {/* Chart Area */}
        <Box sx={{ position: 'absolute', top: 0, bottom: 0, left: 70, right: 0 }}>
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
            <polyline
              points={data.map((d, i) => {
                const x = data.length === 1 ? 50 : (i / (data.length - 1)) * 100
                const y = 100 - (d.compras / maxValue) * 100
                return `${x},${y}`
              }).join(' ')}
              fill="none"
              stroke="#E57373"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
            <polyline
              points={data.map((d, i) => {
                const x = data.length === 1 ? 50 : (i / (data.length - 1)) * 100
                const y = 100 - (d.ventas / maxValue) * 100
                return `${x},${y}`
              }).join(' ')}
              fill="none"
              stroke="#4CAF50"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* Points Overlay */}
          {data.map((d, i) => {
            const x = data.length === 1 ? 50 : (i / (data.length - 1)) * 100
            const yVentas = 100 - (d.ventas / maxValue) * 100
            const yCompras = 100 - (d.compras / maxValue) * 100

            return (
              <React.Fragment key={i}>
                <Tooltip title={`Ventas: $ ${numberFormatter.format(d.ventas)}`} arrow>
                  <Box
                    sx={{
                      position: 'absolute',
                      left: `${x}%`,
                      top: `${yVentas}%`,
                      width: 12,
                      height: 12,
                      bgcolor: '#4CAF50',
                      borderRadius: '50%',
                      transform: 'translate(-50%, -50%)',
                      border: '2px solid white',
                      boxShadow: 1,
                      cursor: 'pointer',
                      zIndex: 2,
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'translate(-50%, -50%) scale(1.5)' }
                    }}
                  />
                </Tooltip>

                <Tooltip title={`Compras: $ ${numberFormatter.format(d.compras)}`} arrow>
                  <Box
                    sx={{
                      position: 'absolute',
                      left: `${x}%`,
                      top: `${yCompras}%`,
                      width: 12,
                      height: 12,
                      bgcolor: '#E57373',
                      borderRadius: '50%',
                      transform: 'translate(-50%, -50%)',
                      border: '2px solid white',
                      boxShadow: 1,
                      cursor: 'pointer',
                      zIndex: 2,
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'translate(-50%, -50%) scale(1.5)' }
                    }}
                  />
                </Tooltip>
                
                <Typography
                  variant="caption"
                  sx={{
                    position: 'absolute',
                    bottom: -30,
                    left: `${x}%`,
                    transform: 'translateX(-50%)',
                    color: 'text.secondary',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {d.label}
                </Typography>
              </React.Fragment>
            )
          })}
        </Box>
      </Box>
    </Box>
  )
}

function CategoryDistribution({ data }) {
  if (!data.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        Sin registros de categoría para este rango.
      </Typography>
    )
  }

  const total = data.reduce((sum, item) => sum + item.monto, 0) || 1

  return (
    <Stack spacing={2}>
      {data.map((item) => (
        <Box key={item.nombre}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2">{item.nombre}</Typography>
            <Typography variant="body2" color="text.secondary">
              {item.porcentaje.toFixed(1)}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={(item.monto / total) * 100}
            sx={{ height: 8, borderRadius: 4, mt: 1, backgroundColor: '#F0E7E1', '& .MuiLinearProgress-bar': { backgroundColor: '#5D4037' } }}
          />
          <Typography variant="caption" color="text.secondary">
            $ {numberFormatter.format(item.monto)}
          </Typography>
        </Box>
      ))}

      <Table size="small" sx={{ mt: 2 }}>
        <TableHead>
          <TableRow>
            <TableCell>Categoría</TableCell>
            <TableCell align="right">Monto</TableCell>
            <TableCell align="right">% participación</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.nombre}>
              <TableCell>{item.nombre}</TableCell>
              <TableCell align="right">$ {numberFormatter.format(item.monto)}</TableCell>
              <TableCell align="right">{item.porcentaje.toFixed(1)}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Stack>
  )
}

function EgresoBreakdown({ label, value, total, color }) {
  const porcentaje = total ? (value / total) * 100 : 0
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle2">{label}</Typography>
        <Typography variant="subtitle2">$ {numberFormatter.format(value)}</Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={porcentaje}
        sx={{ mt: 1, height: 8, borderRadius: 4, backgroundColor: '#F5F5F5', '& .MuiLinearProgress-bar': { backgroundColor: color } }}
      />
      <Typography variant="caption" color="text.secondary">
        {porcentaje.toFixed(1)}% del total de egresos
      </Typography>
    </Box>
  )
}

function ResumenItem({ title, description, value, info }) {
  return (
    <Box sx={{ p: 2, borderRadius: 2, border: '1px solid rgba(93,64,55,0.1)', backgroundColor: '#FAF9F7' }}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="subtitle2" sx={{ color: '#5D4037' }}>
          {title}
        </Typography>
        {info && (
          <Tooltip title={info} arrow>
            <IconButton size="small" sx={{ color: '#5D4037', p: 0.5 }}>
              <InfoOutlined fontSize="inherit" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
      <Typography variant="h6" sx={{ mt: 1, fontWeight: 700 }}>
        {value}
      </Typography>
    </Box>
  )
}

function InlineStat({ label, value, helper }) {
  return (
    <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#FAF9F7', border: '1px solid rgba(93,64,55,0.1)', height: '100%' }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>
        {value}
      </Typography>
      {helper && (
        <Typography variant="caption" color="text.secondary">
          {helper}
        </Typography>
      )}
    </Box>
  )
}