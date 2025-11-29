package com.marroquineriabalta.controller;

import com.marroquineriabalta.dto.CompraMaterialRequestDTO;
import com.marroquineriabalta.entity.Compra;
import com.marroquineriabalta.entity.CompraMaterial;
import com.marroquineriabalta.entity.Material;
import com.marroquineriabalta.entity.MetodoPago;
import com.marroquineriabalta.service.CompraService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/compras")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class CompraController {

    private final CompraService compraService;

    @PostMapping
    public ResponseEntity<?> registrarCompra(@RequestBody Compra compra) {
        try {
            Compra nueva = compraService.registrarCompra(compra);
            return ResponseEntity.status(HttpStatus.CREATED).body(nueva);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<Compra>> listarCompras() {
        return ResponseEntity.ok(compraService.listarCompras());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerCompra(@PathVariable Long id) {
        return compraService.obtenerCompraPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarCompra(@PathVariable Long id, @RequestBody Compra compra) {
        try {
            Compra actualizada = compraService.actualizarCompra(id, compra);
            return ResponseEntity.ok(actualizada);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarCompra(@PathVariable Long id) {
        try {
            compraService.eliminarCompra(id);
            return ResponseEntity.ok("Compra eliminada exitosamente");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/total-periodo")
    public ResponseEntity<BigDecimal> obtenerTotalComprasPorPeriodo(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fin) {
        return ResponseEntity.ok(compraService.obtenerTotalComprasPorPeriodo(inicio, fin));
    }
    @PostMapping("/materiales")
    public ResponseEntity<?> registrarCompraMaterial(@RequestBody CompraMaterialRequestDTO request) {
        try {
            Compra nueva = compraService.registrarCompraMaterial(request.getCompra(), request.getMateriales());
            return ResponseEntity.status(HttpStatus.CREATED).body(nueva);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

}