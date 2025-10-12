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

    // Constantes
    private static final BigDecimal PORCENTAJE_COMISION = new BigDecimal("2.30");
    private static final BigDecimal PORCENTAJE_IVA = new BigDecimal("19"); // IVA fijo del 19%
    private static final BigDecimal FACTOR_IVA = new BigDecimal("1.19"); // 1 + (19/100)

    @Transactional
    public Venta registrarVenta(Venta venta) {
        if (venta.getMetodoPago() == null || venta.getMetodoPago().getIdMetodoPago() == null) {
            throw new RuntimeException("Debe especificar un método de pago");
        }

        MetodoPago metodoPago = metodoPagoRepository.findById(venta.getMetodoPago().getIdMetodoPago())
                .orElseThrow(() -> new RuntimeException("Método de pago no encontrado"));

        venta.setMetodoPago(metodoPago);

        if (venta.getFecha() == null) {
            venta.setFecha(LocalDateTime.now());
        }

        // Calcular subtotal general (suma de todos los detalles)
        BigDecimal subtotalGeneral = BigDecimal.ZERO;
        List<DetalleVenta> detallesConVenta = new ArrayList<>();

        for (DetalleVenta detalle : venta.getDetalles()) {
            Producto producto = productoRepository.findById(detalle.getProducto().getIdProducto())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado: " + detalle.getProducto().getIdProducto()));

            detalle.setProducto(producto);
            detalle.setVenta(venta);

            BigDecimal subtotal = detalle.getPrecioUnitario()
                    .multiply(BigDecimal.valueOf(detalle.getCantidad()));
            detalle.setSubtotal(subtotal);

            subtotalGeneral = subtotalGeneral.add(subtotal);
            detallesConVenta.add(detalle);

            actualizarInventario(producto.getIdProducto(), detalle.getCantidad());
        }

        venta.setDetalles(detallesConVenta);

        // CÁLCULOS FINANCIEROS:
        // 1. El precio de venta YA incluye IVA (precio bruto)
        BigDecimal montoBruto = subtotalGeneral;

        // 2. Extraer el IVA del precio bruto (SIEMPRE 19%, independiente del método de pago)
        // Monto sin IVA = Bruto / 1.19
        BigDecimal montoSinIva = montoBruto.divide(FACTOR_IVA, 2, RoundingMode.HALF_UP);

        // IVA del producto = Bruto - Sin IVA
        BigDecimal ivaTotal = montoBruto.subtract(montoSinIva);

        // 3. Calcular comisión SOLO si es pago con tarjeta (2.30% sobre el MONTO BRUTO)
        BigDecimal comisionTotal = BigDecimal.ZERO;

        if (esPagoConTarjeta(metodoPago.getNombre())) {
            // Comisión sobre el MONTO BRUTO (total de la transacción)
            BigDecimal comisionNeta = montoBruto.multiply(PORCENTAJE_COMISION)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            // IVA sobre la comisión (19%)
            BigDecimal ivaComision = comisionNeta.multiply(PORCENTAJE_IVA)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            // Comisión total (comisión neta + IVA de la comisión)
            comisionTotal = comisionNeta.add(ivaComision);
        }

        // 4. Monto Neto FINAL = Monto sin IVA del producto - Comisión total
        BigDecimal montoNeto = montoSinIva.subtract(comisionTotal);

        // Guardar todos los valores calculados
        venta.setMontoNeto(montoNeto);      // Lo que realmente recibes
        venta.setIvaTotal(ivaTotal);        // IVA del producto (siempre 19%)
        venta.setComision(comisionTotal);   // Comisión calculada sobre monto bruto
        venta.setMontoBruto(montoBruto);
        venta.setMontoTotal(montoBruto);    // Para compatibilidad

        return ventaRepository.save(venta);
    }

    @Transactional
    public Venta actualizarVenta(Long id, Venta ventaActualizada) {
        Venta venta = ventaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Venta no encontrada"));

        // Devolver productos al inventario antes de actualizar
        for (DetalleVenta detalle : venta.getDetalles()) {
            Optional<Inventario> inventarioOpt = inventarioRepository.findByProductoIdProducto(detalle.getProducto().getIdProducto());
            if (inventarioOpt.isPresent()) {
                Inventario inventario = inventarioOpt.get();
                inventario.setCantidadProducto(inventario.getCantidadProducto() + detalle.getCantidad());
                inventario.setFechaActualizacion(LocalDateTime.now());
                inventarioRepository.save(inventario);
            }
        }

        // Actualizar método de pago si se proporciona
        if (ventaActualizada.getMetodoPago() != null && ventaActualizada.getMetodoPago().getIdMetodoPago() != null) {
            MetodoPago metodoPago = metodoPagoRepository.findById(ventaActualizada.getMetodoPago().getIdMetodoPago())
                    .orElseThrow(() -> new RuntimeException("Método de pago no encontrado"));
            venta.setMetodoPago(metodoPago);
        }

        venta.setObservaciones(ventaActualizada.getObservaciones());

        // Limpiar detalles antiguos
        venta.getDetalles().clear();

        // Agregar nuevos detalles y recalcular
        BigDecimal subtotalGeneral = BigDecimal.ZERO;
        for (DetalleVenta detalle : ventaActualizada.getDetalles()) {
            Producto producto = productoRepository.findById(detalle.getProducto().getIdProducto())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado: " + detalle.getProducto().getIdProducto()));

            detalle.setProducto(producto);
            detalle.setVenta(venta);

            BigDecimal subtotal = detalle.getPrecioUnitario()
                    .multiply(BigDecimal.valueOf(detalle.getCantidad()));
            detalle.setSubtotal(subtotal);

            subtotalGeneral = subtotalGeneral.add(subtotal);
            venta.getDetalles().add(detalle);

            actualizarInventario(producto.getIdProducto(), detalle.getCantidad());
        }

        // Recalcular todos los montos con IVA fijo del 19%
        BigDecimal montoBruto = subtotalGeneral;

        // Extraer IVA (siempre 19%)
        BigDecimal montoSinIva = montoBruto.divide(FACTOR_IVA, 2, RoundingMode.HALF_UP);
        BigDecimal ivaTotal = montoBruto.subtract(montoSinIva);

        // Calcular comisión sobre el MONTO BRUTO
        BigDecimal comisionTotal = BigDecimal.ZERO;

        if (esPagoConTarjeta(venta.getMetodoPago().getNombre())) {
            BigDecimal comisionNeta = montoBruto.multiply(PORCENTAJE_COMISION)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            BigDecimal ivaComision = comisionNeta.multiply(PORCENTAJE_IVA)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            comisionTotal = comisionNeta.add(ivaComision);
        }

        // Monto Neto = Monto sin IVA - Comisión
        BigDecimal montoNeto = montoSinIva.subtract(comisionTotal);

        venta.setMontoNeto(montoNeto);
        venta.setIvaTotal(ivaTotal);
        venta.setComision(comisionTotal);
        venta.setMontoBruto(montoBruto);
        venta.setMontoTotal(montoBruto);

        return ventaRepository.save(venta);
    }

    @Transactional
    public void eliminarVenta(Long id) {
        Venta venta = ventaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Venta no encontrada"));

        // Devolver productos al inventario
        for (DetalleVenta detalle : venta.getDetalles()) {
            Optional<Inventario> inventarioOpt = inventarioRepository.findByProductoIdProducto(detalle.getProducto().getIdProducto());
            if (inventarioOpt.isPresent()) {
                Inventario inventario = inventarioOpt.get();
                inventario.setCantidadProducto(inventario.getCantidadProducto() + detalle.getCantidad());
                inventario.setFechaActualizacion(LocalDateTime.now());
                inventarioRepository.save(inventario);
            }
        }

        ventaRepository.deleteById(id);
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

    /**
     * Verifica si el método de pago es con tarjeta (crédito o débito)
     */
    private boolean esPagoConTarjeta(String nombreMetodoPago) {
        if (nombreMetodoPago == null) {
            return false;
        }

        String nombreLower = nombreMetodoPago.toLowerCase();
        return nombreLower.contains("tarjeta") ||
                nombreLower.contains("crédito") ||
                nombreLower.contains("credito") ||
                nombreLower.contains("débito") ||
                nombreLower.contains("debito") ||
                nombreLower.contains("prepago");
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
}