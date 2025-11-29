package com.marroquineriabalta.service;

import com.marroquineriabalta.entity.Material;
import com.marroquineriabalta.entity.UnidadMedida;
import com.marroquineriabalta.repository.MaterialRepository;
import com.marroquineriabalta.repository.UnidadMedidaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MaterialService {

    private final MaterialRepository materialRepository;
    private final UnidadMedidaRepository unidadMedidaRepository;
    private final InventarioMaterialService inventarioMaterialService;

    @Transactional
    public Material crearMaterial(Material material) {
        if (material.getUnidadMedida() == null || material.getUnidadMedida().getIdUnidadMedida() == null) {
            throw new RuntimeException("Debe especificar una unidad de medida");
        }

        UnidadMedida unidad = unidadMedidaRepository.findById(material.getUnidadMedida().getIdUnidadMedida())
                .orElseThrow(() -> new RuntimeException("Unidad de medida no encontrada"));

        if (materialRepository.findByNombreAndActivoTrue(material.getNombre()).isPresent()) {
            throw new RuntimeException("Ya existe un material con el nombre: " + material.getNombre());
        }

        material.setUnidadMedida(unidad);
        return materialRepository.save(material);
    }

    @Transactional
    public Material actualizarMaterial(Long id, Material materialActualizado) {
        Material material = materialRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Material no encontrado"));

        if (!material.getNombre().equals(materialActualizado.getNombre())) {
            if (materialRepository.findByNombreAndActivoTrue(materialActualizado.getNombre()).isPresent()) {
                throw new RuntimeException("Ya existe un material con el nombre: " + materialActualizado.getNombre());
            }
        }

        if (materialActualizado.getUnidadMedida() != null && materialActualizado.getUnidadMedida().getIdUnidadMedida() != null) {
            UnidadMedida unidad = unidadMedidaRepository.findById(materialActualizado.getUnidadMedida().getIdUnidadMedida())
                    .orElseThrow(() -> new RuntimeException("Unidad de medida no encontrada"));
            material.setUnidadMedida(unidad);
        }

        material.setNombre(materialActualizado.getNombre());
        material.setDescripcion(materialActualizado.getDescripcion());
        material.setStockMinimo(materialActualizado.getStockMinimo());
        material.setCostoPromedio(materialActualizado.getCostoPromedio());

        return materialRepository.save(material);
    }

    @Transactional
    public void desactivarMaterial(Long id) {
        Material material = materialRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Material no encontrado"));
        material.setActivo(false);
        materialRepository.save(material);
    }

    public List<Material> listarMaterialesActivos() {
        return materialRepository.findByActivoTrue();
    }

    public Optional<Material> obtenerMaterialPorId(Long id) {
        return materialRepository.findById(id);
    }

    public List<Material> buscarPorNombre(String nombre) {
        return materialRepository.buscarPorNombre(nombre);
    }

    public List<Material> obtenerMaterialesBajoStock() {
        return materialRepository.findMaterialesBajoStock();
    }

    public Integer obtenerStockActual(Long idMaterial) {
        return inventarioMaterialService.obtenerStockActual(idMaterial);
    }
}