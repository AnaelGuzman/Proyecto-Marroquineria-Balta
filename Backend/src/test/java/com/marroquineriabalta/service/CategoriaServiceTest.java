package com.marroquineriabalta.service;

import com.marroquineriabalta.entity.Categoria;
import com.marroquineriabalta.repository.CategoriaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios para CategoriaService
 * Prueba la funcionalidad de gestión de categorías
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("CategoriaService - Tests de gestión de categorías")
class CategoriaServiceTest {

    @Mock
    private CategoriaRepository categoriaRepository;

    @InjectMocks
    private CategoriaService categoriaService;

    private Categoria categoria;

    @BeforeEach
    void setUp() {
        categoria = new Categoria();
        categoria.setIdCategoria(1L);
        categoria.setNombre("Accesorios");
        categoria.setDescripcion("Productos de cuero y accesorios");
    }

    @Test
    @DisplayName("Test 1: Crear categoría correctamente")
    void testCrearCategoria_DeberiaGuardarCorrectamente() {
        // Given
        when(categoriaRepository.save(any(Categoria.class))).thenReturn(categoria);

        // When
        Categoria resultado = categoriaService.crearCategoria(categoria);

        // Then
        assertNotNull(resultado, "La categoría no debería ser null");
        assertEquals("Accesorios", resultado.getNombre());
        assertEquals("Productos de cuero y accesorios", resultado.getDescripcion());

        verify(categoriaRepository, times(1)).save(any(Categoria.class));
    }

    @Test
    @DisplayName("Test 2: Actualizar categoría correctamente")
    void testActualizarCategoria_DeberiaModificarDatos() {
        // Given
        Categoria categoriaActualizada = new Categoria();
        categoriaActualizada.setNombre("Accesorios Premium");
        categoriaActualizada.setDescripcion("Productos de lujo");

        when(categoriaRepository.findById(1L)).thenReturn(Optional.of(categoria));
        when(categoriaRepository.save(any(Categoria.class))).thenReturn(categoria);

        // When
        Categoria resultado = categoriaService.actualizarCategoria(1L, categoriaActualizada);

        // Then
        assertNotNull(resultado);
        verify(categoriaRepository, times(1)).findById(1L);
        verify(categoriaRepository, times(1)).save(any(Categoria.class));
    }

    @Test
    @DisplayName("Test 3: Error al actualizar categoría inexistente")
    void testActualizarCategoria_NoExiste_DeberiaLanzarExcepcion() {
        // Given
        when(categoriaRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        Exception exception = assertThrows(RuntimeException.class, () -> {
            categoriaService.actualizarCategoria(999L, categoria);
        });

        assertTrue(exception.getMessage().contains("Categoría no encontrada"));
        verify(categoriaRepository, never()).save(any());
    }

    @Test
    @DisplayName("Test 4: Listar todas las categorías")
    void testListarCategorias_DeberiaRetornarLista() {
        // Given
        Categoria categoria2 = new Categoria();
        categoria2.setIdCategoria(2L);
        categoria2.setNombre("Calzado");

        when(categoriaRepository.findAll()).thenReturn(Arrays.asList(categoria, categoria2));

        // When
        List<Categoria> categorias = categoriaService.listarCategorias();

        // Then
        assertNotNull(categorias);
        assertEquals(2, categorias.size());
        verify(categoriaRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Test 5: Eliminar categoría")
    void testEliminarCategoria_DeberiaEliminarCorrectamente() {
        // Given
        when(categoriaRepository.existsById(1L)).thenReturn(true);

        // When
        categoriaService.eliminarCategoria(1L);

        // Then
        verify(categoriaRepository, times(1)).deleteById(1L);
    }

    @Test
    @DisplayName("Test 6: Error al eliminar categoría inexistente")
    void testEliminarCategoria_NoExiste_DeberiaLanzarExcepcion() {
        // Given
        when(categoriaRepository.existsById(999L)).thenReturn(false);

        // When & Then
        Exception exception = assertThrows(RuntimeException.class, () -> {
            categoriaService.eliminarCategoria(999L);
        });

        assertTrue(exception.getMessage().contains("Categoría no encontrada"));
        verify(categoriaRepository, never()).deleteById(any());
    }
}