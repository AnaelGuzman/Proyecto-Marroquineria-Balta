package com.marroquineriabalta.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
public class MetodoPagoVentaDTO {
    private Long idMetodoPagoVenta;
    private MetodoPagoDTO metodoPago;
    private BigDecimal montoAsignado;
    private BigDecimal comisionCalculada;

    // Constructor desde entidad MetodoPagoVenta
    public MetodoPagoVentaDTO(Long idMetodoPagoVenta, MetodoPagoDTO metodoPago,
                              BigDecimal montoAsignado, BigDecimal comisionCalculada) {
        this.idMetodoPagoVenta = idMetodoPagoVenta;
        this.metodoPago = metodoPago;
        this.montoAsignado = montoAsignado;
        this.comisionCalculada = comisionCalculada;
    }
}