package com.marroquineriabalta.service;

import com.marroquineriabalta.entity.Gasto;
import com.marroquineriabalta.entity.MetodoPago;
import com.marroquineriabalta.repository.GastoRepository;
import com.marroquineriabalta.repository.MetodoPagoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class GastoService {

    private final GastoRepository gastoRepository;
    private final MetodoPagoRepository metodoPagoRepository;

    @Transactional
    public Gasto registrarGasto(Gasto gasto) {
        if (gasto.getMetodoPago() != null && gasto.getMetodoPago().getIdMetodoPago() != null) {
            MetodoPago metodoPago = metodoPagoRepository.findById(gasto.getMetodoPago().getIdMetodoPago())
                    .orElseThrow(() -> new RuntimeException("Método de pago no encontrado"));
            gasto.setMetodoPago(metodoPago);
        }

        gasto.setFecha(LocalDateTime.now());
        return gastoRepository.save(gasto);
    }

    @Transactional
    public Gasto actualizarGasto(Long id, Gasto gastoActualizado) {
        Gasto gasto = gastoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Gasto no encontrado"));

        gasto.setMonto(gastoActualizado.getMonto());
        gasto.setDescripcion(gastoActualizado.getDescripcion());

        if (gastoActualizado.getMetodoPago() != null && gastoActualizado.getMetodoPago().getIdMetodoPago() != null) {
            MetodoPago metodoPago = metodoPagoRepository.findById(gastoActualizado.getMetodoPago().getIdMetodoPago())
                    .orElseThrow(() -> new RuntimeException("Método de pago no encontrado"));
            gasto.setMetodoPago(metodoPago);
        }

        return gastoRepository.save(gasto);
    }

    @Transactional
    public void eliminarGasto(Long id) {
        if (!gastoRepository.existsById(id)) {
            throw new RuntimeException("Gasto no encontrado");
        }
        gastoRepository.deleteById(id);
    }

    public List<Gasto> listarGastos() {
        return gastoRepository.findAll();
    }

    public Optional<Gasto> obtenerGastoPorId(Long id) {
        return gastoRepository.findById(id);
    }

    public BigDecimal obtenerTotalGastosPorPeriodo(LocalDateTime inicio, LocalDateTime fin) {
        BigDecimal total = gastoRepository.sumMontoByFechaBetween(inicio, fin);
        return total != null ? total : BigDecimal.ZERO;
    }
}