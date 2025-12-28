package com.marroquineriabalta.service;

import com.marroquineriabalta.config.JwtUtil;
import com.marroquineriabalta.dto.LoginRequestDTO;
import com.marroquineriabalta.dto.LoginResponseDTO;
import com.marroquineriabalta.dto.RegistroRequestDTO;
import com.marroquineriabalta.entity.Usuario;
import com.marroquineriabalta.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios para AuthService
 * Prueba la funcionalidad de autenticación y registro
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService - Tests de autenticación")
class AuthServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @InjectMocks
    private AuthService authService;

    private RegistroRequestDTO registroDTO;
    private LoginRequestDTO loginDTO;
    private Usuario usuario;

    @BeforeEach
    void setUp() {
        // Configurar DTO de registro
        registroDTO = new RegistroRequestDTO();
        registroDTO.setRut("12345678-9");
        registroDTO.setNombre("Juan Pérez");
        registroDTO.setCorreoElectronico("juan@example.com");
        registroDTO.setPassword("password123");
        registroDTO.setRol("USUARIO");

        // Configurar DTO de login
        loginDTO = new LoginRequestDTO();
        loginDTO.setCorreoElectronico("juan@example.com");
        loginDTO.setPassword("password123");

        // Configurar usuario
        usuario = new Usuario();
        usuario.setRut("12345678-9");
        usuario.setNombre("Juan Pérez");
        usuario.setCorreoElectronico("juan@example.com");
        usuario.setUserPassword("$2a$10$hashedPassword");
        usuario.setRol("USUARIO");
    }

    @Test
    @DisplayName("Test 1: Registrar usuario correctamente")
    void testRegistrar_DeberiaCrearUsuario() {
        // Given
        when(usuarioRepository.existsByCorreoElectronico(anyString())).thenReturn(false);
        when(usuarioRepository.existsByRut(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$10$hashedPassword");
        when(usuarioRepository.save(any(Usuario.class))).thenReturn(usuario);

        // When
        LoginResponseDTO resultado = authService.registrar(registroDTO);

        // Then
        assertNotNull(resultado, "El resultado no debería ser null");
        assertEquals("12345678-9", resultado.getRut());
        assertEquals("Juan Pérez", resultado.getNombre());
        assertEquals("Usuario registrado exitosamente", resultado.getMensaje());

        verify(passwordEncoder, times(1)).encode("password123");
        verify(usuarioRepository, times(1)).save(any(Usuario.class));
    }

    @Test
    @DisplayName("Test 2: Error al registrar con RUT vacío")
    void testRegistrar_RutVacio_DeberiaLanzarExcepcion() {
        // Given
        registroDTO.setRut("");

        // When & Then
        Exception exception = assertThrows(RuntimeException.class, () -> {
            authService.registrar(registroDTO);
        });

        assertTrue(exception.getMessage().contains("El RUT es obligatorio"));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    @DisplayName("Test 3: Error al registrar con correo duplicado")
    void testRegistrar_CorreoDuplicado_DeberiaLanzarExcepcion() {
        // Given
        when(usuarioRepository.existsByCorreoElectronico("juan@example.com"))
                .thenReturn(true);

        // When & Then
        Exception exception = assertThrows(RuntimeException.class, () -> {
            authService.registrar(registroDTO);
        });

        assertTrue(exception.getMessage().contains("El correo electrónico ya está registrado"));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    @DisplayName("Test 4: Error al registrar con RUT duplicado")
    void testRegistrar_RutDuplicado_DeberiaLanzarExcepcion() {
        // Given
        when(usuarioRepository.existsByCorreoElectronico(anyString())).thenReturn(false);
        when(usuarioRepository.existsByRut("12345678-9")).thenReturn(true);

        // When & Then
        Exception exception = assertThrows(RuntimeException.class, () -> {
            authService.registrar(registroDTO);
        });

        assertTrue(exception.getMessage().contains("El RUT ya está registrado"));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    @DisplayName("Test 5: Error al registrar con contraseña corta")
    void testRegistrar_PasswordCorta_DeberiaLanzarExcepcion() {
        // Given
        registroDTO.setPassword("12345");
        when(usuarioRepository.existsByCorreoElectronico(anyString())).thenReturn(false);
        when(usuarioRepository.existsByRut(anyString())).thenReturn(false);

        // When & Then
        Exception exception = assertThrows(RuntimeException.class, () -> {
            authService.registrar(registroDTO);
        });

        assertTrue(exception.getMessage().contains("al menos 6 caracteres"));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    @DisplayName("Test 6: Iniciar sesión correctamente")
    void testIniciarSesion_DeberiaRetornarTokenYDatos() {
        // Given
        when(usuarioRepository.findByCorreoElectronico("juan@example.com"))
                .thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("password123", "$2a$10$hashedPassword"))
                .thenReturn(true);
        when(jwtUtil.generateToken(anyString(), anyString(), anyString()))
                .thenReturn("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...");

        // When
        LoginResponseDTO resultado = authService.iniciarSesion(loginDTO);

        // Then
        assertNotNull(resultado);
        assertEquals("12345678-9", resultado.getRut());
        assertEquals("Inicio de sesión exitoso", resultado.getMensaje());
        assertNotNull(resultado.getToken());

        verify(jwtUtil, times(1)).generateToken(anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("Test 7: Error al iniciar sesión con usuario inexistente")
    void testIniciarSesion_UsuarioNoExiste_DeberiaLanzarExcepcion() {
        // Given
        when(usuarioRepository.findByCorreoElectronico("juan@example.com"))
                .thenReturn(Optional.empty());

        // When & Then
        Exception exception = assertThrows(RuntimeException.class, () -> {
            authService.iniciarSesion(loginDTO);
        });

        assertTrue(exception.getMessage().contains("Credenciales incorrectas"));
        verify(jwtUtil, never()).generateToken(anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("Test 8: Error al iniciar sesión con contraseña incorrecta")
    void testIniciarSesion_PasswordIncorrecta_DeberiaLanzarExcepcion() {
        // Given
        when(usuarioRepository.findByCorreoElectronico("juan@example.com"))
                .thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("password123", "$2a$10$hashedPassword"))
                .thenReturn(false);

        // When & Then
        Exception exception = assertThrows(RuntimeException.class, () -> {
            authService.iniciarSesion(loginDTO);
        });

        assertTrue(exception.getMessage().contains("Credenciales incorrectas"));
        verify(jwtUtil, never()).generateToken(anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("Test 9: Verificar si existe correo")
    void testExisteCorreo_DeberiaRetornarBoolean() {
        // Given
        when(usuarioRepository.existsByCorreoElectronico("juan@example.com"))
                .thenReturn(true);

        // When
        boolean existe = authService.existeCorreo("juan@example.com");

        // Then
        assertTrue(existe);
        verify(usuarioRepository, times(1))
                .existsByCorreoElectronico("juan@example.com");
    }

    @Test
    @DisplayName("Test 10: Verificar si existe RUT")
    void testExisteRut_DeberiaRetornarBoolean() {
        // Given
        when(usuarioRepository.existsByRut("12345678-9")).thenReturn(true);

        // When
        boolean existe = authService.existeRut("12345678-9");

        // Then
        assertTrue(existe);
        verify(usuarioRepository, times(1)).existsByRut("12345678-9");
    }

    @Test
    @DisplayName("Test 11: Cambiar contraseña correctamente")
    void testCambiarPassword_DeberiaActualizarPassword() {
        // Given
        when(usuarioRepository.findById("12345678-9")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("password123", "$2a$10$hashedPassword"))
                .thenReturn(true);
        when(passwordEncoder.encode("newPassword123"))
                .thenReturn("$2a$10$newHashedPassword");
        when(usuarioRepository.save(any(Usuario.class))).thenReturn(usuario);

        // When
        boolean resultado = authService.cambiarPassword(
                "12345678-9", "password123", "newPassword123"
        );

        // Then
        assertTrue(resultado);
        verify(passwordEncoder, times(1)).encode("newPassword123");
        verify(usuarioRepository, times(1)).save(any(Usuario.class));
    }

    @Test
    @DisplayName("Test 12: Error al cambiar password con contraseña actual incorrecta")
    void testCambiarPassword_PasswordActualIncorrecta_DeberiaLanzarExcepcion() {
        // Given
        when(usuarioRepository.findById("12345678-9")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("wrongPassword", "$2a$10$hashedPassword"))
                .thenReturn(false);

        // When & Then
        Exception exception = assertThrows(RuntimeException.class, () -> {
            authService.cambiarPassword("12345678-9", "wrongPassword", "newPassword123");
        });

        assertTrue(exception.getMessage().contains("Contraseña actual incorrecta"));
        verify(usuarioRepository, never()).save(any());
    }
}