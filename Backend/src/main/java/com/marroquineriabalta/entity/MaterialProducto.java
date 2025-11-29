package com.marroquineriabalta.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "material_producto")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MaterialProducto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_material_producto")
    private Long idMaterialProducto;

    @ManyToOne
    @JoinColumn(name = "id_producto")
    private Producto producto;

    @ManyToOne
    @JoinColumn(name = "id_material")
    private Material material;

    @Column(nullable = false, precision = 8, scale = 3)
    private BigDecimal cantidad;

    @Column(name = "costo_calculado", precision = 10, scale = 2)
    private BigDecimal costoCalculado;
}