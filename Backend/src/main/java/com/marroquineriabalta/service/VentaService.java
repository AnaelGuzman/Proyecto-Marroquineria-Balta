package com.marroquineriabalta.service;

import com.marroquineriabalta.entity.*;
import com.marroquineriabalta.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class VentaService {

    private final VentaRepository ventaRepository;
    private final MetodoPagoRepository metodoPagoRepository;
    private final ProductoRepository productoRepository;
    private final InventarioRepository inventarioRepository;
    private final MetodoPagoVentaRepository metodoPagoVentaRepository;

    private static final BigDecimal PORCENTAJE_IVA = new BigDecimal("0.19");
    private static final BigDecimal FACTOR_IVA = new BigDecimal("1.19");

    @Transactional
    public Venta registrarVenta(Venta venta) {
        validarVenta(venta);

        if (venta.getFecha() == null) {
            venta.setFecha(LocalDateTime.now());
        }

        // 1. Calcular subtotal de productos (precios CON IVA)
        BigDecimal montoBruto = calcularSubtotalProductos(venta);

        // 2. Calcular IVA de los productos
        BigDecimal ivaProductos = montoBruto.subtract(montoBruto.divide(FACTOR_IVA, 2, RoundingMode.HALF_UP));

        // 3. Validar suma de métodos de pago
        BigDecimal sumaMontosAsignados = venta.getMetodosPago().stream()
                .map(MetodoPagoVenta::getMontoAsignado)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (sumaMontosAsignados.compareTo(montoBruto) != 0) {
            throw new RuntimeException("La suma de los montos asignados a los métodos de pago (" +
                    sumaMontosAsignados + ") debe ser igual al monto bruto de la venta (" + montoBruto + ")");
        }

        // 4. Calcular comisiones por método de pago (CON IVA incluido)
        BigDecimal comisionTotal = BigDecimal.ZERO;
        List<MetodoPagoVenta> metodosPagoCalculados = new ArrayList<>();

        for (MetodoPagoVenta metodoPagoVenta : venta.getMetodosPago()) {
            MetodoPago metodoPago = metodoPagoRepository.findById(
                            metodoPagoVenta.getMetodoPago().getIdMetodoPago())
                    .orElseThrow(() -> new RuntimeException("Método de pago no encontrado"));

            // CAMBIO: Calcular comisión CON IVA incluido
            BigDecimal comisionCalculada = calcularComisionConIva(
                    metodoPagoVenta.getMontoAsignado(),
                    metodoPago.getNombre(),
                    metodoPago.getComisionAsociada()
            );

            metodoPagoVenta.setMetodoPago(metodoPago);
            metodoPagoVenta.setComisionCalculada(comisionCalculada);
            metodoPagoVenta.setVenta(venta);
            metodosPagoCalculados.add(metodoPagoVenta);

            comisionTotal = comisionTotal.add(comisionCalculada);
        }

        venta.setMetodosPago(metodosPagoCalculados);

        // CAMBIO: Neto = Bruto - IVA productos - Comisión total (con IVA)
        BigDecimal montoNeto = montoBruto.subtract(ivaProductos).subtract(comisionTotal);

        venta.setMontoNeto(montoNeto);
        venta.setIvaTotal(ivaProductos);
        venta.setComisionTotal(comisionTotal);
        venta.setMontoBruto(montoBruto);

        return ventaRepository.save(venta);
    }

    private BigDecimal calcularSubtotalProductos(Venta venta) {
        BigDecimal subtotalGeneral = BigDecimal.ZERO;

        for (DetalleVenta detalle : venta.getDetalles()) {
            Producto producto = productoRepository.findById(detalle.getProducto().getIdProducto())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado: " +
                            detalle.getProducto().getIdProducto()));

            detalle.setProducto(producto);
            detalle.setVenta(venta);

            BigDecimal subtotal = detalle.getPrecioUnitario()
                    .multiply(BigDecimal.valueOf(detalle.getCantidad()));
            detalle.setSubtotal(subtotal);

            subtotalGeneral = subtotalGeneral.add(subtotal);
            actualizarInventario(producto.getIdProducto(), detalle.getCantidad());
        }

        return subtotalGeneral;
    }

    // NUEVO MÉTODO: Comisión CON IVA incluido
    private BigDecimal calcularComisionConIva(BigDecimal montoAsignado, String nombreMetodoPago, Double comisionAsociada) {
        if (!esPagoConTarjeta(nombreMetodoPago) || comisionAsociada == null || comisionAsociada == 0) {
            return BigDecimal.ZERO;
        }

        // Comisión base (sin IVA)
        BigDecimal comisionBase = montoAsignado.multiply(BigDecimal.valueOf(comisionAsociada))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        // Comisión total = Comisión base * 1.19 (incluye IVA de la comisión)
        return comisionBase.multiply(FACTOR_IVA).setScale(2, RoundingMode.HALF_UP);
    }

    private void validarVenta(Venta venta) {
        if (venta.getMetodosPago() == null || venta.getMetodosPago().isEmpty()) {
            throw new RuntimeException("Debe especificar al menos un método de pago");
        }

        if (venta.getDetalles() == null || venta.getDetalles().isEmpty()) {
            throw new RuntimeException("La venta debe tener al menos un producto");
        }
    }

    @Transactional
    public Venta actualizarVenta(Long id, Venta ventaActualizada) {
        Venta venta = ventaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Venta no encontrada"));

        devolverProductosAlInventario(venta);
        metodoPagoVentaRepository.deleteByVentaIdVenta(venta.getIdVenta());
        venta.getDetalles().clear();
        venta.getMetodosPago().clear();

        venta.setObservaciones(ventaActualizada.getObservaciones());

        BigDecimal subtotalGeneral = calcularSubtotalProductos(ventaActualizada);
        venta.setDetalles(ventaActualizada.getDetalles());

        BigDecimal montoBruto = subtotalGeneral;
        BigDecimal ivaProductos = montoBruto.subtract(montoBruto.divide(FACTOR_IVA, 2, RoundingMode.HALF_UP));

        BigDecimal comisionTotal = BigDecimal.ZERO;
        List<MetodoPagoVenta> metodosPagoCalculados = new ArrayList<>();

        for (MetodoPagoVenta metodoPagoVenta : ventaActualizada.getMetodosPago()) {
            MetodoPago metodoPago = metodoPagoRepository.findById(
                            metodoPagoVenta.getMetodoPago().getIdMetodoPago())
                    .orElseThrow(() -> new RuntimeException("Método de pago no encontrado"));

            // CAMBIO: Comisión CON IVA incluido
            BigDecimal comisionCalculada = calcularComisionConIva(
                    metodoPagoVenta.getMontoAsignado(),
                    metodoPago.getNombre(),
                    metodoPago.getComisionAsociada()
            );

            metodoPagoVenta.setMetodoPago(metodoPago);
            metodoPagoVenta.setComisionCalculada(comisionCalculada);
            metodoPagoVenta.setVenta(venta);
            metodosPagoCalculados.add(metodoPagoVenta);

            comisionTotal = comisionTotal.add(comisionCalculada);
        }

        venta.setMetodosPago(metodosPagoCalculados);

        // CAMBIO: Neto = Bruto - IVA productos - Comisión total (con IVA)
        BigDecimal montoNeto = montoBruto.subtract(ivaProductos).subtract(comisionTotal);

        venta.setMontoNeto(montoNeto);
        venta.setIvaTotal(ivaProductos);
        venta.setComisionTotal(comisionTotal);
        venta.setMontoBruto(montoBruto);

        return ventaRepository.save(venta);
    }

    @Transactional
    public void eliminarVenta(Long id) {
        Venta venta = ventaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Venta no encontrada"));

        devolverProductosAlInventario(venta);
        ventaRepository.deleteById(id);
    }

    private void devolverProductosAlInventario(Venta venta) {
        for (DetalleVenta detalle : venta.getDetalles()) {
            Optional<Inventario> inventarioOpt = inventarioRepository.findByProductoIdProducto(
                    detalle.getProducto().getIdProducto());
            if (inventarioOpt.isPresent()) {
                Inventario inventario = inventarioOpt.get();
                inventario.setCantidadProducto(inventario.getCantidadProducto() + detalle.getCantidad());
                inventario.setFechaActualizacion(LocalDateTime.now());
                inventarioRepository.save(inventario);
            }
        }
    }

    private void actualizarInventario(Long idProducto, Integer cantidad) {
        Optional<Inventario> inventarioOpt = inventarioRepository.findByProductoIdProducto(idProducto);
        if (inventarioOpt.isPresent()) {
            Inventario inventario = inventarioOpt.get();
            inventario.setCantidadProducto(inventario.getCantidadProducto() - cantidad);
            inventario.setFechaActualizacion(LocalDateTime.now());
            inventarioRepository.save(inventario);
        }
    }

    private boolean esPagoConTarjeta(String nombreMetodoPago) {
        if (nombreMetodoPago == null) return false;
        String nombreLower = nombreMetodoPago.toLowerCase();
        return nombreLower.contains("tarjeta") ||
                nombreLower.contains("crédito") ||
                nombreLower.contains("credito") ||
                nombreLower.contains("débito") ||
                nombreLower.contains("debito");
    }

    public List<Venta> listarVentas() {
        return ventaRepository.findAll();
    }

    public Optional<Venta> obtenerVentaPorId(Long id) {
        return ventaRepository.findById(id);
    }

    public List<Venta> obtenerVentasPorPeriodo(LocalDateTime inicio, LocalDateTime fin) {
        return ventaRepository.findByFechaBetween(inicio, fin);
    }

    public BigDecimal obtenerTotalVentasPorPeriodo(LocalDateTime inicio, LocalDateTime fin) {
        BigDecimal total = ventaRepository.sumMontoTotalByFechaBetween(inicio, fin);
        return total != null ? total : BigDecimal.ZERO;
    }

    public BigDecimal obtenerTotalVentasPorMetodoPagoYPeriodo(Long idMetodoPago, LocalDateTime inicio, LocalDateTime fin) {
        BigDecimal total = ventaRepository.sumMontoBrutoByMetodoPagoAndPeriodo(idMetodoPago, inicio, fin);
        return total != null ? total : BigDecimal.ZERO;
    }
}
