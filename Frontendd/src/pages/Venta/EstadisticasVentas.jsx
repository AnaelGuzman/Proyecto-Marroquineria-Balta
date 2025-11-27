import React, { useState, useEffect } from 'react'; 
import { 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Box,
  Button,
  Paper,
  Chip,
  Tooltip
} from '@mui/material'; 
import { 
  BarChart, 
  TrendingUp,
  AttachMoney,
  Payment,
  ArrowBackIos,
  ArrowForwardIos,
  ShowChart,
  Analytics,
  Insights,
  ShoppingBag,
  ReceiptLong,
  CalendarToday
} from '@mui/icons-material'; 
import { api } from '../../services/api'; 

const CARD_BASE_SX = {
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 3,
  border: '1px solid #D7CCC8',
  boxShadow: '0 8px 20px rgba(93, 64, 55, 0.1)',
  backgroundColor: '#FAF9F7'
};

export default function EstadisticasVentas() {
  const [datos, setDatos] = useState({
    productosMasVendidos: [],
    ventasMes: { bruto: 0, neto: 0, iva: 0 },
    metodosPago: [],
    comisiones: 0,
    todasVentas: [],
    tendenciaMensual: []
  });
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState({
    inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    fin: new Date()
  });

  useEffect(() => {
    cargarEstadisticas();
  }, [periodo]);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      const inicioISO = periodo.inicio.toISOString();
      const finISO = periodo.fin.toISOString();

      const [productosMasVendidos, ventasMes, metodosPago, todasVentas, tendenciaMensual] = await Promise.all([
        api.productos.getMasVendidos(periodo.inicio, periodo.fin),
        api.ventas.getTotalPorPeriodo(inicioISO, finISO),
        api.metodosPago.getAll().catch(() => []),
        api.ventas.getPorPeriodo(inicioISO, finISO),
        cargarTendenciaMensual()
      ]);

      const comisionTotal = todasVentas.reduce((total, venta) => total + (parseFloat(venta.comisionTotal) || 0), 0);
      const metodosConUso = await calcularUsoMetodosPago(metodosPago, todasVentas);

      setDatos({
        productosMasVendidos: productosMasVendidos || [],
        ventasMes: {
          bruto: parseFloat(ventasMes) || 0,
          neto: (parseFloat(ventasMes) || 0) / 1.19,
          iva: (parseFloat(ventasMes) || 0) - ((parseFloat(ventasMes) || 0) / 1.19)
        },
        metodosPago: metodosConUso,
        comisiones: comisionTotal,
        todasVentas: todasVentas || [],
        tendenciaMensual: tendenciaMensual
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarTendenciaMensual = async () => {
    const tendencia = [];
    const hoy = new Date();
    
    // Últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const mes = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const inicioMes = new Date(mes.getFullYear(), mes.getMonth(), 1);
      const finMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0);
      
      try {
        const totalMes = await api.ventas.getTotalPorPeriodo(
          inicioMes.toISOString(), 
          finMes.toISOString()
        );
        
        tendencia.push({
          mes: mes.toLocaleDateString('es-CL', { month: 'short', year: 'numeric' }),
          total: parseFloat(totalMes) || 0
        });
      } catch (error) {
        tendencia.push({
          mes: mes.toLocaleDateString('es-CL', { month: 'short', year: 'numeric' }),
          total: 0
        });
      }
    }
    
    return tendencia;
  };

  const calcularUsoMetodosPago = async (metodosPago, ventas) => {
    const metodosConMontos = await Promise.all(
      metodosPago.map(async metodo => {
        const monto = await api.ventas.getTotalPorMetodoPago(
          metodo.idMetodoPago, 
          periodo.inicio, 
          periodo.fin
        ).catch(() => 0);
        
        return {
          ...metodo,
          monto: parseFloat(monto) || 0
        };
      })
    );

    const total = metodosConMontos.reduce((sum, metodo) => sum + metodo.monto, 0);
    
    return metodosConMontos.map(metodo => ({
      ...metodo,
      porcentaje: total > 0 ? (metodo.monto / total) * 100 : 0
    })).filter(metodo => metodo.monto > 0);
  };

  const cambiarMes = (meses) => {
    const nuevaFecha = new Date(periodo.inicio);
    nuevaFecha.setMonth(nuevaFecha.getMonth() + meses);
    
    setPeriodo({
      inicio: new Date(nuevaFecha.getFullYear(), nuevaFecha.getMonth(), 1),
      fin: new Date(nuevaFecha.getFullYear(), nuevaFecha.getMonth() + 1, 0)
    });
  };

  const formatearMes = (fecha) => {
    return fecha.toLocaleDateString('es-CL', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  // Métricas clave
  const calcularMetricasClave = () => {
    const ventasFiltradas = datos.todasVentas;
    const totalVentas = ventasFiltradas.reduce((sum, v) => sum + (v.montoBruto || 0), 0);
    const cantidadVentas = ventasFiltradas.length;
    const productosVendidos = ventasFiltradas.reduce((sum, v) => 
      sum + (v.detalles?.reduce((detSum, d) => detSum + (d.cantidad || 0), 0) || 0), 0
    );
    
    return {
      ticketPromedio: cantidadVentas > 0 ? totalVentas / cantidadVentas : 0,
      ventasPorDia: cantidadVentas > 0 ? cantidadVentas / 30 : 0, // Aprox 30 días
      productosPorVenta: cantidadVentas > 0 ? productosVendidos / cantidadVentas : 0,
      totalVentas,
      cantidadVentas
    };
  };

  // Comparativa con mes anterior
  const calcularComparativa = () => {
    const mesActual = datos.ventasMes.bruto;
    const mesAnterior = datos.tendenciaMensual[4]?.total || 0; // Penúltimo mes en la tendencia
    
    const diferencia = mesActual - mesAnterior;
    const porcentaje = mesAnterior > 0 ? (diferencia / mesAnterior) * 100 : 0;
    
    return {
      mesActual,
      mesAnterior,
      diferencia,
      porcentaje,
      esPositivo: diferencia >= 0
    };
  };

  // Resumen ejecutivo
  const generarResumenEjecutivo = () => {
    const comparativa = calcularComparativa();
    const metricas = calcularMetricasClave();
    const mejorMetodoPago = datos.metodosPago.sort((a, b) => b.monto - a.monto)[0];
    const productoTop = datos.productosMasVendidos[0];
    
    return {
      crecimiento: comparativa.porcentaje,
      mejorMetodo: mejorMetodoPago?.nombre || 'N/A',
      productoDestacado: productoTop?.[0]?.nombre || 'N/A',
      ticketPromedio: metricas.ticketPromedio
    };
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Cargando estadísticas...
        </Typography>
      </Box>
    );
  }

  const metricas = calcularMetricasClave();
  const comparativa = calcularComparativa();
  const resumen = generarResumenEjecutivo();
  const rangoLabel = `${periodo.inicio.toLocaleDateString('es-CL')} - ${periodo.fin.toLocaleDateString('es-CL')}`;
  const diasPeriodo = Math.max(1, Math.round((periodo.fin - periodo.inicio) / (1000 * 60 * 60 * 24)) + 1);

  const kpiCards = [
    {
      key: 'ventas-totales',
      element: (
        <MetricaRapida 
          titulo="VENTAS TOTALES"
          valor={`$${metricas.totalVentas.toLocaleString('es-CL', { minimumFractionDigits: 0 })}`}
          icono={<AttachMoney />}
          color="#5D4037"
        />
      )
    },
    {
      key: 'ticket-promedio',
      element: (
        <MetricaRapida 
          titulo="TICKET PROMEDIO"
          valor={`$${metricas.ticketPromedio.toLocaleString('es-CL', { minimumFractionDigits: 0 })}`}
          icono={<ReceiptLong />}
          color="#A1887F"
        />
      )
    },
    {
      key: 'cantidad-ventas',
      element: (
        <MetricaRapida 
          titulo="CANTIDAD VENTAS"
          valor={metricas.cantidadVentas.toString()}
          icono={<ShoppingBag />}
          color="#BCAAA4"
        />
      )
    },
    {
      key: 'comparativa',
      element: (
        <Card sx={{ ...CARD_BASE_SX, textAlign: 'center', justifyContent: 'center' }}>
          <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#5D4037', fontWeight: 'bold' }}>
              Comparativa Mensual
            </Typography>
            <Chip 
              label={`${comparativa.esPositivo ? '+' : ''}${comparativa.porcentaje.toFixed(1)}%`}
              color={comparativa.esPositivo ? 'success' : 'error'}
              sx={{ fontSize: '1.5rem', px: 2.5, py: 1, borderRadius: 4, alignSelf: 'center' }}
            />
            <Typography variant="body2" sx={{ color: '#8D6E63', mt: 1.5 }}>
              vs mes anterior (${comparativa.mesAnterior.toLocaleString('es-CL', { minimumFractionDigits: 0 })})
            </Typography>
          </CardContent>
        </Card>
      )
    }
  ];

  const chartCards = [
    {
      key: 'resumen-financiero',
      element: (
        <Card sx={CARD_BASE_SX}>
          <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#5D4037', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
              <TrendingUp sx={{ mr: 1 }} /> Resumen Financiero
            </Typography>
            <Box sx={{ mt: 2, flex: 1 }}>
              <GraficoVentasMes datos={datos.ventasMes} comisiones={datos.comisiones} />
            </Box>
          </CardContent>
        </Card>
      )
    },
    {
      key: 'metodos-pago',
      element: (
        <Card sx={CARD_BASE_SX}>
          <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#5D4037', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
              <Payment sx={{ mr: 1 }} /> Métodos de Pago
            </Typography>
            <Box sx={{ mt: 2, flex: 1, display: 'flex', justifyContent: 'center' }}>
              <GraficoMetodosPago datos={datos.metodosPago} />
            </Box>
          </CardContent>
        </Card>
      )
    }
  ];

  const summaryCard = {
    key: 'resumen-global',
    element: (
      <Card sx={{ ...CARD_BASE_SX, mt: 1 }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Insights sx={{ color: '#5D4037' }} />
              <Typography variant="h6" sx={{ color: '#5D4037', fontWeight: 'bold' }}>
                Resumen ejecutivo
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" sx={{ color: '#8D6E63' }}>
                Período: {rangoLabel}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {diasPeriodo} días analizados
              </Typography>
            </Box>
          </Box>

          {/* Bloque superior: variación y método/producto destacados */}
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1.2fr 1fr 1fr' } }}>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#F5F5F5' }}>
              <Typography variant="body2" sx={{ color: '#5D4037', mb: 0.5 }}>Variación mensual</Typography>
              <Typography variant="h4" sx={{ color: comparativa.esPositivo ? '#2E7D32' : '#D32F2F', fontWeight: 'bold' }}>
                {comparativa.esPositivo ? '↗' : '↘'} {Math.abs(comparativa.porcentaje).toFixed(1)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                vs mes anterior (${comparativa.mesAnterior.toLocaleString('es-CL', { minimumFractionDigits: 0 })})
              </Typography>
            </Box>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#F5F5F5' }}>
              <Typography variant="body2" sx={{ color: '#5D4037', mb: 0.5 }}>Mejor método de pago</Typography>
              <Typography variant="subtitle1" sx={{ color: '#5D4037', fontWeight: 'bold' }}>{resumen.mejorMetodo}</Typography>
            </Box>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#F5F5F5' }}>
              <Typography variant="body2" sx={{ color: '#5D4037', mb: 0.5 }}>Producto destacado</Typography>
              <Typography variant="subtitle1" sx={{ color: '#5D4037', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {resumen.productoDestacado}
              </Typography>
            </Box>
          </Box>

          {/* Bloque medio: Top productos + Tendencia 6 meses */}
          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
            <Box sx={{ p: 2, borderRadius: 2, border: '1px solid #D7CCC8', backgroundColor: '#FAF9F7', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="subtitle1" sx={{ color: '#5D4037', fontWeight: 'bold', mb: 1 }}>
                Top productos
              </Typography>
              <GraficoBarrasProductos datos={datos.productosMasVendidos} />
            </Box>
            <Box sx={{ p: 2, borderRadius: 2, border: '1px solid #D7CCC8', backgroundColor: '#FAF9F7', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="subtitle1" sx={{ color: '#5D4037', fontWeight: 'bold', mb: 1 }}>
                Tendencia últimos 6 meses
              </Typography>
              <GraficoTendenciaMensual datos={datos.tendenciaMensual} />
            </Box>
          </Box>

          {/* Bloque inferior: Comisiones y métricas extra resumidas */}
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
            <Box sx={{ p: 2, borderRadius: 2, border: '1px solid #D7CCC8' }}>
              <Typography variant="subtitle2" sx={{ color: '#5D4037', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AttachMoney fontSize="small" /> Comisiones
              </Typography>
              <GraficoComisiones comisiones={datos.comisiones} />
            </Box>
            <Box sx={{ p: 2, borderRadius: 2, border: '1px solid #D7CCC8' }}>
              <Typography variant="subtitle2" sx={{ color: '#5D4037', mb: 1 }}>Métricas adicionales</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Ventas por día</Typography>
                  <Typography variant="h6" sx={{ color: '#5D4037', fontWeight: 'bold' }}>
                    {metricas.ventasPorDia.toFixed(1)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Productos por venta</Typography>
                  <Typography variant="h6" sx={{ color: '#5D4037', fontWeight: 'bold' }}>
                    {metricas.productosPorVenta.toFixed(1)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    )
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1600, margin: '0 auto' }}>
      {/* Header del período */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #5D4037, #8D6E63)', boxShadow: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container alignItems="center" justifyContent="space-between">
            <Grid item>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Analytics sx={{ fontSize: 40, color: 'white' }} />
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    Estadísticas de Ventas
                  </Typography>
                  <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    {formatearMes(periodo.inicio)}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" startIcon={<ArrowBackIos />} onClick={() => cambiarMes(-1)} sx={{ color: 'white', borderColor: 'white' }}>Anterior</Button>
                <Button variant="outlined" onClick={() => setPeriodo({ inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1), fin: new Date() })} sx={{ color: 'white', borderColor: 'white' }}>Actual</Button>
                <Button variant="outlined" endIcon={<ArrowForwardIos />} onClick={() => cambiarMes(1)} sx={{ color: 'white', borderColor: 'white' }}>Siguiente</Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Fila 1: 4 KPIs */}
      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(4, minmax(0, 1fr))'
          },
          mb: 3
        }}
      >
        {kpiCards.map(({ key, element }) => (
          <Box key={key} sx={{ display: 'flex', width: '100%' }}>
            {element}
          </Box>
        ))}
      </Box>

      {/* Fila 2: 2 gráficos (torta financiero + métodos de pago en torta) */}
      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(2, minmax(0, 1fr))'
          },
          mb: 3
        }}
      >
        {chartCards.map(({ key, element }) => (
          <Box key={key} sx={{ display: 'flex', width: '100%' }}>
            {element}
          </Box>
        ))}
      </Box>

      {/* Tarjeta resumen global con el resto de componentes */}
      <Box>
        {summaryCard.element}
      </Box>
    </Box>
  );
}

// --- Componentes Auxiliares Actualizados para Uniformidad ---

function MetricaRapida({ titulo, valor, icono, color }) {
  return (
    <Card sx={{ ...CARD_BASE_SX, borderLeft: `6px solid ${color}`, textAlign: 'center', justifyContent: 'center' }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 64,
          height: 64,
          borderRadius: '20px',
          backgroundColor: `${color}1a`,
          color: color
        }}>
          {React.cloneElement(icono, { sx: { fontSize: 32 } })}
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#3E2723', lineHeight: 1 }}>
          {valor}
        </Typography>
        <Typography variant="body2" sx={{ color: '#8D6E63', letterSpacing: 1, fontWeight: 600 }}>
          {titulo}
        </Typography>
      </CardContent>
    </Card>
  );
}

const FIXED_ROW_COUNT = 6;
const FIXED_TABLE_HEIGHT = 180;
const TABLE_ROW_TEMPLATE = 'minmax(0, 1.4fr) minmax(0, 0.8fr) minmax(0, 0.5fr)';

function GraficoTendenciaMensual({ datos }) {
  const maxValor = Math.max(...datos.map(d => d.total), 1);
  // Rellenar hasta 6 filas
  const filledData = [...datos];
  while (filledData.length < FIXED_ROW_COUNT) {
    filledData.push({ mes: '-', total: 0, isEmpty: true });
  }
  const displayData = filledData.slice(0, FIXED_ROW_COUNT);

  return (
    <Box sx={{ width: '100%', height: FIXED_TABLE_HEIGHT, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      {displayData.map((item, index) => {
        const porcentaje = item.isEmpty ? 0 : (item.total / maxValor) * 100;
        const mesLabel = item.mes.split(' ')[0];
        return (
          <Box
            key={index}
            sx={{
              display: 'grid',
              gridTemplateColumns: TABLE_ROW_TEMPLATE,
              alignItems: 'center',
              columnGap: 1.5,
              height: 24
            }}
          >
            <Tooltip title={item.isEmpty ? '' : mesLabel} disableHoverListener={item.isEmpty} arrow>
              <Typography
                variant="caption"
                sx={{
                  color: item.isEmpty ? 'transparent' : '#5D4037',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {mesLabel}
              </Typography>
            </Tooltip>
            <Box sx={{ width: '100%', height: 8, backgroundColor: '#EFEBE9', borderRadius: 4, overflow: 'hidden', justifySelf: 'stretch' }}>
              {!item.isEmpty && (
                <Box sx={{ width: `${porcentaje}%`, height: '100%', background: 'linear-gradient(90deg, #5D4037, #8D6E63)', borderRadius: 4 }} />
              )}
            </Box>
            <Typography
              variant="caption"
              sx={{ textAlign: 'right', fontWeight: 'bold', color: item.isEmpty ? 'transparent' : '#5D4037' }}
            >
              {item.isEmpty ? '-' : `$${(item.total/1000).toFixed(0)}k`}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

function GraficoBarrasProductos({ datos }) {
  const maxCantidad = Math.max(...datos.map(item => item[1] || 0), 1);
  // Rellenar hasta 6 filas
  const filledData = [...datos];
  while (filledData.length < FIXED_ROW_COUNT) {
    filledData.push([{ nombre: '-' }, 0, true]); // [producto, cantidad, isEmpty]
  }
  const displayData = filledData.slice(0, FIXED_ROW_COUNT);

  return (
    <Box sx={{ width: '100%', height: FIXED_TABLE_HEIGHT, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      {displayData.map((item, index) => {
        const isEmpty = item[2] === true;
        const producto = item[0];
        const cantidad = item[1] || 0;
        const porcentaje = isEmpty ? 0 : (maxCantidad > 0 ? (cantidad / maxCantidad) * 100 : 0);
        const productName = producto?.nombre || '-';
        return (
          <Box
            key={index}
            sx={{
              display: 'grid',
              gridTemplateColumns: TABLE_ROW_TEMPLATE,
              alignItems: 'center',
              columnGap: 1.5,
              height: 24
            }}
          >
            <Tooltip title={isEmpty ? '' : productName} disableHoverListener={isEmpty} arrow>
              <Typography
                variant="caption"
                sx={{
                  color: isEmpty ? 'transparent' : '#5D4037',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {productName}
              </Typography>
            </Tooltip>
            <Box sx={{ width: '100%', height: 8, backgroundColor: '#EFEBE9', borderRadius: 4, overflow: 'hidden', justifySelf: 'stretch' }}>
              {!isEmpty && (
                <Box sx={{ width: `${porcentaje}%`, height: '100%', background: 'linear-gradient(90deg, #5D4037, #8D6E63)', borderRadius: 4 }} />
              )}
            </Box>
            <Typography
              variant="caption"
              sx={{ textAlign: 'right', fontWeight: 'bold', color: isEmpty ? 'transparent' : '#5D4037' }}
            >
              {isEmpty ? '-' : cantidad}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

function GraficoVentasMes({ datos, comisiones }) {
  const { bruto, neto, iva } = datos;
  const netoFinal = neto - comisiones;
  const datosTorta = [
    { nombre: 'Neto', valor: netoFinal, color: '#4CAF50' },
    { nombre: 'Com.', valor: comisiones, color: '#FF6B6B' },
    { nombre: 'IVA', valor: iva, color: '#2196F3' }
  ];
  const total = bruto;
  const pNeto = (netoFinal / total) * 100;
  const pCom = (comisiones / total) * 100;

  return (
    <Box sx={{ textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <Box sx={{ position: 'relative', height: 140, mb: 2 }}>
        <Box sx={{ 
          position: 'relative', width: 140, height: 140, margin: '0 auto', borderRadius: '50%',
          background: `conic-gradient(#4CAF50 0% ${pNeto}%, #FF6B6B ${pNeto}% ${pNeto + pCom}%, #2196F3 ${pNeto + pCom}% 100%)`
        }} />
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          textAlign: 'center', backgroundColor: 'white', borderRadius: '50%', width: 90, height: 90,
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', boxShadow: 1
        }}>
          <Typography variant="caption" sx={{ color: '#8D6E63' }}>Total</Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#5D4037' }}>${Math.round(bruto/1000)}k</Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
        {datosTorta.map((item, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 10, height: 10, backgroundColor: item.color, borderRadius: '50%' }} />
            <Typography variant="caption" sx={{ fontWeight: 'medium' }}>{item.nombre}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function GraficoMetodosPago({ datos }) {
  if (datos.length === 0) return <Box sx={{ textAlign: 'center', py: 4 }}>Sin datos</Box>;

  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
  const total = datos.reduce((acc, m) => acc + m.monto, 0);
  if (total === 0) {
    return <Box sx={{ textAlign: 'center', py: 4 }}>Sin datos</Box>;
  }

  let currentAngle = 0;
  const segmentos = datos.map((m, index) => {
    const porcentaje = (m.monto / total) * 100;
    const start = currentAngle;
    const end = currentAngle + porcentaje;
    currentAngle = end;
    return {
      nombre: m.nombre,
      porcentaje,
      color: colors[index % colors.length],
      start,
      end
    };
  });

  const gradientStops = segmentos
    .map(seg => `${seg.color} ${seg.start}% ${seg.end}%`)
    .join(', ');

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <Box sx={{ position: 'relative', height: 140 }}>
        <Box
          sx={{
            position: 'relative',
            width: 140,
            height: 140,
            margin: '0 auto',
            borderRadius: '50%',
            background: `conic-gradient(${gradientStops})`
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            backgroundColor: 'white',
            borderRadius: '50%',
            width: 90,
            height: 90,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: 1
          }}
        >
          <Typography variant="caption" sx={{ color: '#8D6E63' }}>Total</Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#5D4037' }}>
            ${Math.round(total/1000)}k
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1.5 }}>
        {segmentos.map(seg => (
          <Box key={seg.nombre} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: seg.color }} />
            <Typography variant="caption" sx={{ color: '#5D4037' }}>
              {seg.nombre} ({seg.porcentaje.toFixed(0)}%)
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function GraficoComisiones({ comisiones }) {
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="h3" sx={{ color: '#5D4037', fontWeight: 'bold', mb: 1 }}>
        ${comisiones.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" mb={2}>
        Acumulado del mes
      </Typography>
      <Box sx={{ width: '100%', height: 6, backgroundColor: '#EFEBE9', borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, #5D4037, #8D6E63)' }} />
      </Box>
    </Box>
  );
}