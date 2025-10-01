package com.marroquineriabalta.controller;

import com.marroquineriabalta.entity.Inventario;
import com.marroquineriabalta.service.InventarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/inventario")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class InventarioController {

    private final InventarioService inventarioService;

    @PostMapping
    public ResponseEntity<?> registrarInventario(@RequestBody Inventario inventario) {
        try {
            Inventario nuevo = inventarioService.registrarInventario(inventario);
            return ResponseEntity.status(HttpStatus.CREATED).body(nuevo);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<Inventario>> listarInventario() {
        return ResponseEntity.ok(inventarioService.listarInventario());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerInventario(@PathVariable Long id) {
        return inventarioService.obtenerInventarioPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/producto/{idProducto}")
    public ResponseEntity<?> obtenerInventarioPorProducto(@PathVariable Long idProducto) {
        return inventarioService.obtenerInventarioPorProducto(idProducto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarInventario(@PathVariable Long id, @RequestBody Inventario inventario) {
        try {
            Inventario actualizado = inventarioService.actualizarInventario(id, inventario);
            return ResponseEntity.ok(actualizado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarInventario(@PathVariable Long id) {
        try {
            inventarioService.obtenerInventarioPorId(id)
                    .orElseThrow(() -> new RuntimeException("Inventario no encontrado"));
            // Implementar en service si es necesario
            return ResponseEntity.ok("Inventario eliminado exitosamente");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/ajustar/{idProducto}")
    public ResponseEntity<?> ajustarCantidad(@PathVariable Long idProducto, @RequestParam Integer cantidad) {
        try {
            Inventario actualizado = inventarioService.ajustarCantidad(idProducto, cantidad);
            return ResponseEntity.ok(actualizado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/bajo-stock")
    public ResponseEntity<List<Inventario>> obtenerBajoStock(@RequestParam(defaultValue = "10") Integer minimo) {
        return ResponseEntity.ok(inventarioService.obtenerProductosBajoStock(minimo));
    }
}