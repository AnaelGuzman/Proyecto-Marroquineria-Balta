package com.marroquineriabalta.dto;


import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class MetodoPagoDTO {
    private Long idMetodoPago;
    private Double comisionAsociada;
    private String nombre;

    // Constructor desde entidad
    public MetodoPagoDTO(Long idMetodoPago, Double comisionAsociada, String nombre) {
        this.idMetodoPago = idMetodoPago;
        this.comisionAsociada = comisionAsociada;
        this.nombre = nombre;
    }
}