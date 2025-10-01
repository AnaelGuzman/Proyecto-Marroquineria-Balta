package com.marroquineriabalta.controller;

import com.marroquineriabalta.entity.Gasto;
import com.marroquineriabalta.service.GastoService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/gastos")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class GastoController {

    private final GastoService gastoService;

    @PostMapping
    public ResponseEntity<?> registrarGasto(@RequestBody Gasto gasto) {
        try {
            Gasto nuevo = gastoService.registrarGasto(gasto);
            return ResponseEntity.status(HttpStatus.CREATED).body(nuevo);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<Gasto>> listarGastos() {
        return ResponseEntity.ok(gastoService.listarGastos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerGasto(@PathVariable Long id) {
        return gastoService.obtenerGastoPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarGasto(@PathVariable Long id, @RequestBody Gasto gasto) {
        try {
            Gasto existente = gastoService.obtenerGastoPorId(id)
                    .orElseThrow(() -> new RuntimeException("Gasto no encontrado"));
            // Implementar lógica de actualización
            return ResponseEntity.ok("Actualización no implementada");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarGasto(@PathVariable Long id) {
        try {
            gastoService.eliminarGasto(id);
            return ResponseEntity.ok("Gasto eliminado exitosamente");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/total-periodo")
    public ResponseEntity<BigDecimal> obtenerTotalGastosPorPeriodo(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fin) {
        return ResponseEntity.ok(gastoService.obtenerTotalGastosPorPeriodo(inicio, fin));
    }
}