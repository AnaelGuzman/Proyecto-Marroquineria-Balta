package com.marroquineriabalta.dto;

import com.marroquineriabalta.entity.Compra;
import com.marroquineriabalta.entity.CompraMaterial;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CompraMaterialRequestDTO {
    private Long idCompra;
    private Compra compra;
    private List<CompraMaterial> materiales;
}
