package com.marroquineriabalta.controller;

import com.marroquineriabalta.dto.VentaDTO;
import com.marroquineriabalta.entity.Venta;
import com.marroquineriabalta.mapper.VentaMapper;
import com.marroquineriabalta.service.VentaService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ventas")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class VentaController {

    private final VentaService ventaService;
    private final VentaMapper ventaMapper;

    @PostMapping
    public ResponseEntity<?> registrarVenta(@RequestBody Venta venta) {
        try {
            Venta nueva = ventaService.registrarVenta(venta);
            VentaDTO dto = ventaMapper.toDTO(nueva);
            return ResponseEntity.status(HttpStatus.CREATED).body(dto);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<VentaDTO>> listarVentas() {
        List<Venta> ventas = ventaService.listarVentas();
        List<VentaDTO> dtos = ventaMapper.toDTOList(ventas);
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerVenta(@PathVariable Long id) {
        return ventaService.obtenerVentaPorId(id)
                .map(ventaMapper::toDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarVenta(@PathVariable Long id, @RequestBody Venta venta) {
        try {
            Venta actualizada = ventaService.actualizarVenta(id, venta);
            VentaDTO dto = ventaMapper.toDTO(actualizada);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarVenta(@PathVariable Long id) {
        try {
            ventaService.eliminarVenta(id);
            return ResponseEntity.ok("Venta eliminada exitosamente");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/periodo")
    public ResponseEntity<List<VentaDTO>> obtenerVentasPorPeriodo(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fin) {
        List<Venta> ventas = ventaService.obtenerVentasPorPeriodo(inicio, fin);
        List<VentaDTO> dtos = ventaMapper.toDTOList(ventas);
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/total-periodo")
    public ResponseEntity<BigDecimal> obtenerTotalVentasPorPeriodo(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fin) {
        return ResponseEntity.ok(ventaService.obtenerTotalVentasPorPeriodo(inicio, fin));
    }
    @GetMapping("/total-metodo-pago")
    public ResponseEntity<BigDecimal> obtenerTotalVentasPorMetodoPago(
            @RequestParam Long idMetodoPago,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fin) {
        return ResponseEntity.ok(ventaService.obtenerTotalVentasPorMetodoPagoYPeriodo(idMetodoPago, inicio, fin));
    }
}