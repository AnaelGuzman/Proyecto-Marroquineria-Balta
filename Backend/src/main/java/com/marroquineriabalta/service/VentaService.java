package com.marroquineriabalta.service;

import com.marroquineriabalta.entity.*;
import com.marroquineriabalta.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
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

        // El precio ya incluye IVA, extraemos el IVA del total
        BigDecimal montoTotal = subtotalGeneral;
        BigDecimal ivaTotal;

        if (metodoPago.getIvaAsociado() != null && metodoPago.getIvaAsociado() > 0) {
            BigDecimal factorIva = BigDecimal.ONE.add(
                    BigDecimal.valueOf(metodoPago.getIvaAsociado()).divide(BigDecimal.valueOf(100))
            );
            ivaTotal = montoTotal.subtract(montoTotal.divide(factorIva, 2, java.math.RoundingMode.HALF_UP));
        } else {
            ivaTotal = BigDecimal.ZERO;
        }

        venta.setIvaTotal(ivaTotal);
        venta.setMontoTotal(montoTotal);

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

        // Agregar nuevos detalles
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

        // Recalcular totales
        BigDecimal montoTotal = subtotalGeneral;
        BigDecimal ivaTotal;

        if (venta.getMetodoPago().getIvaAsociado() != null && venta.getMetodoPago().getIvaAsociado() > 0) {
            BigDecimal factorIva = BigDecimal.ONE.add(
                    BigDecimal.valueOf(venta.getMetodoPago().getIvaAsociado()).divide(BigDecimal.valueOf(100))
            );
            ivaTotal = montoTotal.subtract(montoTotal.divide(factorIva, 2, java.math.RoundingMode.HALF_UP));
        } else {
            ivaTotal = BigDecimal.ZERO;
        }

        venta.setIvaTotal(ivaTotal);
        venta.setMontoTotal(montoTotal);

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