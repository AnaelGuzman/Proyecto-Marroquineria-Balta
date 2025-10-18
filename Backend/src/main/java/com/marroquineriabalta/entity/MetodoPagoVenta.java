package com.marroquineriabalta.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "metodo_pago_venta")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MetodoPagoVenta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_metodo_pago_venta")
    private Long idMetodoPagoVenta;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_venta")
    @JsonBackReference(value = "venta-metodos-pago")
    private Venta venta;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_metodo_pago")
    private MetodoPago metodoPago;

    @Column(name = "monto_asignado", nullable = false, precision = 10, scale = 2)
    private BigDecimal montoAsignado;

    @Column(name = "comision_calculada", precision = 10, scale = 2)
    private BigDecimal comisionCalculada;
}