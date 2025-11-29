package com.marroquineriabalta.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MaterialProductoDTO {
    private Long idMaterialProducto;
    private ProductoDTO producto;
    private MaterialDTO material;
    private BigDecimal cantidad;
    private BigDecimal costoCalculado;
}