package com.marroquineriabalta.controller;

import com.marroquineriabalta.entity.Estadistica;
import com.marroquineriabalta.service.EstadisticaService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

import java.time.YearMonth;
import java.time.format.DateTimeParseException;

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


     /**
     * Descarga resumen del reporte mensual.
     * Params: desde=YYYY-MM, hasta=YYYY-MM, opcionales tipo (ing|egr|all) y categoria (texto).
     */
    @GetMapping("/reporte-mensual/resumen")
    public ResponseEntity<?> descargarReporteMensualResumen(
            @RequestParam String desde,
            @RequestParam String hasta,
            @RequestParam(required = false, defaultValue = "all") String tipo,
            @RequestParam(required = false, defaultValue = "all") String categoria) {
        try {
            YearMonth ymDesde = YearMonth.parse(desde);
            YearMonth ymHasta = YearMonth.parse(hasta);

            LocalDate inicio = ymDesde.atDay(1);
            LocalDate fin = ymHasta.atEndOfMonth();

            byte[] excel = estadisticaService.generarReporteMensualPorPeriodo(inicio, fin, tipo, categoria);
            String filename = String.format("reporte_mensual_%s_%s.xlsx", desde, hasta);
            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(excel);
        } catch (DateTimeParseException dte) {
            return ResponseEntity.badRequest().body("Formato inválido: use yyyy-MM para 'desde' y 'hasta'");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error generando reporte: " + e.getMessage());
        }
    }

    /**
     * Descarga reporte mensual detallado:
     * /api/estadisticas/reporte-mensual?desde=YYYY-MM&hasta=YYYY-MM
     */
    @GetMapping("/reporte-mensual/detallado")
    public ResponseEntity<?> descargarReporteMensualDetallado(
            @RequestParam String desde,
            @RequestParam String hasta) {
        try {
            YearMonth ymDesde = YearMonth.parse(desde);
            YearMonth ymHasta = YearMonth.parse(hasta);

            LocalDate inicio = ymDesde.atDay(1);
            LocalDate fin = ymHasta.atEndOfMonth();

            byte[] excel = estadisticaService.generarReporteMensualDetallado(inicio, fin);
            String filename = String.format("reporte_mensual_detallado_%s_%s.xlsx", desde, hasta);
            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(excel);
        } catch (DateTimeParseException dte) {
            return ResponseEntity.badRequest().body("Formato inválido: use yyyy-MM para 'desde' y 'hasta'");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error generando reporte: " + e.getMessage());
        }
    }
}
