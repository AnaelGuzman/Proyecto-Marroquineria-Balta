package com.marroquineriabalta.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockMaterialDTO {
    private MaterialDTO material;
    private Integer stockActual;
    private BigDecimal costoTotal;
    private Boolean bajoStock;
}