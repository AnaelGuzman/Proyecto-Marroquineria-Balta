package com.marroquineriabalta.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InventarioMaterialDTO {
    private Long idInventarioMaterial;
    private MaterialDTO material;
    private Integer cantidad;
    private BigDecimal costoUnitario;
    private LocalDateTime fechaActualizacion;
    private String tipoMovimiento;
    private String observaciones;
}