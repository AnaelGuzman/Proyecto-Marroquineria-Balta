package com.marroquineriabalta.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UnidadMedidaDTO {
    private Long idUnidadMedida;
    private String nombre;
    private String abreviatura;
    private Boolean activo;
}