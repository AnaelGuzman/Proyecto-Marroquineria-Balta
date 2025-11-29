package com.marroquineriabalta.service;

import com.marroquineriabalta.entity.MaterialProducto;
import com.marroquineriabalta.entity.Producto;
import com.marroquineriabalta.entity.Material;
import com.marroquineriabalta.repository.MaterialProductoRepository;
import com.marroquineriabalta.repository.ProductoRepository;
import com.marroquineriabalta.repository.MaterialRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MaterialProductoService {

    private final MaterialProductoRepository materialProductoRepository;
    private final ProductoRepository productoRepository;
    private final MaterialRepository materialRepository;
    private final InventarioMaterialService inventarioMaterialService;

    @Transactional
    public MaterialProducto agregarMaterialAProducto(MaterialProducto materialProducto) {
        if (materialProducto.getProducto() == null || materialProducto.getProducto().getIdProducto() == null) {
            throw new RuntimeException("Debe especificar un producto");
        }
        if (materialProducto.getMaterial() == null || materialProducto.getMaterial().getIdMaterial() == null) {
            throw new RuntimeException("Debe especificar un material");
        }

        Producto producto = productoRepository.findById(materialProducto.getProducto().getIdProducto())
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
        Material material = materialRepository.findById(materialProducto.getMaterial().getIdMaterial())
                .orElseThrow(() -> new RuntimeException("Material no encontrado"));

        materialProducto.setProducto(producto);
        materialProducto.setMaterial(material);

        // Calcular costo basado en el material
        BigDecimal costoMaterial = inventarioMaterialService.obtenerCostoPromedio(material.getIdMaterial());
        materialProducto.setCostoCalculado(costoMaterial.multiply(materialProducto.getCantidad()));

        return materialProductoRepository.save(materialProducto);
    }

    @Transactional
    public void eliminarMaterialDeProducto(Long id) {
        if (!materialProductoRepository.existsById(id)) {
            throw new RuntimeException("Relación material-producto no encontrada");
        }
        materialProductoRepository.deleteById(id);
    }

    @Transactional
    public void actualizarRecetaProducto(Long idProducto, List<MaterialProducto> materiales) {
        // Eliminar receta existente
        materialProductoRepository.deleteByProductoIdProducto(idProducto);

        // Agregar nuevos materiales
        for (MaterialProducto mp : materiales) {
            mp.getProducto().setIdProducto(idProducto);
            agregarMaterialAProducto(mp);
        }
    }

    public List<MaterialProducto> obtenerMaterialesPorProducto(Long idProducto) {
        return materialProductoRepository.findActivosByProducto(idProducto);
    }

    public List<MaterialProducto> obtenerProductosPorMaterial(Long idMaterial) {
        return materialProductoRepository.findByMaterialIdMaterial(idMaterial);
    }

    public BigDecimal calcularCostoProducto(Long idProducto) {
        List<MaterialProducto> materiales = obtenerMaterialesPorProducto(idProducto);
        return materiales.stream()
                .map(MaterialProducto::getCostoCalculado)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}