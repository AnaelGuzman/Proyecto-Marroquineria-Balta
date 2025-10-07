package com.marroquineriabalta.repository;

import com.marroquineriabalta.entity.Estadistica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface EstadisticaRepository extends JpaRepository<Estadistica, Long> {

    List<Estadistica> findByTipo(String tipo);

    List<Estadistica> findByFechaBetween(LocalDate inicio, LocalDate fin);
}