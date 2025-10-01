package com.marroquineriabalta.service;

import com.marroquineriabalta.entity.Compra;
import com.marroquineriabalta.entity.DetalleCompra;
import com.marroquineriabalta.entity.MetodoPago;
import com.marroquineriabalta.repository.CompraRepository;
import com.marroquineriabalta.repository.MetodoPagoRepository;
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
public class CompraService {

    private final CompraRepository compraRepository;
    private final MetodoPagoRepository metodoPagoRepository;

    @Transactional
    public Compra registrarCompra(Compra compra) {
        if (compra.getMetodoPago() == null || compra.getMetodoPago().getIdMetodoPago() == null) {
            throw new RuntimeException("Debe especificar un método de pago");
        }

        MetodoPago metodoPago = metodoPagoRepository.findById(compra.getMetodoPago().getIdMetodoPago())
                .orElseThrow(() -> new RuntimeException("Método de pago no encontrado"));

        compra.setMetodoPago(metodoPago);
        compra.setFecha(LocalDateTime.now());

        List<DetalleCompra> detallesConCompra = new ArrayList<>();
        BigDecimal subtotalGeneral = BigDecimal.ZERO;

        for (DetalleCompra detalle : compra.getDetalles()) {
            detalle.setCompra(compra);
            BigDecimal subtotal = detalle.getPrecioUnitario()
                    .multiply(BigDecimal.valueOf(detalle.getCantidad()));
            detalle.setSubtotal(subtotal);

            subtotalGeneral = subtotalGeneral.add(subtotal);
            detallesConCompra.add(detalle);
        }

        compra.setDetalles(detallesConCompra);

        BigDecimal ivaTotal = calcularIVA(subtotalGeneral, metodoPago.getIvaAsociado());
        BigDecimal montoTotal = subtotalGeneral.add(ivaTotal);

        compra.setIvaTotal(ivaTotal);
        compra.setMontoTotal(montoTotal);

        return compraRepository.save(compra);
    }

    @Transactional
    public Compra actualizarCompra(Long id, Compra compraActualizada) {
        Compra compra = compraRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Compra no encontrada"));

        if (compraActualizada.getMetodoPago() != null && compraActualizada.getMetodoPago().getIdMetodoPago() != null) {
            MetodoPago metodoPago = metodoPagoRepository.findById(compraActualizada.getMetodoPago().getIdMetodoPago())
                    .orElseThrow(() -> new RuntimeException("Método de pago no encontrado"));
            compra.setMetodoPago(metodoPago);
        }

        compra.setObservaciones(compraActualizada.getObservaciones());

        return compraRepository.save(compra);
    }

    @Transactional
    public void eliminarCompra(Long id) {
        if (!compraRepository.existsById(id)) {
            throw new RuntimeException("Compra no encontrada");
        }
        compraRepository.deleteById(id);
    }

    private BigDecimal calcularIVA(BigDecimal monto, Integer porcentajeIva) {
        if (porcentajeIva == null || porcentajeIva == 0) {
            return BigDecimal.ZERO;
        }
        return monto.multiply(BigDecimal.valueOf(porcentajeIva))
                .divide(BigDecimal.valueOf(100));
    }

    public List<Compra> listarCompras() {
        return compraRepository.findAll();
    }

    public Optional<Compra> obtenerCompraPorId(Long id) {
        return compraRepository.findById(id);
    }

    public BigDecimal obtenerTotalComprasPorPeriodo(LocalDateTime inicio, LocalDateTime fin) {
        BigDecimal total = compraRepository.sumMontoTotalByFechaBetween(inicio, fin);
        return total != null ? total : BigDecimal.ZERO;
    }
}