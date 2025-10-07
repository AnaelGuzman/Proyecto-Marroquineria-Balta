package com.marroquineriabalta.service;

import com.marroquineriabalta.entity.Estadistica;
import com.marroquineriabalta.repository.EstadisticaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class EstadisticaService {

    private final EstadisticaRepository estadisticaRepository;

    @Transactional
    public Estadistica crearEstadistica(Estadistica estadistica) {
        if (estadistica.getFecha() == null) {
            estadistica.setFecha(LocalDate.now());
        }
        return estadisticaRepository.save(estadistica);
    }

    @Transactional
    public Estadistica actualizarEstadistica(Long id, Estadistica estadisticaActualizada) {
        Estadistica estadistica = estadisticaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Estadística no encontrada"));

        estadistica.setFecha(estadisticaActualizada.getFecha());
        estadistica.setTipo(estadisticaActualizada.getTipo());
        estadistica.setTotal(estadisticaActualizada.getTotal());
        estadistica.setDescripcion(estadisticaActualizada.getDescripcion());

        return estadisticaRepository.save(estadistica);
    }

    @Transactional
    public void eliminarEstadistica(Long id) {
        if (!estadisticaRepository.existsById(id)) {
            throw new RuntimeException("Estadística no encontrada");
        }
        estadisticaRepository.deleteById(id);
    }

    public List<Estadistica> listarEstadisticas() {
        return estadisticaRepository.findAll();
    }

    public Optional<Estadistica> obtenerEstadisticaPorId(Long id) {
        return estadisticaRepository.findById(id);
    }

    public List<Estadistica> obtenerPorTipo(String tipo) {
        return estadisticaRepository.findByTipo(tipo);
    }

    public List<Estadistica> obtenerPorFechaBetween(LocalDate inicio, LocalDate fin) {
        return estadisticaRepository.findByFechaBetween(inicio, fin);
    }
}
