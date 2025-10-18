package com.marroquineriabalta.service;

import com.marroquineriabalta.entity.MetodoPago;
import com.marroquineriabalta.entity.MetodoPagoVenta;
import com.marroquineriabalta.repository.MetodoPagoRepository;
import com.marroquineriabalta.repository.MetodoPagoVentaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MetodoPagoService {

    private final MetodoPagoRepository metodoPagoRepository;
    private final MetodoPagoVentaRepository metodoPagoVentaRepository;

    @Transactional
    public MetodoPago crearMetodoPago(MetodoPago metodoPago) {
        // Validar que el nombre sea único - CORREGIDO
        if (metodoPagoRepository.findAll().stream()
                .anyMatch(existente -> existente.getNombre().equalsIgnoreCase(metodoPago.getNombre()))) {
            throw new RuntimeException("Ya existe un método de pago con el nombre: " + metodoPago.getNombre());
        }

        // Validar comisión
        if (metodoPago.getComisionAsociada() != null && metodoPago.getComisionAsociada() < 0) {
            throw new RuntimeException("La comisión no puede ser negativa");
        }

        return metodoPagoRepository.save(metodoPago);
    }

    @Transactional
    public MetodoPago actualizarMetodoPago(Long id, MetodoPago metodoPagoActualizado) {
        MetodoPago metodoPago = metodoPagoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Método de pago no encontrado"));

        // Validar que el nombre sea único (excluyendo el actual) - CORREGIDO
        if (!metodoPago.getNombre().equalsIgnoreCase(metodoPagoActualizado.getNombre())) {
            boolean nombreExiste = metodoPagoRepository.findAll().stream()
                    .filter(existente -> !existente.getIdMetodoPago().equals(id))
                    .anyMatch(existente -> existente.getNombre().equalsIgnoreCase(metodoPagoActualizado.getNombre()));

            if (nombreExiste) {
                throw new RuntimeException("Ya existe un método de pago con el nombre: " + metodoPagoActualizado.getNombre());
            }
        }

        // Validar comisión
        if (metodoPagoActualizado.getComisionAsociada() != null && metodoPagoActualizado.getComisionAsociada() < 0) {
            throw new RuntimeException("La comisión no puede ser negativa");
        }

        metodoPago.setNombre(metodoPagoActualizado.getNombre());
        metodoPago.setComisionAsociada(metodoPagoActualizado.getComisionAsociada());

        return metodoPagoRepository.save(metodoPago);
    }

    @Transactional
    public void eliminarMetodoPago(Long id) {
        MetodoPago metodoPago = metodoPagoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Método de pago no encontrado"));

        // Verificar si el método de pago está siendo usado en alguna venta
        List<MetodoPagoVenta> ventasConEsteMetodo = metodoPagoVentaRepository.findByMetodoPagoIdMetodoPago(id);

        if (!ventasConEsteMetodo.isEmpty()) {
            throw new RuntimeException("No se puede eliminar el método de pago porque está siendo utilizado en " +
                    ventasConEsteMetodo.size() + " venta(s)");
        }

        metodoPagoRepository.deleteById(id);
    }

    public List<MetodoPago> listarMetodosPago() {
        return metodoPagoRepository.findAll();
    }

    public Optional<MetodoPago> obtenerMetodoPagoPorId(Long id) {
        return metodoPagoRepository.findById(id);
    }

    // Nuevo método para verificar si un método de pago está en uso
    public boolean estaEnUso(Long idMetodoPago) {
        return !metodoPagoVentaRepository.findByMetodoPagoIdMetodoPago(idMetodoPago).isEmpty();
    }
}