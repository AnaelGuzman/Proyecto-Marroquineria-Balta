package com.marroquineriabalta.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "estadistica")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Estadistica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_estadistica")
    private Long idEstadistica;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(nullable = false, length = 50)
    private String tipo;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal total;

    @Column(columnDefinition = "TEXT")
    private String descripcion;
}