package com.marroquineriabalta.mapper;

import com.marroquineriabalta.dto.*;
import com.marroquineriabalta.entity.*;
import com.marroquineriabalta.service.InventarioMaterialService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class MaterialMapper {

    private final UnidadMedidaMapper unidadMedidaMapper;
    private final InventarioMaterialService inventarioMaterialService;

    public MaterialDTO toDTO(Material material) {
        if (material == null) {
            return null;
        }

        MaterialDTO dto = new MaterialDTO();
        dto.setIdMaterial(material.getIdMaterial());
        dto.setNombre(material.getNombre());
        dto.setDescripcion(material.getDescripcion());
        dto.setUnidadMedida(unidadMedidaMapper.toDTO(material.getUnidadMedida()));
        dto.setCostoPromedio(material.getCostoPromedio());
        dto.setStockMinimo(material.getStockMinimo());
        dto.setStockActual(inventarioMaterialService.obtenerStockActual(material.getIdMaterial()));
        dto.setActivo(material.getActivo());

        return dto;
    }

    public UnidadMedidaDTO toDTO(UnidadMedida unidadMedida) {
        if (unidadMedida == null) {
            return null;
        }

        return new UnidadMedidaDTO(
                unidadMedida.getIdUnidadMedida(),
                unidadMedida.getNombre(),
                unidadMedida.getAbreviatura(),
                unidadMedida.getActivo()
        );
    }

    public InventarioMaterialDTO toDTO(InventarioMaterial inventarioMaterial) {
        if (inventarioMaterial == null) {
            return null;
        }

        return new InventarioMaterialDTO(
                inventarioMaterial.getIdInventarioMaterial(),
                toDTO(inventarioMaterial.getMaterial()),
                inventarioMaterial.getCantidad(),
                inventarioMaterial.getCostoUnitario(),
                inventarioMaterial.getFechaActualizacion(),
                inventarioMaterial.getTipoMovimiento(),
                inventarioMaterial.getObservaciones()
        );
    }

    public MaterialProductoDTO toDTO(MaterialProducto materialProducto) {
        if (materialProducto == null) {
            return null;
        }

        ProductoDTO productoDTO = new ProductoDTO(
                materialProducto.getProducto().getIdProducto(),
                materialProducto.getProducto().getNombre(),
                materialProducto.getProducto().getPrecio()
        );

        return new MaterialProductoDTO(
                materialProducto.getIdMaterialProducto(),
                productoDTO,
                toDTO(materialProducto.getMaterial()),
                materialProducto.getCantidad(),
                materialProducto.getCostoCalculado()
        );
    }

    // Métodos para listas
    public List<MaterialDTO> toMaterialDTOList(List<Material> materiales) {
        return materiales.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<UnidadMedidaDTO> toUnidadMedidaDTOList(List<UnidadMedida> unidades) {
        return unidades.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<InventarioMaterialDTO> toInventarioMaterialDTOList(List<InventarioMaterial> movimientos) {
        return movimientos.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<MaterialProductoDTO> toMaterialProductoDTOList(List<MaterialProducto> materialesProducto) {
        return materialesProducto.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
}