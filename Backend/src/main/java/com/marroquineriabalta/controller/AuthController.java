package com.marroquineriabalta.controller;

import com.marroquineriabalta.dto.LoginRequestDTO;
import com.marroquineriabalta.dto.LoginResponseDTO;
import com.marroquineriabalta.dto.RegistroRequestDTO;
import com.marroquineriabalta.entity.Usuario;
import com.marroquineriabalta.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * Registrar nuevo usuario
     * POST /api/auth/registro
     */
    @PostMapping("/registro")
    public ResponseEntity<?> registrar(@RequestBody RegistroRequestDTO request) {
        try {
            Usuario usuario = new Usuario();
            usuario.setRut(request.getRut());
            usuario.setNombre(request.getNombre());
            usuario.setCorreoElectronico(request.getCorreoElectronico());
            usuario.setRol(request.getRol() != null ? request.getRol() : "USUARIO");
            usuario.setUserPassword(request.getPassword());

            Usuario nuevoUsuario = authService.registrar(usuario);

            LoginResponseDTO response = new LoginResponseDTO(
                    nuevoUsuario.getRut(),
                    nuevoUsuario.getNombre(),
                    nuevoUsuario.getCorreoElectronico(),
                    nuevoUsuario.getRol(),
                    "Usuario registrado exitosamente"
            );

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    /**
     * Iniciar sesión
     * POST /api/auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO request) {
        try {
            Usuario usuario = authService.iniciarSesion(
                    request.getCorreoElectronico(),
                    request.getPassword()
            );

            LoginResponseDTO response = new LoginResponseDTO(
                    usuario.getRut(),
                    usuario.getNombre(),
                    usuario.getCorreoElectronico(),
                    usuario.getRol(),
                    "Inicio de sesión exitoso"
            );

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }

    /**
     * Verificar si un correo ya está registrado
     * GET /api/auth/verificar-correo?correo=ejemplo@mail.com
     */
    @GetMapping("/verificar-correo")
    public ResponseEntity<?> verificarCorreo(@RequestParam String correo) {
        boolean existe = authService.existeCorreo(correo);
        return ResponseEntity.ok(new VerificacionResponse("correo", existe));
    }

    /**
     * Verificar si un RUT ya está registrado
     * GET /api/auth/verificar-rut?rut=12345678-9
     */
    @GetMapping("/verificar-rut")
    public ResponseEntity<?> verificarRut(@RequestParam String rut) {
        boolean existe = authService.existeRut(rut);
        return ResponseEntity.ok(new VerificacionResponse("rut", existe));
    }

    /**
     * Cambiar contraseña
     * POST /api/auth/cambiar-password
     */
    @PostMapping("/cambiar-password")
    public ResponseEntity<?> cambiarPassword(@RequestBody CambioPasswordRequestDTO request) {
        try {
            authService.cambiarPassword(
                    request.getRut(),
                    request.getPasswordAntigua(),
                    request.getPasswordNueva()
            );
            return ResponseEntity.ok(new MensajeResponse("Contraseña actualizada exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    // Clases DTO internas para respuestas

    static class ErrorResponse {
        private String error;

        public ErrorResponse(String error) {
            this.error = error;
        }

        public String getError() {
            return error;
        }

        public void setError(String error) {
            this.error = error;
        }
    }

    static class VerificacionResponse {
        private String campo;
        private boolean existe;

        public VerificacionResponse(String campo, boolean existe) {
            this.campo = campo;
            this.existe = existe;
        }

        public String getCampo() {
            return campo;
        }

        public void setCampo(String campo) {
            this.campo = campo;
        }

        public boolean isExiste() {
            return existe;
        }

        public void setExiste(boolean existe) {
            this.existe = existe;
        }
    }

    static class MensajeResponse {
        private String mensaje;

        public MensajeResponse(String mensaje) {
            this.mensaje = mensaje;
        }

        public String getMensaje() {
            return mensaje;
        }

        public void setMensaje(String mensaje) {
            this.mensaje = mensaje;
        }
    }

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
