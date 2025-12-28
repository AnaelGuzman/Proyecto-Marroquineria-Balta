package com.marroquineriabalta.service;

import com.marroquineriabalta.entity.*;
import com.marroquineriabalta.repository.MaterialProductoRepository;
import com.marroquineriabalta.repository.ProductoRepository;
import com.marroquineriabalta.repository.MaterialRepository;
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
 * Tests unitarios para MaterialProductoService
 * Prueba la funcionalidad de gestión de recetas de productos
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("MaterialProductoService - Tests de gestión de recetas")
class MaterialProductoServiceTest {

    @Mock
    private MaterialProductoRepository materialProductoRepository;

    @Mock
    private ProductoRepository productoRepository;

    @Mock
    private MaterialRepository materialRepository;

    @Mock
    private InventarioMaterialService inventarioMaterialService;

    @InjectMocks
    private MaterialProductoService materialProductoService;

    private Producto producto;
    private Material cuero;
    private Material hilo;
    private MaterialProducto materialProducto1;
    private MaterialProducto materialProducto2;

    @BeforeEach
    void setUp() {
        // Configurar producto de prueba
        producto = new Producto();
        producto.setIdProducto(1L);
        producto.setNombre("Billetera de Cuero");
        producto.setPrecio(new BigDecimal("25000.00"));

        // Configurar materiales de prueba
        cuero = new Material();
        cuero.setIdMaterial(1L);
        cuero.setNombre("Cuero Genuino");
        cuero.setCostoPromedio(new BigDecimal("5000.00"));
        cuero.setStockMinimo(5);
        cuero.setActivo(true);

        hilo = new Material();
        hilo.setIdMaterial(2L);
        hilo.setNombre("Hilo Encerado");
        hilo.setCostoPromedio(new BigDecimal("500.00"));
        hilo.setStockMinimo(10);
        hilo.setActivo(true);

        // Configurar receta (MaterialProducto)
        materialProducto1 = new MaterialProducto();
        materialProducto1.setIdMaterialProducto(1L);
        materialProducto1.setProducto(producto);
        materialProducto1.setMaterial(cuero);
        materialProducto1.setCantidad(new BigDecimal("2")); // 2 unidades de cuero
        materialProducto1.setCostoCalculado(new BigDecimal("10000.00")); // 2 * 5000

        materialProducto2 = new MaterialProducto();
        materialProducto2.setIdMaterialProducto(2L);
        materialProducto2.setProducto(producto);
        materialProducto2.setMaterial(hilo);
        materialProducto2.setCantidad(new BigDecimal("10")); // 10 unidades de hilo
        materialProducto2.setCostoCalculado(new BigDecimal("5000.00")); // 10 * 500
    }

    @Test
    @DisplayName("Test 1: Calcular costo de producto correctamente")
    void testCalcularCostoProducto_DeberiaRetornarCostoCorrecto() {
        // Given
        when(materialProductoRepository.findActivosByProducto(1L))
                .thenReturn(Arrays.asList(materialProducto1, materialProducto2));

        // When
        BigDecimal costoCalculado = materialProductoService.calcularCostoProducto(1L);

        // Then
        // Costo esperado = 10000 + 5000 = 15000
        assertNotNull(costoCalculado, "El costo no debería ser null");
        assertEquals(new BigDecimal("15000.00"), costoCalculado, "El costo debería ser 15000");

        verify(materialProductoRepository, times(1)).findActivosByProducto(1L);
    }

    @Test
    @DisplayName("Test 2: Obtener materiales de receta por producto")
    void testObtenerMaterialesPorProducto_DeberiaRetornarListaDeMateriales() {
        // Given
        when(materialProductoRepository.findActivosByProducto(1L))
                .thenReturn(Arrays.asList(materialProducto1, materialProducto2));

        // When
        List<MaterialProducto> receta = materialProductoService.obtenerMaterialesPorProducto(1L);

        // Then
        assertNotNull(receta, "La receta no debería ser null");
        assertEquals(2, receta.size(), "La receta debería tener 2 materiales");

        assertEquals("Cuero Genuino", receta.get(0).getMaterial().getNombre());
        assertEquals(new BigDecimal("2"), receta.get(0).getCantidad());

        assertEquals("Hilo Encerado", receta.get(1).getMaterial().getNombre());
        assertEquals(new BigDecimal("10"), receta.get(1).getCantidad());

        verify(materialProductoRepository, times(1)).findActivosByProducto(1L);
    }

    @Test
    @DisplayName("Test 3: Agregar material a producto exitosamente")
    void testAgregarMaterialAProducto_DeberiaGuardarCorrectamente() {
        // Given
        when(productoRepository.findById(1L)).thenReturn(Optional.of(producto));
        when(materialRepository.findById(1L)).thenReturn(Optional.of(cuero));
        when(inventarioMaterialService.obtenerCostoPromedio(1L))
                .thenReturn(new BigDecimal("5000.00"));
        when(materialProductoRepository.save(any(MaterialProducto.class)))
                .thenReturn(materialProducto1);

        // When
        MaterialProducto resultado = materialProductoService.agregarMaterialAProducto(materialProducto1);

        // Then
        assertNotNull(resultado, "El resultado no debería ser null");
        assertEquals(new BigDecimal("2"), resultado.getCantidad());
        assertEquals("Cuero Genuino", resultado.getMaterial().getNombre());

        verify(materialProductoRepository, times(1)).save(any(MaterialProducto.class));
    }

    @Test
    @DisplayName("Test 4: Error al agregar material sin producto")
    void testAgregarMaterialAProducto_SinProducto_DeberiaLanzarExcepcion() {
        // Given
        MaterialProducto mpSinProducto = new MaterialProducto();
        mpSinProducto.setMaterial(cuero);
        mpSinProducto.setCantidad(new BigDecimal("2"));

        // When & Then
        Exception exception = assertThrows(RuntimeException.class, () -> {
            materialProductoService.agregarMaterialAProducto(mpSinProducto);
        });

        assertTrue(exception.getMessage().contains("Debe especificar un producto"));
        verify(materialProductoRepository, never()).save(any());
    }

    @Test
    @DisplayName("Test 5: Eliminar material de producto")
    void testEliminarMaterialDeProducto_DeberiaEliminarCorrectamente() {
        // Given
        Long idMaterialProducto = 1L;
        when(materialProductoRepository.existsById(idMaterialProducto)).thenReturn(true);

        // When
        materialProductoService.eliminarMaterialDeProducto(idMaterialProducto);

        // Then
        verify(materialProductoRepository, times(1)).deleteById(idMaterialProducto);
    }
}