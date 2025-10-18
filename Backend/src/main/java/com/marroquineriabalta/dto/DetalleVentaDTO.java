package com.marroquineriabalta.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor

public class DetalleVentaDTO {
    private Long idDetalleVenta;
    private ProductoDTO producto;
    private Integer cantidad;
    private BigDecimal precioUnitario;
    private BigDecimal subtotal;

    // Constructor desde entidad DetalleVenta
    public DetalleVentaDTO(Long idDetalleVenta, ProductoDTO producto, Integer cantidad,
                           BigDecimal precioUnitario, BigDecimal subtotal) {
        this.idDetalleVenta = idDetalleVenta;
        this.producto = producto;
        this.cantidad = cantidad;
        this.precioUnitario = precioUnitario;
        this.subtotal = subtotal;
    }
}