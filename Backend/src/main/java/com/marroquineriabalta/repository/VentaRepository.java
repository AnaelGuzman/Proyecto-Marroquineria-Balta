package com.marroquineriabalta.repository;

import com.marroquineriabalta.entity.Venta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface VentaRepository extends JpaRepository<Venta, Long> {

    List<Venta> findByFechaBetween(LocalDateTime inicio, LocalDateTime fin);

    @Query("SELECT SUM(v.montoBruto) FROM Venta v WHERE v.fecha BETWEEN :inicio AND :fin")
    BigDecimal sumMontoTotalByFechaBetween(@Param("inicio") LocalDateTime inicio,
                                           @Param("fin") LocalDateTime fin);

    @Query("SELECT SUM(v.montoBruto) FROM Venta v JOIN v.metodosPago mp WHERE mp.metodoPago.idMetodoPago = :idMetodoPago AND v.fecha BETWEEN :inicio AND :fin")
    BigDecimal sumMontoBrutoByMetodoPagoAndPeriodo(@Param("idMetodoPago") Long idMetodoPago,
                                                   @Param("inicio") LocalDateTime inicio,
                                                   @Param("fin") LocalDateTime fin);
}
