package com.marroquineriabalta.repository;

import com.marroquineriabalta.entity.Compra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CompraRepository extends JpaRepository<Compra, Long> {

    List<Compra> findByFechaBetween(LocalDateTime inicio, LocalDateTime fin);

    @Query("SELECT SUM(c.montoTotal) FROM Compra c WHERE c.fecha BETWEEN :inicio AND :fin")
    BigDecimal sumMontoTotalByFechaBetween(@Param("inicio") LocalDateTime inicio,
                                           @Param("fin") LocalDateTime fin);
}
