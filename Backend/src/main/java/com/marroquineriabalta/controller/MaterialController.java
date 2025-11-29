package com.marroquineriabalta.controller;

import com.marroquineriabalta.dto.MaterialDTO;
import com.marroquineriabalta.entity.Material;
import com.marroquineriabalta.mapper.MaterialMapper;
import com.marroquineriabalta.service.MaterialService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/materiales")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class MaterialController {

    private final MaterialService materialService;
    private final MaterialMapper materialMapper;

    @PostMapping
    public ResponseEntity<?> crearMaterial(@RequestBody Material material) {
        try {
            Material nuevo = materialService.crearMaterial(material);
            return ResponseEntity.status(HttpStatus.CREATED).body(materialMapper.toDTO(nuevo));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<MaterialDTO>> listarMaterialesActivos() {
        List<Material> materiales = materialService.listarMaterialesActivos();
        return ResponseEntity.ok(materialMapper.toMaterialDTOList(materiales));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerMaterial(@PathVariable Long id) {
        return materialService.obtenerMaterialPorId(id)
                .map(material -> ResponseEntity.ok(materialMapper.toDTO(material)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/buscar")
    public ResponseEntity<List<MaterialDTO>> buscarMateriales(@RequestParam String nombre) {
        List<Material> materiales = materialService.buscarPorNombre(nombre);
        return ResponseEntity.ok(materialMapper.toMaterialDTOList(materiales));
    }

    @GetMapping("/bajo-stock")
    public ResponseEntity<List<MaterialDTO>> obtenerMaterialesBajoStock() {
        List<Material> materiales = materialService.obtenerMaterialesBajoStock();
        return ResponseEntity.ok(materialMapper.toMaterialDTOList(materiales));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarMaterial(@PathVariable Long id, @RequestBody Material material) {
        try {
            Material actualizado = materialService.actualizarMaterial(id, material);
            return ResponseEntity.ok(materialMapper.toDTO(actualizado));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> desactivarMaterial(@PathVariable Long id) {
        try {
            materialService.desactivarMaterial(id);
            return ResponseEntity.ok("Material desactivado exitosamente");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{id}/stock")
    public ResponseEntity<Integer> obtenerStockMaterial(@PathVariable Long id) {
        Integer stock = materialService.obtenerStockActual(id);
        return ResponseEntity.ok(stock);
    }
}