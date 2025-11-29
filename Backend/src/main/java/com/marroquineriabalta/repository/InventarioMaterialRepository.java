package com.marroquineriabalta.repository;

import com.marroquineriabalta.entity.InventarioMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface InventarioMaterialRepository extends JpaRepository<InventarioMaterial, Long> {

    List<InventarioMaterial> findByMaterialIdMaterial(Long idMaterial);

    @Query("SELECT im FROM InventarioMaterial im WHERE im.material.idMaterial = :idMaterial ORDER BY im.fechaActualizacion DESC")
    List<InventarioMaterial> findUltimosMovimientos(@Param("idMaterial") Long idMaterial);

    @Query("SELECT COALESCE(SUM(im.cantidad), 0) FROM InventarioMaterial im " +
            "WHERE im.material.idMaterial = :idMaterial AND im.tipoMovimiento = 'ENTRADA'")
    Integer sumEntradasByMaterial(@Param("idMaterial") Long idMaterial);

    @Query("SELECT COALESCE(SUM(im.cantidad), 0) FROM InventarioMaterial im " +
            "WHERE im.material.idMaterial = :idMaterial AND im.tipoMovimiento = 'SALIDA'")
    Integer sumSalidasByMaterial(@Param("idMaterial") Long idMaterial);

    Optional<InventarioMaterial> findFirstByMaterialIdMaterialOrderByFechaActualizacionDesc(Long idMaterial);
}