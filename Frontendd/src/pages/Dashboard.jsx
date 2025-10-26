// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Card, Table } from '../components/UI.jsx';
import { api } from '../services/api/index.js';
import { 
  TrendingUp, 
  TrendingDown, 
  AccountBalance, 
  ShoppingCart,
  AttachMoney,
  Inventory,
  Warning,
  Receipt
} from '@mui/icons-material';

export default function Dashboard() {
  const [resumen, setResumen] = useState([
    { 
      label: 'Ingresos (mes)', 
      value: '$ 0',
      icon: <TrendingUp />,
      color: '#4CAF50',
      trend: 'up'
    },
    { 
      label: 'Egresos (mes)', 
      value: '$ 0',
      icon: <TrendingDown />,
      color: '#F44336',
      trend: 'down'
    },
    { 
      label: 'Saldo estimado', 
      value: '$ 0',
      icon: <AccountBalance />,
      color: '#5D4037',
      trend: 'neutral'
    }
  ]);
  
  const [metricas, setMetricas] = useState([
    {
      label: 'Ventas del Día',
      value: '0',
      icon: <ShoppingCart />,
      color: '#2196F3'
    },
    {
      label: 'Productos Vendidos',
      value: '0',
      icon: <AttachMoney />,
      color: '#FF9800'
    },
    {
      label: 'Productos Bajo Stock',
      value: '0',
      icon: <Warning />,
      color: '#F44336'
    }
  ]);

  const [recientes, setRecientes] = useState([]);
  const [bajoStock, setBajoStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const now = new Date();
      
      // Fechas del mes
      const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
      const finMes = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      
      // CORREGIDO: Fechas del día en formato local (sin convertir a UTC)
      const inicioDia = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const finDia = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

      // Crear fechas en formato ISO pero ajustadas a la zona horaria local
      const formatearFechaLocal = (fecha) => {
        const year = fecha.getFullYear();
        const month = String(fecha.getMonth() + 1).padStart(2, '0');
        const day = String(fecha.getDate()).padStart(2, '0');
        const hours = String(fecha.getHours()).padStart(2, '0');
        const minutes = String(fecha.getMinutes()).padStart(2, '0');
        const seconds = String(fecha.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
      };

      const inicioDiaStr = formatearFechaLocal(inicioDia);
      const finDiaStr = formatearFechaLocal(finDia);

      console.log('🔍 DEBUG - Rango de búsqueda del día:', {
        inicio: inicioDiaStr,
        fin: finDiaStr,
        fechaActual: now
      });

      const [
        totalVentasMes, 
        totalComprasMes, 
        totalGastosMes, 
        ventasDelDia,
        todasLasVentas,
        todasLasCompras,
        productosBajoStock
      ] = await Promise.all([
        // Totales del mes
        api.ventas.getTotalPorPeriodo(inicioMes.toISOString(), finMes.toISOString())
          .catch(err => {
            console.error('Error en totalVentasMes:', err);
            return 0;
          }),
        api.compras.getTotalPorPeriodo(inicioMes.toISOString(), finMes.toISOString())
          .catch(err => {
            console.error('Error en totalComprasMes:', err);
            return 0;
          }),
        api.gastos.getTotalPorPeriodo(inicioMes.toISOString(), finMes.toISOString())
          .catch(err => {
            console.error('Error en totalGastosMes:', err);
            return 0;
          }),
        
        // CORREGIDO: Ventas del día con fechas locales
        api.ventas.getPorPeriodo(inicioDiaStr, finDiaStr)
          .catch(err => {
            console.error('❌ Error al obtener ventas del día:', err);
            return [];
          }),
        
        // Todas las ventas para movimientos recientes
        api.ventas.getAll()
          .catch(err => {
            console.error('Error en todas las ventas:', err);
            return [];
          }),
        
        // Todas las compras para movimientos recientes
        api.compras.getAll()
          .catch(err => {
            console.error('Error en todas las compras:', err);
            return [];
          }),
        
        // Productos bajo stock
        api.inventario.getBajoStock(10)
          .catch(err => {
            console.error('Error en productos bajo stock:', err);
            return [];
          })
      ]);

      console.log('📊 Ventas del día obtenidas:', ventasDelDia);
      console.log('📊 Total de ventas del día:', ventasDelDia?.length || 0);

      // CÁLCULO DE RESUMEN FINANCIERO
      const ingresos = parseFloat(totalVentasMes) || 0;
      const egresos = (parseFloat(totalComprasMes) || 0) + (parseFloat(totalGastosMes) || 0);
      const saldo = ingresos - egresos;

      setResumen([
        { 
          label: 'Ingresos (mes)', 
          value: `$ ${ingresos.toLocaleString('es-CL', { minimumFractionDigits: 0 })}`,
          icon: <TrendingUp />,
          color: '#4CAF50',
          trend: 'up'
        },
        { 
          label: 'Egresos (mes)', 
          value: `$ ${egresos.toLocaleString('es-CL', { minimumFractionDigits: 0 })}`,
          icon: <TrendingDown />,
          color: '#F44336',
          trend: 'down'
        },
        { 
          label: 'Saldo estimado', 
          value: `$ ${saldo.toLocaleString('es-CL', { minimumFractionDigits: 0 })}`,
          icon: <AccountBalance />,
          color: saldo >= 0 ? '#4CAF50' : '#F44336',
          trend: saldo >= 0 ? 'up' : 'down'
        }
      ]);

      // CÁLCULO DE MÉTRICAS DEL DÍA - CORREGIDO
      const ventasDelDiaArray = Array.isArray(ventasDelDia) ? ventasDelDia : [];
      const cantidadVentasDia = ventasDelDiaArray.length;
      
      // Calcular productos vendidos correctamente con validación
      const productosVendidosDia = ventasDelDiaArray.reduce((total, venta) => {
        if (venta && venta.detalles && Array.isArray(venta.detalles)) {
          return total + venta.detalles.reduce((sum, detalle) => {
            return sum + (parseInt(detalle?.cantidad) || 0);
          }, 0);
        }
        return total;
      }, 0);

      console.log('✅ Métricas calculadas:', {
        cantidadVentas: cantidadVentasDia,
        productosVendidos: productosVendidosDia
      });

      const productosBajoStockCount = Array.isArray(productosBajoStock) ? productosBajoStock.length : 0;

      setMetricas([
        {
          label: 'Ventas del Día',
          value: cantidadVentasDia.toString(),
          icon: <ShoppingCart />,
          color: '#2196F3'
        },
        {
          label: 'Productos Vendidos',
          value: productosVendidosDia.toString(),
          icon: <AttachMoney />,
          color: '#FF9800'
        },
        {
          label: 'Productos Bajo Stock',
          value: productosBajoStockCount.toString(),
          icon: <Warning />,
          color: productosBajoStockCount > 0 ? '#F44336' : '#4CAF50'
        }
      ]);

      // PRODUCTOS BAJO STOCK - CORREGIDO
      const productosBajoStockArray = Array.isArray(productosBajoStock) ? productosBajoStock : [];
      setBajoStock(productosBajoStockArray.slice(0, 5).map(producto => [
        producto?.producto?.nombre || 'Producto',
        <span style={{ 
          color: (producto?.cantidadProducto || 0) < 5 ? '#F44336' : '#FF9800',
          fontWeight: '600'
        }}>
          {producto?.cantidadProducto || 0} unidades
        </span>,
        <span style={{ 
          background: (producto?.cantidadProducto || 0) < 5 ? '#FFEBEE' : '#FFF3E0',
          color: (producto?.cantidadProducto || 0) < 5 ? '#C62828' : '#EF6C00',
          padding: '0.25rem 0.75rem',
          borderRadius: '20px',
          fontSize: '0.85rem',
          fontWeight: '500'
        }}>
          {(producto?.cantidadProducto || 0) < 5 ? 'Crítico' : 'Bajo'}
        </span>
      ]));

      // MOVIMIENTOS RECIENTES
      const movimientosRecientes = [];
      const todasLasVentasArray = Array.isArray(todasLasVentas) ? todasLasVentas : [];
      const todasLasComprasArray = Array.isArray(todasLasCompras) ? todasLasCompras : [];

      // Procesar ventas recientes (últimas 2 semanas)
      const ventasRecientes = todasLasVentasArray.filter(venta => {
        const fechaVenta = obtenerFechaDesdeDato(venta?.fecha);
        const dosSemanasAtras = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        return fechaVenta >= dosSemanasAtras;
      }).slice(-10);

      ventasRecientes.reverse().forEach(venta => {
        const primerProducto = venta?.detalles && Array.isArray(venta.detalles) && venta.detalles.length > 0
          ? (venta.detalles[0]?.producto?.nombre || 'Producto')
          : 'Venta sin productos';
        
        const fechaFormateada = formatearFecha(venta?.fecha);
        const monto = venta?.montoBruto || venta?.montoTotal || 0;
        
        movimientosRecientes.push({
          fecha: fechaFormateada,
          descripcion: primerProducto,
          monto: monto,
          tipo: 'venta',
          fechaOriginal: obtenerFechaDesdeDato(venta?.fecha)
        });
      });

      // Procesar compras recientes
      const comprasRecientes = todasLasComprasArray.filter(compra => {
        const fechaCompra = obtenerFechaDesdeDato(compra?.fecha);
        const dosSemanasAtras = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        return fechaCompra >= dosSemanasAtras;
      }).slice(-10);

      comprasRecientes.reverse().forEach(compra => {
        const primerProducto = compra?.detalles && Array.isArray(compra.detalles) && compra.detalles.length > 0
          ? (compra.detalles[0]?.descripcion || 'Insumo')
          : 'Compra sin detalles';
        
        const fechaFormateada = formatearFecha(compra?.fecha);
        const monto = compra?.montoTotal || 0;
        
        movimientosRecientes.push({
          fecha: fechaFormateada,
          descripcion: primerProducto,
          monto: monto,
          tipo: 'compra',
          fechaOriginal: obtenerFechaDesdeDato(compra?.fecha)
        });
      });

      // Ordenar por fecha y tomar los 10 más recientes
      const movimientosOrdenados = movimientosRecientes
        .sort((a, b) => b.fechaOriginal - a.fechaOriginal)
        .slice(0, 10)
        .map(mov => [
          mov.fecha,
          mov.descripcion,
          `$ ${mov.monto.toLocaleString('es-CL', { minimumFractionDigits: 0 })}`,
          <span style={{ 
            background: mov.tipo === 'venta' ? '#E8F5E8' : '#E3F2FD', 
            color: mov.tipo === 'venta' ? '#2E7D32' : '#1565C0', 
            padding: '0.25rem 0.75rem', 
            borderRadius: '20px', 
            fontSize: '0.85rem',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            {mov.tipo === 'venta' ? '🛒 Venta' : '📦 Compra'}
          </span>
        ]);

      setRecientes(movimientosOrdenados);

    } catch (error) {
      console.error('❌ Error al cargar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // FUNCIÓN AUXILIAR PARA OBTENER FECHA DESDE DIFERENTES FORMATOS
  const obtenerFechaDesdeDato = (fechaData) => {
    try {
      if (!fechaData) return new Date();
      
      let fecha;
      
      if (Array.isArray(fechaData)) {
        fecha = new Date(fechaData[0], fechaData[1] - 1, fechaData[2]);
      } else if (typeof fechaData === 'string') {
        fecha = new Date(fechaData);
      } else if (fechaData instanceof Date) {
        fecha = fechaData;
      } else {
        fecha = new Date();
      }

      if (isNaN(fecha.getTime())) {
        return new Date();
      }

      return fecha;
    } catch (e) {
      console.error('Error al obtener fecha:', e);
      return new Date();
    }
  };

  const formatearFecha = (fechaData) => {
    try {
      const fecha = obtenerFechaDesdeDato(fechaData);
      const hoy = new Date();
      const ayer = new Date(hoy);
      ayer.setDate(ayer.getDate() - 1);

      if (fecha.toDateString() === hoy.toDateString()) {
        return 'Hoy';
      } else if (fecha.toDateString() === ayer.toDateString()) {
        return 'Ayer';
      } else {
        return fecha.toLocaleDateString('es-CL', { 
          day: '2-digit', 
          month: 'short'
        });
      }
    } catch (e) {
      console.error('Error al formatear fecha:', e);
      return 'Fecha inválida';
    }
  };

  if (loading) {
    return (
      <div className="stack">
        <Card title="Cargando Dashboard" accent="accent">
          <div className="loading">
            <p>Obteniendo datos de la marroquinería...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="stack">
      {/* RESUMEN FINANCIERO */}
      <Card title="Resumen Financiero" subtitle="Vista general del desempeño mensual" accent="accent">
        <div className="stats">
          {resumen.map((r) => (
            <div key={r.label} className="stat">
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: `${r.color}20`,
                  color: r.color
                }}>
                  {React.cloneElement(r.icon, { sx: { fontSize: 28 } })}
                </div>
                <span style={{
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '20px',
                  background: r.trend === 'up' ? '#E8F5E8' : r.trend === 'down' ? '#FFEBEE' : '#F3E5F5',
                  color: r.trend === 'up' ? '#2E7D32' : r.trend === 'down' ? '#C62828' : '#7B1FA2'
                }}>
                  {r.trend === 'up' ? '↗' : r.trend === 'down' ? '↘' : '→'}
                </span>
              </div>
              <span className="stat-label">{r.label}</span>
              <span className="stat-value">{r.value}</span>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
        {/* MÉTRICAS DEL DÍA */}
        <div style={{ gridColumn: 'span 8' }}>
          <Card title="Métricas del Día" subtitle="Actividad comercial del día de hoy">
            <div className="stats">
              {metricas.map((metrica) => (
                <div key={metrica.label} className="stat">
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    marginBottom: '1rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      backgroundColor: `${metrica.color}20`,
                      color: metrica.color
                    }}>
                      {React.cloneElement(metrica.icon, { sx: { fontSize: 24 } })}
                    </div>
                  </div>
                  <span className="stat-label">{metrica.label}</span>
                  <span className="stat-value" style={{ fontSize: '1.8rem' }}>{metrica.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ALERTAS DE INVENTARIO */}
        <div style={{ gridColumn: 'span 4' }}>
          <Card 
            title="Alertas de Stock" 
            subtitle={bajoStock.length > 0 ? "Productos con stock bajo" : "Stock en niveles normales"}
            accent={bajoStock.length > 0 ? "accent" : ""}
          >
            {bajoStock.length > 0 ? (
              <Table 
                columns={["Producto", "Stock", "Estado"]} 
                rows={bajoStock}
              />
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem',
                color: 'var(--muted)'
              }}>
                <Inventory sx={{ fontSize: 48, marginBottom: '1rem', opacity: 0.5 }} />
                <p style={{ margin: 0 }}>Todo el stock en niveles normales</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* MOVIMIENTOS RECIENTES */}
      <Card title="Movimientos Recientes" subtitle="Últimas ventas y compras registradas">
        {recientes.length > 0 ? (
          <Table 
            columns={["Fecha", "Descripción", "Monto", "Tipo"]} 
            rows={recientes} 
          />
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem',
            color: 'var(--muted)'
          }}>
            <Receipt sx={{ fontSize: 48, marginBottom: '1rem', opacity: 0.5 }} />
            <p style={{ margin: 0 }}>No hay movimientos recientes</p>
            <small>Las ventas y compras aparecerán aquí</small>
          </div>
        )}
      </Card>
    </div>
  );
}
