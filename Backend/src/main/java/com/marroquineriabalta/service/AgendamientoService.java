package com.marroquineriabalta.service;

import com.marroquineriabalta.entity.Agendamiento;
import com.marroquineriabalta.entity.Producto;
import com.marroquineriabalta.repository.AgendamientoRepository;
import com.marroquineriabalta.repository.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AgendamientoService {

    private final AgendamientoRepository agendamientoRepository;
    private final ProductoRepository productoRepository;

    @Transactional
    public Agendamiento crearAgendamiento(Agendamiento agendamiento) {
        Producto producto = obtenerProducto(agendamiento);
        validarFechas(agendamiento);

        agendamiento.setProducto(producto);
        agendamiento.setFechaSolicitud(agendamiento.getFechaSolicitud() != null
                ? agendamiento.getFechaSolicitud()
                : LocalDateTime.now());

        if (agendamiento.getEstado() == null || agendamiento.getEstado().trim().isEmpty()) {
            agendamiento.setEstado("PENDIENTE");
        }

        return agendamientoRepository.save(agendamiento);
    }

    @Transactional
    public Agendamiento actualizarAgendamiento(Long id, Agendamiento datos) {
        Agendamiento existente = agendamientoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Agendamiento no encontrado"));

        if (datos.getProducto() != null && datos.getProducto().getIdProducto() != null) {
            Producto producto = productoRepository.findById(datos.getProducto().getIdProducto())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
            existente.setProducto(producto);
        }

        if (datos.getTitulo() != null) {
            existente.setTitulo(datos.getTitulo());
        }

        existente.setDescripcion(datos.getDescripcion());

        if (datos.getFechaProgramada() != null) {
            existente.setFechaProgramada(datos.getFechaProgramada());
        }

        if (datos.getFechaEntrega() != null) {
            existente.setFechaEntrega(datos.getFechaEntrega());
        }

        if (datos.getEstado() != null && !datos.getEstado().trim().isEmpty()) {
            existente.setEstado(datos.getEstado());
        }

        validarFechas(existente);

        return agendamientoRepository.save(existente);
    }

    @Transactional
    public void eliminarAgendamiento(Long id) {
        if (!agendamientoRepository.existsById(id)) {
            throw new RuntimeException("Agendamiento no encontrado");
        }
        agendamientoRepository.deleteById(id);
    }

    public List<Agendamiento> listarAgendamientos() {
        return agendamientoRepository.findAll();
    }

    public Agendamiento obtenerPorId(Long id) {
        return agendamientoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Agendamiento no encontrado"));
    }

    private Producto obtenerProducto(Agendamiento agendamiento) {
        if (agendamiento.getProducto() == null || agendamiento.getProducto().getIdProducto() == null) {
            throw new RuntimeException("Debe seleccionar un producto para el agendamiento");
        }

        return productoRepository.findById(agendamiento.getProducto().getIdProducto())
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
    }

    private void validarFechas(Agendamiento agendamiento) {
        if (agendamiento.getFechaProgramada() == null) {
            throw new RuntimeException("Debe indicar la fecha programada del agendamiento");
        }

        if (agendamiento.getFechaEntrega() == null) {
            throw new RuntimeException("Debe indicar la fecha de entrega del producto");
        }

        if (agendamiento.getFechaEntrega().isBefore(agendamiento.getFechaProgramada())) {
            throw new RuntimeException("La fecha de entrega no puede ser anterior a la fecha programada");
        }
    }
}
