package com.marroquineriabalta.service;

import com.marroquineriabalta.entity.Inventario;
import com.marroquineriabalta.entity.Producto;
import com.marroquineriabalta.entity.Categoria;
import com.marroquineriabalta.repository.InventarioRepository;
import com.marroquineriabalta.repository.ProductoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios para InventarioService
 * Prueba la funcionalidad de gestión de inventario de productos
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("InventarioService - Tests de gestión de inventario")
class InventarioServiceTest {

    @Mock
    private InventarioRepository inventarioRepository;

    @Mock
    private ProductoRepository productoRepository;

    @InjectMocks
    private InventarioService inventarioService;

    private Inventario inventarioTest;
    private Producto productoTest;
    private Categoria categoriaTest;

    @BeforeEach
    void setUp() {
        // Configurar categoría de prueba
        categoriaTest = new Categoria();
        categoriaTest.setIdCategoria(1L);
        categoriaTest.setNombre("Accesorios");

        // Configurar producto de prueba
        productoTest = new Producto();
        productoTest.setIdProducto(1L);
        productoTest.setNombre("Billetera Premium");
        productoTest.setDescripcion("Billetera de cuero genuino");
        productoTest.setPrecio(new BigDecimal("25000.00"));
        productoTest.setCategoria(categoriaTest);

        // Configurar inventario de prueba
        inventarioTest = new Inventario();
        inventarioTest.setIdInventario(1L);
        inventarioTest.setProducto(productoTest);
        inventarioTest.setCantidadProducto(10); // Stock inicial: 10 unidades
        inventarioTest.setCostoUnitario(new BigDecimal("15000.00"));
        inventarioTest.setFechaActualizacion(LocalDateTime.now());
    }

    @Test
    @DisplayName("Test 1: Ajustar cantidad - Aumentar stock correctamente")
    void testAjustarCantidad_AumentarStock_DeberiaIncrementarCantidad() {
        // Given - Aumentar en 5 unidades (10 + 5 = 15)
        Integer delta = 5;

        when(inventarioRepository.findByProductoIdProducto(1L))
                .thenReturn(Optional.of(inventarioTest));
        when(inventarioRepository.save(any(Inventario.class)))
                .thenAnswer(invocation -> {
                    Inventario inv = invocation.getArgument(0);
                    return inv;
                });

        // When
        Inventario resultado = inventarioService.ajustarCantidad(1L, delta);

        // Then
        assertNotNull(resultado, "El resultado no debería ser null");
        assertEquals(15, resultado.getCantidadProducto(), "La cantidad debería ser 15");

        verify(inventarioRepository, times(1)).findByProductoIdProducto(1L);
        verify(inventarioRepository, times(1)).save(any(Inventario.class));
    }

    @Test
    @DisplayName("Test 2: Ajustar cantidad - Disminuir stock correctamente")
    void testAjustarCantidad_DisminuirStock_DeberiaDecrementarCantidad() {
        // Given - Disminuir en 3 unidades (10 - 3 = 7)
        Integer delta = -3;

        when(inventarioRepository.findByProductoIdProducto(1L))
                .thenReturn(Optional.of(inventarioTest));
        when(inventarioRepository.save(any(Inventario.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // When
        Inventario resultado = inventarioService.ajustarCantidad(1L, delta);

        // Then
        assertNotNull(resultado, "El resultado no debería ser null");
        assertEquals(7, resultado.getCantidadProducto(), "La cantidad debería ser 7");
        assertEquals("Billetera Premium", resultado.getProducto().getNombre());

        verify(inventarioRepository, times(1)).findByProductoIdProducto(1L);
        verify(inventarioRepository, times(1)).save(any(Inventario.class));
    }

    @Test
    @DisplayName("Test 3: Obtener inventario por producto")
    void testObtenerInventarioPorProducto_DeberiaRetornarInventario() {
        // Given
        when(inventarioRepository.findByProductoIdProducto(1L))
                .thenReturn(Optional.of(inventarioTest));

        // When
        Optional<Inventario> resultado = inventarioService.obtenerInventarioPorProducto(1L);

        // Then
        assertTrue(resultado.isPresent(), "Debería encontrar el inventario");
        assertEquals(10, resultado.get().getCantidadProducto());
        assertEquals("Billetera Premium", resultado.get().getProducto().getNombre());

        verify(inventarioRepository, times(1)).findByProductoIdProducto(1L);
    }

    @Test
    @DisplayName("Test 4: Obtener productos con bajo stock")
    void testObtenerProductosBajoStock_DeberiaRetornarProductosConStockBajo() {
        // Given - Crear varios inventarios con diferentes niveles de stock
        Inventario inv1 = new Inventario();
        inv1.setIdInventario(1L);
        inv1.setCantidadProducto(5); // Bajo stock

        Inventario inv2 = new Inventario();
        inv2.setIdInventario(2L);
        inv2.setCantidadProducto(3); // Bajo stock

        Inventario inv3 = new Inventario();
        inv3.setIdInventario(3L);
        inv3.setCantidadProducto(8); // Bajo stock

        Integer stockMinimo = 10;

        when(inventarioRepository.findProductosBajoStock(stockMinimo))
                .thenReturn(Arrays.asList(inv1, inv2, inv3));

        // When
        List<Inventario> productosConBajoStock = inventarioService.obtenerProductosBajoStock(stockMinimo);

        // Then
        assertNotNull(productosConBajoStock, "La lista no debería ser null");
        assertEquals(3, productosConBajoStock.size(), "Deberían haber 3 productos con bajo stock");

        // Verificar que todos tienen stock menor al mínimo
        for (Inventario inv : productosConBajoStock) {
            assertTrue(inv.getCantidadProducto() < stockMinimo,
                    "Cada producto debería tener stock menor a " + stockMinimo);
        }

        verify(inventarioRepository, times(1)).findProductosBajoStock(stockMinimo);
    }

    @Test
    @DisplayName("Test 5: Registrar inventario - producto ya existe")
    void testRegistrarInventario_ProductoYaExiste_DeberiaLanzarExcepcion() {
        // Given
        Inventario nuevoInventario = new Inventario();
        nuevoInventario.setProducto(productoTest);
        nuevoInventario.setCantidadProducto(20);

        when(productoRepository.findById(1L)).thenReturn(Optional.of(productoTest));
        when(inventarioRepository.findByProductoIdProducto(1L))
                .thenReturn(Optional.of(inventarioTest));

        // When & Then
        Exception exception = assertThrows(RuntimeException.class, () -> {
            inventarioService.registrarInventario(nuevoInventario);
        });

        assertTrue(exception.getMessage().contains("Ya existe inventario para este producto"));
        verify(inventarioRepository, never()).save(any());
    }
}