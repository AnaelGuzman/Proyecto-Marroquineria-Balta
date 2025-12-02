package com.marroquineriabalta.service;

import com.marroquineriabalta.config.JwtUtil;
import com.marroquineriabalta.dto.LoginRequestDTO;
import com.marroquineriabalta.dto.LoginResponseDTO;
import com.marroquineriabalta.dto.RegistroRequestDTO;
import com.marroquineriabalta.entity.Usuario;
import com.marroquineriabalta.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
public class AuthService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    public LoginResponseDTO registrar(RegistroRequestDTO registro) {
        // Validaciones
        if (registro.getRut() == null || registro.getRut().isEmpty()) {
            throw new RuntimeException("El RUT es obligatorio");
        }

        if (usuarioRepository.existsByCorreoElectronico(registro.getCorreoElectronico())) {
            throw new RuntimeException("El correo electrónico ya está registrado");
        }

        if (usuarioRepository.existsByRut(registro.getRut())) {
            throw new RuntimeException("El RUT ya está registrado");
        }

        if (registro.getPassword().length() < 6) {
            throw new RuntimeException("La contraseña debe tener al menos 6 caracteres");
        }

        // Crear usuario
        Usuario usuario = new Usuario();
        usuario.setRut(registro.getRut());
        usuario.setNombre(registro.getNombre());
        usuario.setCorreoElectronico(registro.getCorreoElectronico());

        // ✅ ENCRIPTAR CONTRASEÑA
        String passwordEncriptada = passwordEncoder.encode(registro.getPassword());
        usuario.setUserPassword(passwordEncriptada);

        usuario.setRol(registro.getRol() != null ? registro.getRol() : "USUARIO");
        usuario.setFechaCreacion(LocalDateTime.now());

        Usuario usuarioGuardado = usuarioRepository.save(usuario);

        return new LoginResponseDTO(
                usuarioGuardado.getRut(),
                usuarioGuardado.getNombre(),
                usuarioGuardado.getCorreoElectronico(),
                usuarioGuardado.getRol(),
                "Usuario registrado exitosamente",
                null
        );
    }

    public LoginResponseDTO iniciarSesion(LoginRequestDTO login) {
        Usuario usuario = usuarioRepository.findByCorreoElectronico(login.getCorreoElectronico())
                .orElseThrow(() -> new RuntimeException("Credenciales incorrectas"));

        if (!passwordEncoder.matches(login.getPassword(), usuario.getUserPassword())) {
            throw new RuntimeException("Credenciales incorrectas");
        }

        // ✅ GENERAR TOKEN JWT
        String token = jwtUtil.generateToken(
                usuario.getRut(),
                usuario.getCorreoElectronico(),
                usuario.getRol()
        );

        return new LoginResponseDTO(
                usuario.getRut(),
                usuario.getNombre(),
                usuario.getCorreoElectronico(),
                usuario.getRol(),
                "Inicio de sesión exitoso",
                token  // ✅ INCLUIR TOKEN
        );
    }

    public boolean existeCorreo(String correo) {
        return usuarioRepository.existsByCorreoElectronico(correo);
    }

    public boolean existeRut(String rut) {
        return usuarioRepository.existsByRut(rut);
    }

    public boolean cambiarPassword(String rut, String passwordAntigua, String passwordNueva) {
        Usuario usuario = usuarioRepository.findById(rut)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // ✅ VERIFICAR CONTRASEÑA ANTIGUA
        if (!passwordEncoder.matches(passwordAntigua, usuario.getUserPassword())) {
            throw new RuntimeException("Contraseña actual incorrecta");
        }

        if (passwordNueva.length() < 6) {
            throw new RuntimeException("La nueva contraseña debe tener al menos 6 caracteres");
        }

        // ✅ ENCRIPTAR NUEVA CONTRASEÑA
        String passwordEncriptada = passwordEncoder.encode(passwordNueva);
        usuario.setUserPassword(passwordEncriptada);
        usuarioRepository.save(usuario);

        return true;
    }
}