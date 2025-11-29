package com.marroquineriabalta.controller;

import com.marroquineriabalta.dto.UnidadMedidaDTO;
import com.marroquineriabalta.entity.UnidadMedida;
import com.marroquineriabalta.mapper.MaterialMapper;
import com.marroquineriabalta.service.UnidadMedidaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/unidades-medida")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class UnidadMedidaController {

    private final UnidadMedidaService unidadMedidaService;
    private final MaterialMapper materialMapper;

    @PostMapping
    public ResponseEntity<?> crearUnidadMedida(@RequestBody UnidadMedida unidadMedida) {
        try {
            UnidadMedida nueva = unidadMedidaService.crearUnidadMedida(unidadMedida);
            return ResponseEntity.status(HttpStatus.CREATED).body(materialMapper.toDTO(nueva));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<UnidadMedidaDTO>> listarUnidadesActivas() {
        List<UnidadMedida> unidades = unidadMedidaService.listarUnidadesActivas();
        return ResponseEntity.ok(materialMapper.toUnidadMedidaDTOList(unidades));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerUnidadMedida(@PathVariable Long id) {
        return unidadMedidaService.obtenerUnidadPorId(id)
                .map(unidad -> ResponseEntity.ok(materialMapper.toDTO(unidad)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarUnidadMedida(@PathVariable Long id, @RequestBody UnidadMedida unidadMedida) {
        try {
            UnidadMedida actualizada = unidadMedidaService.actualizarUnidadMedida(id, unidadMedida);
            return ResponseEntity.ok(materialMapper.toDTO(actualizada));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> desactivarUnidadMedida(@PathVariable Long id) {
        try {
            unidadMedidaService.desactivarUnidadMedida(id);
            return ResponseEntity.ok("Unidad de medida desactivada exitosamente");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}