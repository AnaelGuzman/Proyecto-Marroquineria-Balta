package com.marroquineriabalta.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "unidad_medida")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UnidadMedida {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_unidad_medida")
    private Long idUnidadMedida;

    @Column(nullable = false, unique = true, length = 50)
    private String nombre;

    @Column(length = 10)
    private String abreviatura;

    @Column(name = "activo")
    private Boolean activo = true;
}