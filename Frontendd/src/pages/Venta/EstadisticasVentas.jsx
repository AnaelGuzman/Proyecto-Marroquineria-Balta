import React, { useState, useEffect } from 'react'; 
import { 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Box,
  Button,
  Paper,
  useTheme,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'; 
import { 
  BarChart, 
  PieChart, 
  TrendingUp,
  AttachMoney,
  Payment,
  CalendarMonth,
  ArrowBackIos,
  ArrowForwardIos,
  ShowChart,
  Today,
  Analytics,
  Insights
} from '@mui/icons-material'; 
import { api } from '../../services/api'; 

export default function EstadisticasVentas() {
  const theme = useTheme();
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

      // Calcular comisiones totales
      const comisionTotal = todasVentas.reduce((total, venta) => {
        return total + (parseFloat(venta.comisionTotal) || 0);
      }, 0);

      // Calcular uso de métodos de pago
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

  return (
    <Box sx={{ p: 3, maxWidth: 1400, margin: '0 auto' }}>
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
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button 
                  variant="outlined" 
                  startIcon={<ArrowBackIos />}
                  onClick={() => cambiarMes(-1)}
                  sx={{ color: 'white', borderColor: 'white', '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' } }}
                >
                  Mes anterior
                </Button>
                <Button 
                  variant="outlined"
                  onClick={() => setPeriodo({
                    inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                    fin: new Date()
                  })}
                  sx={{ color: 'white', borderColor: 'white', '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' } }}
                >
                  Mes actual
                </Button>
                <Button 
                  variant="outlined" 
                  endIcon={<ArrowForwardIos />}
                  onClick={() => cambiarMes(1)}
                  sx={{ color: 'white', borderColor: 'white', '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' } }}
                >
                  Mes siguiente
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Sección 1: Métricas Principales */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Métricas Rápidas */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <MetricaRapida 
                titulo="VENTAS TOTALES"
                valor={`$${metricas.totalVentas.toLocaleString('es-CL', { minimumFractionDigits: 0 })}`}
                icono={<AttachMoney />}
                color="#5D4037"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <MetricaRapida 
                titulo="TICKET PROMEDIO"
                valor={`$${metricas.ticketPromedio.toLocaleString('es-CL', { minimumFractionDigits: 0 })}`}
                icono={<Insights />}
                color="#A1887F"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <MetricaRapida 
                titulo="TOTAL VENTAS"
                valor={metricas.cantidadVentas.toString()}
                icono={<BarChart />}
                color="#BCAAA4"
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Comparativa Mensual */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', boxShadow: 2 }}>
            <CardContent sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#5D4037', fontWeight: 'bold' }}>
                Comparativa Mensual
              </Typography>
              <Chip 
                label={`${comparativa.esPositivo ? '+' : ''}${comparativa.porcentaje.toFixed(1)}%`}
                color={comparativa.esPositivo ? "success" : "error"}
                sx={{ fontSize: '1.2rem', padding: 2, mb: 2 }}
              />
              <Typography variant="body2" sx={{ color: '#8D6E63' }}>
                vs mes anterior
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Sección 2: Resumen Ejecutivo y Tendencias */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Resumen Ejecutivo */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: '100%', boxShadow: 2 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ color: '#5D4037', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                <Analytics sx={{ mr: 1 }} />
                Resumen Ejecutivo
              </Typography>
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#F5F5F5', borderRadius: 2 }}>
                    <Typography variant="h4" sx={{ color: comparativa.esPositivo ? '#2E7D32' : '#D32F2F', fontWeight: 'bold', mb: 1 }}>
                      {comparativa.esPositivo ? '↗' : '↘'} {Math.abs(comparativa.porcentaje).toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#5D4037' }}>
                      {comparativa.esPositivo ? 'Crecimiento' : 'Decrecimiento'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#F5F5F5', borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ color: '#5D4037', fontWeight: 'bold', mb: 1 }}>
                      {resumen.mejorMetodo}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#5D4037' }}>
                      Método de pago más popular
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#F5F5F5', borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ color: '#5D4037', fontWeight: 'bold', mb: 1 }}>
                      {resumen.productoDestacado}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#5D4037' }}>
                      Producto más vendido
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Comisiones */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%', boxShadow: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h5" gutterBottom sx={{ color: '#5D4037', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AttachMoney sx={{ mr: 1 }} />
                Comisiones
              </Typography>
              <GraficoComisiones comisiones={datos.comisiones} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Sección 3: Gráficos Principales */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Tendencia de Ventas */}
        <Grid item xs={12}>
          <Card sx={{ boxShadow: 2 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ color: '#5D4037', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                <ShowChart sx={{ mr: 1 }} />
                Tendencia de Ventas (Últimos 6 Meses)
              </Typography>
              <Box sx={{ mt: 2 }}>
                <GraficoTendenciaMensual datos={datos.tendenciaMensual} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Sección 4: Análisis Detallado */}
      <Grid container spacing={3}>
        {/* Productos más vendidos */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%', boxShadow: 2 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ color: '#5D4037', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                <BarChart sx={{ mr: 1 }} />
                Top 10 Productos Más Vendidos
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Por cantidad de unidades vendidas
              </Typography>
              <Box sx={{ mt: 2 }}>
                <GraficoBarrasProductos datos={datos.productosMasVendidos} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Métodos de pago */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%', boxShadow: 2 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ color: '#5D4037', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                <Payment sx={{ mr: 1 }} />
                Distribución por Método de Pago
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Porcentaje de uso en ventas
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                <GraficoMetodosPago datos={datos.metodosPago} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Resumen Financiero */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%', boxShadow: 2 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ color: '#5D4037', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                <TrendingUp sx={{ mr: 1 }} />
                Resumen Financiero del Mes
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Desglose de montos
              </Typography>
              <Box sx={{ mt: 2 }}>
                <GraficoVentasMes datos={datos.ventasMes} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Métricas Adicionales */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%', boxShadow: 2 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ color: '#5D4037', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                <Insights sx={{ mr: 1 }} />
                Métricas Adicionales
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#F9F9F9' }}>
                    <Typography variant="h6" sx={{ color: '#5D4037', fontWeight: 'bold' }}>
                      {metricas.ventasPorDia.toFixed(1)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#8D6E63' }}>
                      Ventas por día
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#F9F9F9' }}>
                    <Typography variant="h6" sx={{ color: '#5D4037', fontWeight: 'bold' }}>
                      {metricas.productosPorVenta.toFixed(1)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#8D6E63' }}>
                      Productos por venta
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

// Los componentes auxiliares (MetricaRapida, GraficoTendenciaMensual, GraficoBarrasProductos, 
// GraficoVentasMes, GraficoMetodosPago, GraficoComisiones) se mantienen exactamente igual que antes
// Solo copia y pega los mismos componentes que ya tenías...

// Componente para Métricas Rápidas
function MetricaRapida({ titulo, valor, icono, color }) {
  return (
    <Paper sx={{ 
      p: 2, 
      textAlign: 'center',
      background: `linear-gradient(135deg, ${color}20, ${color}40)`,
      border: `2px solid ${color}`,
      borderRadius: 3,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    }}>
      <Box sx={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        width: 50,
        height: 50,
        borderRadius: '50%',
        backgroundColor: color,
        color: 'white',
        mb: 1
      }}>
        {React.cloneElement(icono, { sx: { fontSize: 24 } })}
      </Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', color: color, mb: 1 }}>
        {valor}
      </Typography>
      <Typography variant="body2" sx={{ color: '#5D4037', fontWeight: 'medium' }}>
        {titulo}
      </Typography>
    </Paper>
  );
}

// Componente para Tendencia Mensual
function GraficoTendenciaMensual({ datos }) {
  const maxValor = Math.max(...datos.map(d => d.total), 1);
  
  return (
    <Box sx={{ width: '100%' }}>
      {datos.map((item, index) => {
        const porcentaje = (item.total / maxValor) * 100;
        
        return (
          <Box key={index} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'medium', minWidth: 80 }}>
                {item.mes}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                ${item.total.toLocaleString('es-CL', { minimumFractionDigits: 0 })}
              </Typography>
            </Box>
            <Box sx={{
              width: '100%',
              height: 20,
              backgroundColor: '#D7CCC8',
              borderRadius: '10px',
              overflow: 'hidden'
            }}>
              <Box sx={{
                width: `${porcentaje}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #5D4037, #8D6E63)',
                transition: 'width 0.5s ease',
                borderRadius: '10px'
              }} />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

// Componente para gráfico de barras de productos
function GraficoBarrasProductos({ datos }) {
  const maxCantidad = Math.max(...datos.map(item => item[1] || 0));
  
  if (datos.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <BarChart sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography color="text.secondary">
          No hay datos de ventas para este período
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {datos.slice(0, 10).map((item, index) => {
        const producto = item[0];
        const cantidad = item[1] || 0;
        const porcentaje = maxCantidad > 0 ? (cantidad / maxCantidad) * 100 : 0;
        
        return (
          <Box key={index} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ flex: 2, fontWeight: 'medium' }}>
                {producto?.nombre || 'Producto'}
              </Typography>
              <Typography variant="body2" sx={{ flex: 1, textAlign: 'right', fontWeight: 'bold' }}>
                {cantidad} und
              </Typography>
            </Box>
            <Box sx={{
              width: '100%',
              height: 20,
              backgroundColor: '#D7CCC8',
              borderRadius: '10px',
              overflow: 'hidden'
            }}>
              <Box sx={{
                width: `${porcentaje}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #5D4037, #8D6E63)',
                transition: 'width 0.5s ease',
                borderRadius: '10px'
              }} />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

// Componente para gráfico de ventas del mes
function GraficoVentasMes({ datos }) {
  const { bruto, neto, iva } = datos;
  
  const datosTorta = [
    { nombre: 'Neto', valor: neto, color: '#4CAF50' },
    { nombre: 'IVA (19%)', valor: iva, color: '#2196F3' }
  ];

  const total = neto + iva;

  return (
    <Box sx={{ textAlign: 'center' }}>
      {/* Gráfico de torta para ventas */}
      <Box sx={{ position: 'relative', height: 200, mb: 3 }}>
        <Box sx={{ 
          position: 'relative', 
          width: 200, 
          height: 200, 
          margin: '0 auto',
          borderRadius: '50%',
          background: `conic-gradient(
            #4CAF50 0% ${(neto / total) * 100}%,
            #2196F3 ${(neto / total) * 100}% 100%
          )`
        }} />
        
        {/* Centro del gráfico con total */}
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          backgroundColor: 'white',
          borderRadius: '50%',
          width: 80,
          height: 80,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#5D4037' }}>
            Total
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#5D4037', fontSize: '0.8rem' }}>
            ${bruto.toLocaleString('es-CL')}
          </Typography>
        </Box>
      </Box>

      {/* Leyenda */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
        {datosTorta.map((item, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{
              width: 16,
              height: 16,
              backgroundColor: item.color,
              borderRadius: '4px'
            }} />
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {item.nombre}: ${item.valor.toLocaleString('es-CL', { minimumFractionDigits: 2 })}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function GraficoMetodosPago({ datos }) {
  const total = datos.reduce((sum, metodo) => sum + metodo.monto, 0);
  
  if (datos.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Payment sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography color="text.secondary">
          No hay datos de métodos de pago
        </Typography>
      </Box>
    );
  }

  // Colores más distintos y vibrantes
  const colors = [
    '#FF6B6B', // Rojo coral
    '#4ECDC4', // Turquesa
    '#45B7D1', // Azul claro
    '#96CEB4', // Verde menta
    '#FFEAA7', // Amarillo pastel
    '#DDA0DD', // Ciruela
    '#98D8C8', // Verde agua
    '#F7DC6F', // Amarillo mostaza
    '#BB8FCE', // Lavanda
    '#85C1E9'  // Azul cielo
  ];

  // Calcular porcentajes acumulados para el conic-gradient
  let porcentajeAcumulado = 0;
  const gradientes = datos.map((metodo, index) => {
    const inicio = porcentajeAcumulado;
    porcentajeAcumulado += metodo.porcentaje;
    return `${colors[index]} ${inicio}% ${porcentajeAcumulado}%`;
  }).join(', ');

  return (
    <Box sx={{ width: '100%', maxWidth: 400 }}>
      {/* Gráfico de torta con colores distintos */}
      <Box sx={{ position: 'relative', height: 200, mb: 3 }}>
        <Box sx={{ 
          position: 'relative', 
          width: 200, 
          height: 200, 
          margin: '0 auto',
          borderRadius: '50%',
          background: `conic-gradient(${gradientes})`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }} />
        
        {/* Centro del gráfico */}
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          backgroundColor: 'white',
          borderRadius: '50%',
          width: 70,
          height: 70,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#5D4037', fontSize: '0.7rem' }}>
            Total
          </Typography>
        </Box>
      </Box>

      {/* Leyenda */}
      <Box sx={{ mt: 2 }}>
        {datos.map((metodo, index) => (
          <Box key={metodo.idMetodoPago} sx={{ display: 'flex', alignItems: 'center', mb: 1.5, p: 1, backgroundColor: '#F9F9F9', borderRadius: 1 }}>
            <Box sx={{
              width: 20,
              height: 20,
              backgroundColor: colors[index],
              borderRadius: '4px',
              mr: 2,
              border: '2px solid white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#5D4037' }}>
                {metodo.nombre}
              </Typography>
              {metodo.comisionAsociada > 0 && (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Comisión: {metodo.comisionAsociada}%
                </Typography>
              )}
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#5D4037' }}>
                {metodo.porcentaje.toFixed(1)}%
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// Componente para gráfico de comisiones
function GraficoComisiones({ comisiones }) {
  return (
    <Box>
      <AttachMoney sx={{ 
        fontSize: 80, 
        color: '#5D4037', 
        mb: 2 
      }} />
      <Typography variant="h3" sx={{ 
        color: '#5D4037', 
        fontWeight: 'bold',
        mb: 1
      }}>
        ${comisiones.toLocaleString('es-CL', { minimumFractionDigits: 2 })}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Total Pago en comisiones acumuladas
      </Typography>
      
      {/* Barra de progreso visual */}
      <Box sx={{ 
        mt: 3, 
        width: '100%', 
        height: 8, 
        backgroundColor: '#D7CCC8',
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <Box sx={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, #5D4037, #8D6E63)',
        }} />
      </Box>
    </Box>
  );
}