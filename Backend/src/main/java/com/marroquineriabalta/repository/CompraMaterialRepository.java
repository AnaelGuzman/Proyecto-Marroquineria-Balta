package com.marroquineriabalta.repository;

import com.marroquineriabalta.entity.CompraMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CompraMaterialRepository extends JpaRepository<CompraMaterial, Long> {

    List<CompraMaterial> findByCompraIdCompra(Long idCompra);
    List<CompraMaterial> findByMaterialIdMaterial(Long idMaterial);
}