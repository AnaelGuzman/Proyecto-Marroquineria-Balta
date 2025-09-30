package com.marroquineriabalta.repository;

import com.marroquineriabalta.entity.Inventario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface InventarioRepository extends JpaRepository<Inventario, Long> {

    Optional<Inventario> findByProductoIdProducto(Long idProducto);

    @Query("SELECT i FROM Inventario i WHERE i.cantidadProducto < :minimo")
    List<Inventario> findProductosBajoStock(@Param("minimo") Integer minimo);
}
