package com.marroquineriabalta.repository;

import com.marroquineriabalta.entity.UnidadMedida;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UnidadMedidaRepository extends JpaRepository<UnidadMedida, Long> {

    List<UnidadMedida> findByActivoTrue();
    Optional<UnidadMedida> findByNombreAndActivoTrue(String nombre);
    Optional<UnidadMedida> findByAbreviaturaAndActivoTrue(String abreviatura);
}