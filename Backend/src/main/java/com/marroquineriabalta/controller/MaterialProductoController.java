package com.marroquineriabalta.controller;

import com.marroquineriabalta.dto.MaterialProductoDTO;
import com.marroquineriabalta.entity.MaterialProducto;
import com.marroquineriabalta.mapper.MaterialMapper;
import com.marroquineriabalta.service.MaterialProductoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/recetas")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class MaterialProductoController {

    private final MaterialProductoService materialProductoService;
    private final MaterialMapper materialMapper;

    @PostMapping
    public ResponseEntity<?> agregarMaterialAProducto(@RequestBody MaterialProducto materialProducto) {
        try {
            MaterialProducto nuevo = materialProductoService.agregarMaterialAProducto(materialProducto);
            return ResponseEntity.status(HttpStatus.CREATED).body(materialMapper.toDTO(nuevo));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/producto/{idProducto}")
    public ResponseEntity<List<MaterialProductoDTO>> obtenerMaterialesPorProducto(@PathVariable Long idProducto) {
        List<MaterialProducto> materiales = materialProductoService.obtenerMaterialesPorProducto(idProducto);
        return ResponseEntity.ok(materialMapper.toMaterialProductoDTOList(materiales));
    }

    @GetMapping("/material/{idMaterial}")
    public ResponseEntity<List<MaterialProductoDTO>> obtenerProductosPorMaterial(@PathVariable Long idMaterial) {
        List<MaterialProducto> productos = materialProductoService.obtenerProductosPorMaterial(idMaterial);
        return ResponseEntity.ok(materialMapper.toMaterialProductoDTOList(productos));
    }

    @GetMapping("/producto/{idProducto}/costo")
    public ResponseEntity<BigDecimal> calcularCostoProducto(@PathVariable Long idProducto) {
        BigDecimal costo = materialProductoService.calcularCostoProducto(idProducto);
        return ResponseEntity.ok(costo);
    }

    @PutMapping("/producto/{idProducto}")
    public ResponseEntity<?> actualizarRecetaProducto(@PathVariable Long idProducto, @RequestBody List<MaterialProducto> materiales) {
        try {
            materialProductoService.actualizarRecetaProducto(idProducto, materiales);
            return ResponseEntity.ok("Receta actualizada exitosamente");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarMaterialDeProducto(@PathVariable Long id) {
        try {
            materialProductoService.eliminarMaterialDeProducto(id);
            return ResponseEntity.ok("Material eliminado de la receta exitosamente");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}