package com.marroquineriabalta.mapper;

import com.marroquineriabalta.dto.UnidadMedidaDTO;
import com.marroquineriabalta.entity.UnidadMedida;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class UnidadMedidaMapper {

    public UnidadMedidaDTO toDTO(UnidadMedida unidadMedida) {
        if (unidadMedida == null) {
            return null;
        }

        return new UnidadMedidaDTO(
                unidadMedida.getIdUnidadMedida(),
                unidadMedida.getNombre(),
                unidadMedida.getAbreviatura(),
                unidadMedida.getActivo()
        );
    }

    public List<UnidadMedidaDTO> toDTOList(List<UnidadMedida> unidades) {
        return unidades.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
}