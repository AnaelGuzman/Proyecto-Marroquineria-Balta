package com.marroquineriabalta.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "metodo_pago")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MetodoPago {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_metodo_pago")
    private Long idMetodoPago;

    @Column(name = "iva_asociado")
    private Integer ivaAsociado;

    @Column(nullable = false, unique = true, length = 50)
    private String nombre;
}