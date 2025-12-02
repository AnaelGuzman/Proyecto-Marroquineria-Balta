package com.marroquineriabalta.controller;

import com.marroquineriabalta.dto.LoginRequestDTO;
import com.marroquineriabalta.dto.LoginResponseDTO;
import com.marroquineriabalta.dto.RegistroRequestDTO;
import com.marroquineriabalta.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/registro")
    public ResponseEntity<?> registrar(@RequestBody RegistroRequestDTO request) {
        try {
            LoginResponseDTO response = authService.registrar(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO request) {
        try {
            LoginResponseDTO response = authService.iniciarSesion(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/verificar-correo")
    public ResponseEntity<?> verificarCorreo(@RequestParam String correo) {
        boolean existe = authService.existeCorreo(correo);
        return ResponseEntity.ok(Map.of("campo", "correo", "existe", existe));
    }

    @GetMapping("/verificar-rut")
    public ResponseEntity<?> verificarRut(@RequestParam String rut) {
        boolean existe = authService.existeRut(rut);
        return ResponseEntity.ok(Map.of("campo", "rut", "existe", existe));
    }

    @PostMapping("/cambiar-password")
    public ResponseEntity<?> cambiarPassword(@RequestBody CambioPasswordRequestDTO request) {
        try {
            authService.cambiarPassword(
                    request.getRut(),
                    request.getPasswordAntigua(),
                    request.getPasswordNueva()
            );
            return ResponseEntity.ok(Map.of("mensaje", "Contraseña actualizada exitosamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // DTO interno
    static class CambioPasswordRequestDTO {
        private String rut;
        private String passwordAntigua;
        private String passwordNueva;

        public String getRut() {
            return rut;
        }

        public void setRut(String rut) {
            this.rut = rut;
        }

        public String getPasswordAntigua() {
            return passwordAntigua;
        }

        public void setPasswordAntigua(String passwordAntigua) {
            this.passwordAntigua = passwordAntigua;
        }

        public String getPasswordNueva() {
            return passwordNueva;
        }

        public void setPasswordNueva(String passwordNueva) {
            this.passwordNueva = passwordNueva;
        }
    }
}