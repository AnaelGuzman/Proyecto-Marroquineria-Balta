package com.marroquineriabalta.repository;

import com.marroquineriabalta.entity.DetalleVenta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DetalleVentaRepository extends JpaRepository<DetalleVenta, Long> {

    @Query("SELECT dv.producto.nombre, SUM(dv.cantidad) as total " +
            "FROM DetalleVenta dv " +
            "WHERE dv.venta.fecha BETWEEN :inicio AND :fin " +
            "GROUP BY dv.producto.idProducto, dv.producto.nombre " +
            "ORDER BY total DESC")
    List<Object[]> findProductosMasVendidos(@Param("inicio") LocalDateTime inicio,
                                            @Param("fin") LocalDateTime fin);
}

