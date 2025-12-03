package com.marroquineriabalta.repository;

import com.marroquineriabalta.entity.Agendamiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AgendamientoRepository extends JpaRepository<Agendamiento, Long> {

    List<Agendamiento> findByProductoIdProducto(Long idProducto);

    List<Agendamiento> findByFechaProgramadaBetween(LocalDateTime inicio, LocalDateTime fin);
}
