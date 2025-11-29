package com.marroquineriabalta.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MaterialDTO {
    private Long idMaterial;
    private String nombre;
    private String descripcion;
    private UnidadMedidaDTO unidadMedida;
    private BigDecimal costoPromedio;
    private Integer stockMinimo;
    private Integer stockActual;
    private Boolean activo;
}