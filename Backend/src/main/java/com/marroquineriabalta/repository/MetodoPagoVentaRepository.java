package com.marroquineriabalta.repository;

import com.marroquineriabalta.entity.MetodoPagoVenta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MetodoPagoVentaRepository extends JpaRepository<MetodoPagoVenta, Long> {

    List<MetodoPagoVenta> findByVentaIdVenta(Long idVenta);

    // NUEVO MÉTODO: Buscar por método de pago
    List<MetodoPagoVenta> findByMetodoPagoIdMetodoPago(Long idMetodoPago);

    @Modifying
    @Query("DELETE FROM MetodoPagoVenta mpv WHERE mpv.venta.idVenta = :idVenta")
    void deleteByVentaIdVenta(@Param("idVenta") Long idVenta);
}