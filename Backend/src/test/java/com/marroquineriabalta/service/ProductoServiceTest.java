package com.marroquineriabalta.service;

import com.marroquineriabalta.entity.Producto;
import com.marroquineriabalta.entity.Categoria;
import com.marroquineriabalta.repository.ProductoRepository;
import com.marroquineriabalta.repository.CategoriaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios para ProductoService
 * Prueba la funcionalidad de gestión de productos
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ProductoService - Tests de gestión de productos")
class ProductoServiceTest {

    @Mock
    private ProductoRepository productoRepository;

    @Mock
    private CategoriaRepository categoriaRepository;

    @InjectMocks
    private ProductoService productoService;

    private Producto producto;
    private Categoria categoria;

    @BeforeEach
    void setUp() {
        // Configurar categoría
        categoria = new Categoria();
        categoria.setIdCategoria(1L);
        categoria.setNombre("Accesorios");
        categoria.setDescripcion("Productos de cuero");

        // Configurar producto
        producto = new Producto();
        producto.setIdProducto(1L);
        producto.setNombre("Billetera Premium");
        producto.setDescripcion("Billetera de cuero genuino");
        producto.setPrecio(new BigDecimal("25000.00"));
        producto.setCategoria(categoria);
    }

    @Test
    @DisplayName("Test 1: Crear producto correctamente")
    void testCrearProducto_DeberiaGuardarCorrectamente() {
        // Given
        when(categoriaRepository.findById(1L)).thenReturn(Optional.of(categoria));
        when(productoRepository.save(any(Producto.class))).thenReturn(producto);

        // When
        Producto resultado = productoService.crearProducto(producto);

        // Then
        assertNotNull(resultado, "El producto no debería ser null");
        assertEquals("Billetera Premium", resultado.getNombre());
        assertEquals(new BigDecimal("25000.00"), resultado.getPrecio());
        assertEquals("Accesorios", resultado.getCategoria().getNombre());

        verify(productoRepository, times(1)).save(any(Producto.class));
    }

    @Test
    @DisplayName("Test 2: Actualizar producto correctamente")
    void testActualizarProducto_DeberiaModificarDatos() {
        // Given
        Producto productoActualizado = new Producto();
        productoActualizado.setNombre("Billetera Gold");
        productoActualizado.setDescripcion("Edición limitada");
        productoActualizado.setPrecio(new BigDecimal("35000.00"));
        productoActualizado.setCategoria(categoria);

        when(productoRepository.findById(1L)).thenReturn(Optional.of(producto));
        when(categoriaRepository.findById(1L)).thenReturn(Optional.of(categoria));
        when(productoRepository.save(any(Producto.class))).thenReturn(producto);

        // When
        Producto resultado = productoService.actualizarProducto(1L, productoActualizado);

        // Then
        assertNotNull(resultado);
        verify(productoRepository, times(1)).findById(1L);
        verify(productoRepository, times(1)).save(any(Producto.class));
    }

    @Test
    @DisplayName("Test 3: Error al actualizar producto inexistente")
    void testActualizarProducto_NoExiste_DeberiaLanzarExcepcion() {
        // Given
        when(productoRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        Exception exception = assertThrows(RuntimeException.class, () -> {
            productoService.actualizarProducto(999L, producto);
        });

        assertTrue(exception.getMessage().contains("Producto no encontrado"));
        verify(productoRepository, never()).save(any());
    }

    @Test
    @DisplayName("Test 4: Listar todos los productos")
    void testListarProductos_DeberiaRetornarLista() {
        // Given
        Producto producto2 = new Producto();
        producto2.setIdProducto(2L);
        producto2.setNombre("Cinturón");
        producto2.setPrecio(new BigDecimal("15000.00"));

        when(productoRepository.findAll()).thenReturn(Arrays.asList(producto, producto2));

        // When
        List<Producto> productos = productoService.listarProductos();

        // Then
        assertNotNull(productos);
        assertEquals(2, productos.size());
        verify(productoRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Test 5: Buscar productos por nombre")
    void testBuscarPorNombre_DeberiaRetornarCoincidencias() {
        // Given
        when(productoRepository.buscarPorNombre("Billetera"))
                .thenReturn(Arrays.asList(producto));

        // When
        List<Producto> resultado = productoService.buscarPorNombre("Billetera");

        // Then
        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        assertEquals("Billetera Premium", resultado.get(0).getNombre());
        verify(productoRepository, times(1)).buscarPorNombre("Billetera");
    }

    @Test
    @DisplayName("Test 6: Eliminar producto")
    void testEliminarProducto_DeberiaEliminarCorrectamente() {
        // Given
        when(productoRepository.existsById(1L)).thenReturn(true);

        // When
        productoService.eliminarProducto(1L);

        // Then
        verify(productoRepository, times(1)).deleteById(1L);
    }

    @Test
    @DisplayName("Test 7: Error al eliminar producto inexistente")
    void testEliminarProducto_NoExiste_DeberiaLanzarExcepcion() {
        // Given
        when(productoRepository.existsById(999L)).thenReturn(false);

        // When & Then
        Exception exception = assertThrows(RuntimeException.class, () -> {
            productoService.eliminarProducto(999L);
        });

        assertTrue(exception.getMessage().contains("Producto no encontrado"));
        verify(productoRepository, never()).deleteById(any());
    }
}