package com.marroquineriabalta.service;

import com.marroquineriabalta.entity.InventarioMaterial;
import com.marroquineriabalta.entity.Material;
import com.marroquineriabalta.repository.InventarioMaterialRepository;
import com.marroquineriabalta.repository.MaterialRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class InventarioMaterialService {

    private final InventarioMaterialRepository inventarioMaterialRepository;
    private final MaterialRepository materialRepository;

    @Transactional
    public InventarioMaterial registrarMovimiento(InventarioMaterial movimiento) {
        if (movimiento.getMaterial() == null || movimiento.getMaterial().getIdMaterial() == null) {
            throw new RuntimeException("Debe especificar un material");
        }

        Material material = materialRepository.findById(movimiento.getMaterial().getIdMaterial())
                .orElseThrow(() -> new RuntimeException("Material no encontrado"));

        movimiento.setMaterial(material);
        movimiento.setFechaActualizacion(LocalDateTime.now());

        // Actualizar costo promedio del material si es entrada
        if ("ENTRADA".equals(movimiento.getTipoMovimiento())) {
            actualizarCostoPromedio(material, movimiento.getCostoUnitario(), movimiento.getCantidad());
        }

        return inventarioMaterialRepository.save(movimiento);
    }

    @Transactional
    public InventarioMaterial registrarEntrada(Long idMaterial, Integer cantidad, BigDecimal costoUnitario, String observaciones) {
        Material material = materialRepository.findById(idMaterial)
                .orElseThrow(() -> new RuntimeException("Material no encontrado"));

        InventarioMaterial movimiento = new InventarioMaterial();
        movimiento.setMaterial(material);
        movimiento.setCantidad(cantidad);
        movimiento.setCostoUnitario(costoUnitario);
        movimiento.setTipoMovimiento("ENTRADA");
        movimiento.setObservaciones(observaciones);
        movimiento.setFechaActualizacion(LocalDateTime.now());

        actualizarCostoPromedio(material, costoUnitario, cantidad);

        return inventarioMaterialRepository.save(movimiento);
    }

    @Transactional
    public InventarioMaterial registrarSalida(Long idMaterial, Integer cantidad, String observaciones) {
        Material material = materialRepository.findById(idMaterial)
                .orElseThrow(() -> new RuntimeException("Material no encontrado"));

        Integer stockActual = obtenerStockActual(idMaterial);
        if (stockActual < cantidad) {
            throw new RuntimeException("Stock insuficiente. Stock actual: " + stockActual);
        }

        // Obtener el último costo para la salida
        BigDecimal costoUnitario = obtenerCostoPromedio(idMaterial);

        InventarioMaterial movimiento = new InventarioMaterial();
        movimiento.setMaterial(material);
        movimiento.setCantidad(cantidad);
        movimiento.setCostoUnitario(costoUnitario);
        movimiento.setTipoMovimiento("SALIDA");
        movimiento.setObservaciones(observaciones);
        movimiento.setFechaActualizacion(LocalDateTime.now());

        return inventarioMaterialRepository.save(movimiento);
    }

    public Integer obtenerStockActual(Long idMaterial) {
        Integer entradas = inventarioMaterialRepository.sumEntradasByMaterial(idMaterial);
        Integer salidas = inventarioMaterialRepository.sumSalidasByMaterial(idMaterial);
        return entradas - salidas;
    }

    public BigDecimal obtenerCostoPromedio(Long idMaterial) {
        Optional<InventarioMaterial> ultimoMovimiento = inventarioMaterialRepository
                .findFirstByMaterialIdMaterialOrderByFechaActualizacionDesc(idMaterial);

        return ultimoMovimiento.map(InventarioMaterial::getCostoUnitario)
                .orElse(BigDecimal.ZERO);
    }

    private void actualizarCostoPromedio(Material material, BigDecimal nuevoCosto, Integer cantidad) {
        Integer stockActual = obtenerStockActual(material.getIdMaterial());
        BigDecimal costoActual = material.getCostoPromedio() != null ? material.getCostoPromedio() : BigDecimal.ZERO;

        if (stockActual == 0) {
            material.setCostoPromedio(nuevoCosto);
        } else {
            BigDecimal costoTotalActual = costoActual.multiply(BigDecimal.valueOf(stockActual));
            BigDecimal costoTotalNuevo = nuevoCosto.multiply(BigDecimal.valueOf(cantidad));
            BigDecimal nuevoCostoPromedio = costoTotalActual.add(costoTotalNuevo)
                    .divide(BigDecimal.valueOf(stockActual + cantidad), 2, java.math.RoundingMode.HALF_UP);
            material.setCostoPromedio(nuevoCostoPromedio);
        }

        materialRepository.save(material);
    }

    public List<InventarioMaterial> obtenerMovimientosPorMaterial(Long idMaterial) {
        return inventarioMaterialRepository.findByMaterialIdMaterial(idMaterial);
    }

    public List<InventarioMaterial> obtenerUltimosMovimientos(Long idMaterial) {
        return inventarioMaterialRepository.findUltimosMovimientos(idMaterial);
    }
}