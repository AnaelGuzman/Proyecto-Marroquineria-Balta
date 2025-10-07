package com.marroquineriabalta.service;

import com.marroquineriabalta.entity.Usuario;
import com.marroquineriabalta.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;

    @Transactional
    public Usuario crearUsuario(Usuario usuario) {
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

        usuario.setFechaCreacion(LocalDateTime.now());

        // IMPORTANTE: En producción, la contraseña debe ser encriptada con BCrypt
        // Por ahora la guardamos tal cual (NO RECOMENDADO para producción)

        return usuarioRepository.save(usuario);
    }

    @Transactional
    public Usuario actualizarUsuario(String rut, Usuario usuarioActualizado) {
        Usuario usuario = usuarioRepository.findById(rut)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        usuario.setNombre(usuarioActualizado.getNombre());
        usuario.setRol(usuarioActualizado.getRol());

        // Solo actualizar correo si cambió y no está duplicado
        if (!usuario.getCorreoElectronico().equals(usuarioActualizado.getCorreoElectronico())) {
            if (usuarioRepository.existsByCorreoElectronico(usuarioActualizado.getCorreoElectronico())) {
                throw new RuntimeException("Ya existe un usuario con ese correo electrónico");
            }
            usuario.setCorreoElectronico(usuarioActualizado.getCorreoElectronico());
        }

        // Solo actualizar contraseña si se proporciona una nueva
        if (usuarioActualizado.getUserPassword() != null && !usuarioActualizado.getUserPassword().isEmpty()) {
            usuario.setUserPassword(usuarioActualizado.getUserPassword());
        }

        return usuarioRepository.save(usuario);
    }

    @Transactional
    public void eliminarUsuario(String rut) {
        if (!usuarioRepository.existsById(rut)) {
            throw new RuntimeException("Usuario no encontrado");
        }
        usuarioRepository.deleteById(rut);
    }

    public List<Usuario> listarUsuarios() {
        return usuarioRepository.findAll();
    }

    public Optional<Usuario> obtenerUsuarioPorRut(String rut) {
        return usuarioRepository.findById(rut);
    }

    public Optional<Usuario> obtenerUsuarioPorCorreo(String correo) {
        return usuarioRepository.findByCorreoElectronico(correo);
    }

    public boolean existeCorreo(String correo) {
        return usuarioRepository.existsByCorreoElectronico(correo);
    }
}
