package com.marroquineriabalta.controller;

import com.marroquineriabalta.entity.Agendamiento;
import com.marroquineriabalta.service.AgendamientoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/agendamientos")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AgendamientoController {

    private final AgendamientoService agendamientoService;

    @PostMapping
    public ResponseEntity<?> crear(@RequestBody Agendamiento agendamiento) {
        try {
            Agendamiento nuevo = agendamientoService.crearAgendamiento(agendamiento);
            return ResponseEntity.status(HttpStatus.CREATED).body(nuevo);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<Agendamiento>> listar() {
        return ResponseEntity.ok(agendamientoService.listarAgendamientos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> obtener(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(agendamientoService.obtenerPorId(id));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @RequestBody Agendamiento agendamiento) {
        try {
            return ResponseEntity.ok(agendamientoService.actualizarAgendamiento(id, agendamiento));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        try {
            agendamientoService.eliminarAgendamiento(id);
            return ResponseEntity.ok("Agendamiento eliminado correctamente");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
