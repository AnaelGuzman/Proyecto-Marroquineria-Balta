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
}
