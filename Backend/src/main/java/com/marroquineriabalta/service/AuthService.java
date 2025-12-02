package com.marroquineriabalta.service;

import com.marroquineriabalta.entity.Usuario;
import com.marroquineriabalta.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;

    /**
     * Registrar un nuevo usuario en el sistema
     */
    @Transactional
    public Usuario registrar(Usuario usuario) {
        // Validar que el RUT no esté vacío
        if (usuario.getRut() == null || usuario.getRut().trim().isEmpty()) {
            throw new RuntimeException("El RUT es obligatorio");
        }

        // Validar que el correo no esté duplicado
        if (usuarioRepository.existsByCorreoElectronico(usuario.getCorreoElectronico())) {
            throw new RuntimeException("Ya existe un usuario con ese correo electrónico");
        }

        // Validar que el RUT no esté duplicado
        if (usuarioRepository.existsById(usuario.getRut())) {
            throw new RuntimeException("Ya existe un usuario con ese RUT");
        }

        // Validar campos obligatorios
        if (usuario.getNombre() == null || usuario.getNombre().trim().isEmpty()) {
            throw new RuntimeException("El nombre es obligatorio");
        }

        if (usuario.getCorreoElectronico() == null || usuario.getCorreoElectronico().trim().isEmpty()) {
            throw new RuntimeException("El correo electrónico es obligatorio");
        }

        if (usuario.getUserPassword() == null || usuario.getUserPassword().trim().isEmpty()) {
            throw new RuntimeException("La contraseña es obligatoria");
        }

        // Validar longitud mínima de contraseña
        if (usuario.getUserPassword().length() < 6) {
            throw new RuntimeException("La contraseña debe tener al menos 6 caracteres");
        }

        // Asignar rol por defecto si no se proporciona
        if (usuario.getRol() == null || usuario.getRol().trim().isEmpty()) {
            usuario.setRol("USUARIO");
        }

        // Establecer fecha de creación
        usuario.setFechaCreacion(LocalDateTime.now());

        // IMPORTANTE: En producción, encriptar la contraseña con BCrypt
        // Por ahora la guardamos tal cual (NO RECOMENDADO para producción)

        return usuarioRepository.save(usuario);
    }

    /**
     * Iniciar sesión con correo y contraseña
     */
    public Usuario iniciarSesion(String correoElectronico, String password) {
        // Validar campos obligatorios
        if (correoElectronico == null || correoElectronico.trim().isEmpty()) {
            throw new RuntimeException("El correo electrónico es obligatorio");
        }

        if (password == null || password.trim().isEmpty()) {
            throw new RuntimeException("La contraseña es obligatoria");
        }

        // Buscar usuario por correo
        Optional<Usuario> usuarioOpt = usuarioRepository.findByCorreoElectronico(correoElectronico);

        if (!usuarioOpt.isPresent()) {
            throw new RuntimeException("Correo electrónico o contraseña incorrectos");
        }

        Usuario usuario = usuarioOpt.get();

        // Verificar contraseña
        // IMPORTANTE: En producción, usar BCrypt para comparar contraseñas encriptadas
        if (!usuario.getUserPassword().equals(password)) {
            throw new RuntimeException("Correo electrónico o contraseña incorrectos");
        }

        return usuario;
    }

    /**
     * Verificar si un correo electrónico ya está registrado
     */
    public boolean existeCorreo(String correoElectronico) {
        return usuarioRepository.existsByCorreoElectronico(correoElectronico);
    }

    /**
     * Verificar si un RUT ya está registrado
     */
    public boolean existeRut(String rut) {
        return usuarioRepository.existsById(rut);
    }

    /**
     * Obtener usuario por correo electrónico
     */
    public Optional<Usuario> obtenerUsuarioPorCorreo(String correoElectronico) {
        return usuarioRepository.findByCorreoElectronico(correoElectronico);
    }

    /**
     * Cambiar contraseña
     */
    @Transactional
    public void cambiarPassword(String rut, String passwordAntigua, String passwordNueva) {
        Usuario usuario = usuarioRepository.findById(rut)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // Verificar contraseña antigua
        if (!usuario.getUserPassword().equals(passwordAntigua)) {
            throw new RuntimeException("La contraseña actual es incorrecta");
        }

        // Validar nueva contraseña
        if (passwordNueva == null || passwordNueva.length() < 6) {
            throw new RuntimeException("La nueva contraseña debe tener al menos 6 caracteres");
        }

        // Actualizar contraseña
        usuario.setUserPassword(passwordNueva);
        usuarioRepository.save(usuario);
    }
}
