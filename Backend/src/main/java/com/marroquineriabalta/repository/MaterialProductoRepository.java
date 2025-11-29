package com.marroquineriabalta.repository;

import com.marroquineriabalta.entity.MaterialProducto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MaterialProductoRepository extends JpaRepository<MaterialProducto, Long> {

    List<MaterialProducto> findByProductoIdProducto(Long idProducto);
    List<MaterialProducto> findByMaterialIdMaterial(Long idMaterial);

    @Query("SELECT mp FROM MaterialProducto mp WHERE mp.producto.idProducto = :idProducto AND mp.material.activo = true")
    List<MaterialProducto> findActivosByProducto(@Param("idProducto") Long idProducto);

    void deleteByProductoIdProducto(Long idProducto);
}