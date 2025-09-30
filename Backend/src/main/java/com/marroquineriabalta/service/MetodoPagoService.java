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

    public List<MetodoPago> listarMetodosPago() {
        return metodoPagoRepository.findAll();
    }

    public Optional<MetodoPago> obtenerMetodoPagoPorId(Long id) {
        return metodoPagoRepository.findById(id);
    }
}
