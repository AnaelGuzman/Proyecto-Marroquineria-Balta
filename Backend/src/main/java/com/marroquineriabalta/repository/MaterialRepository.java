package com.marroquineriabalta.repository;

import com.marroquineriabalta.entity.Material;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface MaterialRepository extends JpaRepository<Material, Long> {

    List<Material> findByActivoTrue();
    Optional<Material> findByNombreAndActivoTrue(String nombre);

    @Query("SELECT m FROM Material m WHERE LOWER(m.nombre) LIKE LOWER(CONCAT('%', :nombre, '%')) AND m.activo = true")
    List<Material> buscarPorNombre(@Param("nombre") String nombre);

    @Query("SELECT m FROM Material m WHERE m.stockMinimo > " +
            "(SELECT COALESCE(SUM(im.cantidad), 0) FROM InventarioMaterial im WHERE im.material = m AND im.tipoMovimiento = 'ENTRADA') - " +
            "(SELECT COALESCE(SUM(im.cantidad), 0) FROM InventarioMaterial im WHERE im.material = m AND im.tipoMovimiento = 'SALIDA') " +
            "AND m.activo = true")
    List<Material> findMaterialesBajoStock();
}