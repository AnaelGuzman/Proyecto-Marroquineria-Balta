package com.marroquineriabalta.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VentaDTO {
    private Long idVenta;
    private LocalDateTime fecha;
    private BigDecimal montoNeto;
    private BigDecimal ivaTotal;
    private BigDecimal comisionTotal;
    private BigDecimal montoBruto;
    private String observaciones;
    private List<MetodoPagoVentaDTO> metodosPago = new ArrayList<>();
    private List<DetalleVentaDTO> detalles = new ArrayList<>();

    // Constructor desde entidad Venta
    public VentaDTO(Long idVenta, LocalDateTime fecha, BigDecimal montoNeto,
                    BigDecimal ivaTotal, BigDecimal comisionTotal, BigDecimal montoBruto,
                    String observaciones) {
        this.idVenta = idVenta;
        this.fecha = fecha;
        this.montoNeto = montoNeto;
        this.ivaTotal = ivaTotal;
        this.comisionTotal = comisionTotal;
        this.montoBruto = montoBruto;
        this.observaciones = observaciones;
    }
}