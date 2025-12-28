package com.marroquineriabalta.service;

import com.marroquineriabalta.entity.Usuario;
import com.marroquineriabalta.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios para UsuarioService
 * Prueba la funcionalidad de gestión de usuarios
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UsuarioService - Tests de gestión de usuarios")
class UsuarioServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @InjectMocks
    private UsuarioService usuarioService;

    private Usuario usuario;

    @BeforeEach
    void setUp() {
        usuario = new Usuario();
        usuario.setRut("12345678-9");
        usuario.setNombre("Juan Pérez");
        usuario.setCorreoElectronico("juan@example.com");
        usuario.setUserPassword("password123");
        usuario.setRol("USUARIO");
        usuario.setFechaCreacion(LocalDateTime.now());
    }

    @Test
    @DisplayName("Test 1: Crear usuario correctamente")
    void testCrearUsuario_DeberiaGuardarCorrectamente() {
        // Given
        when(usuarioRepository.existsByCorreoElectronico("juan@example.com"))
                .thenReturn(false);
        when(usuarioRepository.existsById("12345678-9")).thenReturn(false);
        when(usuarioRepository.save(any(Usuario.class))).thenReturn(usuario);

        // When
        Usuario resultado = usuarioService.crearUsuario(usuario);

        // Then
        assertNotNull(resultado, "El usuario no debería ser null");
        assertEquals("12345678-9", resultado.getRut());
        assertEquals("Juan Pérez", resultado.getNombre());

        verify(usuarioRepository, times(1)).save(any(Usuario.class));
    }

    @Test
    @DisplayName("Test 2: Error al crear usuario sin RUT")
    void testCrearUsuario_SinRut_DeberiaLanzarExcepcion() {
        // Given
        usuario.setRut("");

        // When & Then
        Exception exception = assertThrows(RuntimeException.class, () -> {
            usuarioService.crearUsuario(usuario);
        });

        assertTrue(exception.getMessage().contains("El RUT es obligatorio"));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    @DisplayName("Test 3: Error al crear usuario con correo duplicado")
    void testCrearUsuario_CorreoDuplicado_DeberiaLanzarExcepcion() {
        // Given
        when(usuarioRepository.existsByCorreoElectronico("juan@example.com"))
                .thenReturn(true);

        // When & Then
        Exception exception = assertThrows(RuntimeException.class, () -> {
            usuarioService.crearUsuario(usuario);
        });

        // CAMBIO AQUÍ: El mensaje debe ser idéntico al del Service
        assertTrue(exception.getMessage().contains("Ya existe un usuario con ese correo electrónico"));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    @DisplayName("Test 4: Error al crear usuario con RUT duplicado")
    void testCrearUsuario_RutDuplicado_DeberiaLanzarExcepcion() {
        // Given
        when(usuarioRepository.existsByCorreoElectronico("juan@example.com"))
                .thenReturn(false);
        when(usuarioRepository.existsById("12345678-9")).thenReturn(true);

        // When & Then
        Exception exception = assertThrows(RuntimeException.class, () -> {
            usuarioService.crearUsuario(usuario);
        });

        // CAMBIO AQUÍ: El mensaje debe ser idéntico al del Service
        assertTrue(exception.getMessage().contains("Ya existe un usuario con ese RUT"));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    @DisplayName("Test 5: Actualizar usuario correctamente")
    void testActualizarUsuario_DeberiaModificarDatos() {
        // Given
        Usuario actualizado = new Usuario();
        actualizado.setNombre("Juan Carlos Pérez");
        actualizado.setCorreoElectronico("juan@example.com");
        actualizado.setRol("ADMIN");

        when(usuarioRepository.findById("12345678-9")).thenReturn(Optional.of(usuario));
        when(usuarioRepository.save(any(Usuario.class))).thenReturn(usuario);

        // When
        Usuario resultado = usuarioService.actualizarUsuario("12345678-9", actualizado);

        // Then
        assertNotNull(resultado);
        verify(usuarioRepository, times(1)).findById("12345678-9");
        verify(usuarioRepository, times(1)).save(any(Usuario.class));
    }

    @Test
    @DisplayName("Test 6: Error al actualizar usuario inexistente")
    void testActualizarUsuario_NoExiste_DeberiaLanzarExcepcion() {
        // Given
        when(usuarioRepository.findById("99999999-9")).thenReturn(Optional.empty());

        // When & Then
        Exception exception = assertThrows(RuntimeException.class, () -> {
            usuarioService.actualizarUsuario("99999999-9", usuario);
        });

        assertTrue(exception.getMessage().contains("Usuario no encontrado"));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    @DisplayName("Test 7: Listar usuarios")
    void testListarUsuarios_DeberiaRetornarLista() {
        // Given
        Usuario usuario2 = new Usuario();
        usuario2.setRut("98765432-1");
        usuario2.setNombre("María González");
        usuario2.setFechaCreacion(LocalDateTime.now());

        when(usuarioRepository.findAll()).thenReturn(Arrays.asList(usuario, usuario2));

        // When
        List<Usuario> usuarios = usuarioService.listarUsuarios();

        // Then
        assertNotNull(usuarios);
        assertEquals(2, usuarios.size());
        // Verificar que las contraseñas están ocultas
        usuarios.forEach(u -> assertNull(u.getUserPassword()));
        verify(usuarioRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Test 8: Eliminar usuario")
    void testEliminarUsuario_DeberiaEliminarCorrectamente() {
        // Given
        when(usuarioRepository.existsById("12345678-9")).thenReturn(true);

        // When
        usuarioService.eliminarUsuario("12345678-9");

        // Then
        verify(usuarioRepository, times(1)).deleteById("12345678-9");
    }

    @Test
    @DisplayName("Test 9: Error al eliminar usuario inexistente")
    void testEliminarUsuario_NoExiste_DeberiaLanzarExcepcion() {
        // Given
        when(usuarioRepository.existsById("99999999-9")).thenReturn(false);

        // When & Then
        Exception exception = assertThrows(RuntimeException.class, () -> {
            usuarioService.eliminarUsuario("99999999-9");
        });

        assertTrue(exception.getMessage().contains("Usuario no encontrado"));
        verify(usuarioRepository, never()).deleteById(any());
    }

    @Test
    @DisplayName("Test 10: Verificar si existe correo")
    void testExisteCorreo_DeberiaRetornarBoolean() {
        // Given
        when(usuarioRepository.existsByCorreoElectronico("juan@example.com"))
                .thenReturn(true);

        // When
        boolean existe = usuarioService.existeCorreo("juan@example.com");

        // Then
        assertTrue(existe);
        verify(usuarioRepository, times(1))
                .existsByCorreoElectronico("juan@example.com");
    }
}