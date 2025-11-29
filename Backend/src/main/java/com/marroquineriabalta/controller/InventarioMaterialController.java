package com.marroquineriabalta.controller;

import com.marroquineriabalta.dto.InventarioMaterialDTO;
import com.marroquineriabalta.entity.InventarioMaterial;
import com.marroquineriabalta.mapper.MaterialMapper;
import com.marroquineriabalta.service.InventarioMaterialService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/inventario-materiales")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class InventarioMaterialController {

    private final InventarioMaterialService inventarioMaterialService;
    private final MaterialMapper materialMapper;

    @PostMapping
    public ResponseEntity<?> registrarMovimiento(@RequestBody InventarioMaterial movimiento) {
        try {
            InventarioMaterial nuevo = inventarioMaterialService.registrarMovimiento(movimiento);
            return ResponseEntity.status(HttpStatus.CREATED).body(materialMapper.toDTO(nuevo));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/entrada")
    public ResponseEntity<?> registrarEntrada(
            @RequestParam Long idMaterial,
            @RequestParam Integer cantidad,
            @RequestParam BigDecimal costoUnitario,
            @RequestParam(required = false) String observaciones) {
        try {
            InventarioMaterial movimiento = inventarioMaterialService.registrarEntrada(idMaterial, cantidad, costoUnitario, observaciones);
            return ResponseEntity.status(HttpStatus.CREATED).body(materialMapper.toDTO(movimiento));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/salida")
    public ResponseEntity<?> registrarSalida(
            @RequestParam Long idMaterial,
            @RequestParam Integer cantidad,
            @RequestParam(required = false) String observaciones) {
        try {
            InventarioMaterial movimiento = inventarioMaterialService.registrarSalida(idMaterial, cantidad, observaciones);
            return ResponseEntity.status(HttpStatus.CREATED).body(materialMapper.toDTO(movimiento));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/material/{idMaterial}")
    public ResponseEntity<List<InventarioMaterialDTO>> obtenerMovimientosPorMaterial(@PathVariable Long idMaterial) {
        List<InventarioMaterial> movimientos = inventarioMaterialService.obtenerMovimientosPorMaterial(idMaterial);
        return ResponseEntity.ok(materialMapper.toInventarioMaterialDTOList(movimientos));
    }

    @GetMapping("/material/{idMaterial}/ultimos")
    public ResponseEntity<List<InventarioMaterialDTO>> obtenerUltimosMovimientos(@PathVariable Long idMaterial) {
        List<InventarioMaterial> movimientos = inventarioMaterialService.obtenerUltimosMovimientos(idMaterial);
        return ResponseEntity.ok(materialMapper.toInventarioMaterialDTOList(movimientos));
    }

    @GetMapping("/material/{idMaterial}/stock")
    public ResponseEntity<Integer> obtenerStockActual(@PathVariable Long idMaterial) {
        Integer stock = inventarioMaterialService.obtenerStockActual(idMaterial);
        return ResponseEntity.ok(stock);
    }

    @GetMapping("/material/{idMaterial}/costo")
    public ResponseEntity<BigDecimal> obtenerCostoPromedio(@PathVariable Long idMaterial) {
        BigDecimal costo = inventarioMaterialService.obtenerCostoPromedio(idMaterial);
        return ResponseEntity.ok(costo);
    }
}