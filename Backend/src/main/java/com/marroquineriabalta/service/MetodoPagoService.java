package com.marroquineriabalta.service;

import com.marroquineriabalta.entity.MetodoPago;
import com.marroquineriabalta.repository.MetodoPagoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MetodoPagoService {

    private final MetodoPagoRepository metodoPagoRepository;

    @Transactional
    public MetodoPago crearMetodoPago(MetodoPago metodoPago) {
        return metodoPagoRepository.save(metodoPago);
    }

    @Transactional
    public MetodoPago actualizarMetodoPago(Long id, MetodoPago metodoPagoActualizado) {
        MetodoPago metodoPago = metodoPagoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Método de pago no encontrado"));

        metodoPago.setNombre(metodoPagoActualizado.getNombre());
        metodoPago.setIvaAsociado(metodoPagoActualizado.getIvaAsociado());

        return metodoPagoRepository.save(metodoPago);
    }

    @Transactional
    public void eliminarMetodoPago(Long id) {
        if (!metodoPagoRepository.existsById(id)) {
            throw new RuntimeException("Método de pago no encontrado");
        }
        metodoPagoRepository.deleteById(id);
    }

    public List<MetodoPago> listarMetodosPago() {
        return metodoPagoRepository.findAll();
    }

    public Optional<MetodoPago> obtenerMetodoPagoPorId(Long id) {
        return metodoPagoRepository.findById(id);
    }
}