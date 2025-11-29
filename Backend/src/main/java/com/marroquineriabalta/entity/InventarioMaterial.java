package com.marroquineriabalta.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventario_material")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InventarioMaterial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_inventario_material")
    private Long idInventarioMaterial;

    @ManyToOne
    @JoinColumn(name = "id_material")
    private Material material;

    @Column(nullable = false)
    private Integer cantidad;

    @Column(name = "costo_unitario", precision = 10, scale = 2)
    private BigDecimal costoUnitario;

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion = LocalDateTime.now();

    @Column(name = "tipo_movimiento", length = 20)
    private String tipoMovimiento; // ENTRADA, SALIDA, AJUSTE

    @Column(columnDefinition = "TEXT")
    private String observaciones;
}