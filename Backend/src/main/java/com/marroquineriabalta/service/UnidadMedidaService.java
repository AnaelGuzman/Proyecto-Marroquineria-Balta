package com.marroquineriabalta.service;

import com.marroquineriabalta.entity.UnidadMedida;
import com.marroquineriabalta.repository.UnidadMedidaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UnidadMedidaService {

    private final UnidadMedidaRepository unidadMedidaRepository;

    @Transactional
    public UnidadMedida crearUnidadMedida(UnidadMedida unidadMedida) {
        if (unidadMedidaRepository.findByNombreAndActivoTrue(unidadMedida.getNombre()).isPresent()) {
            throw new RuntimeException("Ya existe una unidad de medida con el nombre: " + unidadMedida.getNombre());
        }
        return unidadMedidaRepository.save(unidadMedida);
    }

    @Transactional
    public UnidadMedida actualizarUnidadMedida(Long id, UnidadMedida unidadActualizada) {
        UnidadMedida unidad = unidadMedidaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Unidad de medida no encontrada"));

        if (!unidad.getNombre().equals(unidadActualizada.getNombre())) {
            if (unidadMedidaRepository.findByNombreAndActivoTrue(unidadActualizada.getNombre()).isPresent()) {
                throw new RuntimeException("Ya existe una unidad de medida con el nombre: " + unidadActualizada.getNombre());
            }
        }

        unidad.setNombre(unidadActualizada.getNombre());
        unidad.setAbreviatura(unidadActualizada.getAbreviatura());
        return unidadMedidaRepository.save(unidad);
    }

    @Transactional
    public void desactivarUnidadMedida(Long id) {
        UnidadMedida unidad = unidadMedidaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Unidad de medida no encontrada"));
        unidadMedidaRepository.delete(unidad);
    }

    public List<UnidadMedida> listarUnidadesActivas() {
        return unidadMedidaRepository.findByActivoTrue();
    }

    public Optional<UnidadMedida> obtenerUnidadPorId(Long id) {
        return unidadMedidaRepository.findById(id);
    }
}