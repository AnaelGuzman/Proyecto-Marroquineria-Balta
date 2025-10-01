package com.marroquineriabalta.controller;

import com.marroquineriabalta.entity.MetodoPago;
import com.marroquineriabalta.service.MetodoPagoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/metodos-pago")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class MetodoPagoController {

    private final MetodoPagoService metodoPagoService;

    @PostMapping
    public ResponseEntity<?> crearMetodoPago(@RequestBody MetodoPago metodoPago) {
        try {
            MetodoPago nuevo = metodoPagoService.crearMetodoPago(metodoPago);
            return ResponseEntity.status(HttpStatus.CREATED).body(nuevo);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<MetodoPago>> listarMetodosPago() {
        return ResponseEntity.ok(metodoPagoService.listarMetodosPago());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerMetodoPago(@PathVariable Long id) {
        return metodoPagoService.obtenerMetodoPagoPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarMetodoPago(@PathVariable Long id, @RequestBody MetodoPago metodoPago) {
        try {
            MetodoPago existente = metodoPagoService.obtenerMetodoPagoPorId(id)
                    .orElseThrow(() -> new RuntimeException("Método de pago no encontrado"));
            metodoPago.setIdMetodoPago(id);
            MetodoPago actualizado = metodoPagoService.crearMetodoPago(metodoPago);
            return ResponseEntity.ok(actualizado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarMetodoPago(@PathVariable Long id) {
        try {
            metodoPagoService.obtenerMetodoPagoPorId(id)
                    .orElseThrow(() -> new RuntimeException("Método de pago no encontrado"));
            // Implementar eliminación en service
            return ResponseEntity.ok("Método de pago eliminado exitosamente");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}