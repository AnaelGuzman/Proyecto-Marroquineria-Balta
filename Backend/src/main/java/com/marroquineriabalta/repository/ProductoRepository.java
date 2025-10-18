package com.marroquineriabalta.repository;

import com.marroquineriabalta.entity.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {

    List<Producto> findByCategoriaIdCategoria(Long idCategoria);

    @Query("SELECT p FROM Producto p WHERE LOWER(p.nombre) LIKE LOWER(CONCAT('%', :nombre, '%'))")
    List<Producto> buscarPorNombre(@Param("nombre") String nombre);

    @Query("SELECT p, SUM(dv.cantidad) as totalVendido " +
            "FROM DetalleVenta dv JOIN dv.producto p " +
            "WHERE dv.venta.fecha BETWEEN :inicio AND :fin " +
            "GROUP BY p.idProducto " +
            "ORDER BY totalVendido DESC " +
            "LIMIT 10")
    List<Object[]> findProductosMasVendidos(@Param("inicio") LocalDateTime inicio,
                                            @Param("fin") LocalDateTime fin);

}
