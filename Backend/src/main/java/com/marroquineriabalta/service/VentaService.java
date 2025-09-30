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
        // Validar método de pago
        if (venta.getMetodoPago() == null || venta.getMetodoPago().getIdMetodoPago() == null) {
            throw new RuntimeException("Debe especificar un método de pago");
        }

        MetodoPago metodoPago = metodoPagoRepository.findById(venta.getMetodoPago().getIdMetodoPago())
                .orElseThrow(() -> new RuntimeException("Método de pago no encontrado"));

        venta.setMetodoPago(metodoPago);
        venta.setFecha(LocalDateTime.now());

        // Procesar detalles
        BigDecimal subtotalGeneral = BigDecimal.ZERO;
        List<DetalleVenta> detallesConVenta = new ArrayList<>();

        for (DetalleVenta detalle : venta.getDetalles()) {
            // Validar producto
            Producto producto = productoRepository.findById(detalle.getProducto().getIdProducto())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado: " + detalle.getProducto().getIdProducto()));

            detalle.setProducto(producto);
            detalle.setVenta(venta);

            // Calcular subtotal
            BigDecimal subtotal = detalle.getPrecioUnitario()
                    .multiply(BigDecimal.valueOf(detalle.getCantidad()));
            detalle.setSubtotal(subtotal);

            subtotalGeneral = subtotalGeneral.add(subtotal);
            detallesConVenta.add(detalle);

            // Actualizar inventario
            actualizarInventario(producto.getIdProducto(), detalle.getCantidad());
        }

        venta.setDetalles(detallesConVenta);

        // Calcular IVA
        BigDecimal ivaTotal = calcularIVA(subtotalGeneral, metodoPago.getIvaAsociado());
        BigDecimal montoTotal = subtotalGeneral.add(ivaTotal);

        venta.setIvaTotal(ivaTotal);
        venta.setMontoTotal(montoTotal);

        return ventaRepository.save(venta);
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

    private BigDecimal calcularIVA(BigDecimal monto, Integer porcentajeIva) {
        if (porcentajeIva == null || porcentajeIva == 0) {
            return BigDecimal.ZERO;
        }
        return monto.multiply(BigDecimal.valueOf(porcentajeIva))
                .divide(BigDecimal.valueOf(100));
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
