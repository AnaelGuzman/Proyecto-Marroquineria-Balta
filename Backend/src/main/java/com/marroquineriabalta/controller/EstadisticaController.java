package com.marroquineriabalta.controller;

import com.marroquineriabalta.entity.Estadistica;
import com.marroquineriabalta.service.EstadisticaService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/estadisticas")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class EstadisticaController {

    private final EstadisticaService estadisticaService;

    @PostMapping
    public ResponseEntity<?> crearEstadistica(@RequestBody Estadistica estadistica) {
        try {
            Estadistica nueva = estadisticaService.crearEstadistica(estadistica);
            return ResponseEntity.status(HttpStatus.CREATED).body(nueva);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<Estadistica>> listarEstadisticas() {
        return ResponseEntity.ok(estadisticaService.listarEstadisticas());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerEstadistica(@PathVariable Long id) {
        return estadisticaService.obtenerEstadisticaPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/tipo/{tipo}")
    public ResponseEntity<List<Estadistica>> obtenerPorTipo(@PathVariable String tipo) {
        return ResponseEntity.ok(estadisticaService.obtenerPorTipo(tipo));
    }

    @GetMapping("/periodo")
    public ResponseEntity<List<Estadistica>> obtenerPorPeriodo(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {
        return ResponseEntity.ok(estadisticaService.obtenerPorFechaBetween(inicio, fin));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarEstadistica(@PathVariable Long id, @RequestBody Estadistica estadistica) {
        try {
            Estadistica actualizada = estadisticaService.actualizarEstadistica(id, estadistica);
            return ResponseEntity.ok(actualizada);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarEstadistica(@PathVariable Long id) {
        try {
            estadisticaService.eliminarEstadistica(id);
            return ResponseEntity.ok("Estadística eliminada exitosamente");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
