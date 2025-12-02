package com.marroquineriabalta.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegistroRequestDTO {
    private String rut;
    private String nombre;
    private String correoElectronico;
    private String password;
    private String rol;
}
