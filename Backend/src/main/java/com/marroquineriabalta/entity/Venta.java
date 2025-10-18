package com.marroquineriabalta.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "venta")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Venta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_venta")
    private Long idVenta;

    @Column(nullable = false)
    private LocalDateTime fecha = LocalDateTime.now();

    @Column(name = "monto_neto", precision = 10, scale = 2)
    private BigDecimal montoNeto;

    @Column(name = "iva_total", precision = 10, scale = 2)
    private BigDecimal ivaTotal;

    @Column(name = "comision_total", precision = 10, scale = 2)
    private BigDecimal comisionTotal;

    @Column(name = "monto_bruto", nullable = false, precision = 10, scale = 2)
    private BigDecimal montoBruto;

    @Column(columnDefinition = "TEXT")
    private String observaciones;

    @OneToMany(mappedBy = "venta", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference(value = "venta-metodos-pago")
    private List<MetodoPagoVenta> metodosPago = new ArrayList<>();

    @OneToMany(mappedBy = "venta", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference(value = "venta-detalles")
    private List<DetalleVenta> detalles = new ArrayList<>();

    public void agregarMetodoPago(MetodoPago metodoPago, BigDecimal montoAsignado, BigDecimal comisionCalculada) {
        MetodoPagoVenta metodoPagoVenta = new MetodoPagoVenta();
        metodoPagoVenta.setVenta(this);
        metodoPagoVenta.setMetodoPago(metodoPago);
        metodoPagoVenta.setMontoAsignado(montoAsignado);
        metodoPagoVenta.setComisionCalculada(comisionCalculada);
        this.metodosPago.add(metodoPagoVenta);
    }
}