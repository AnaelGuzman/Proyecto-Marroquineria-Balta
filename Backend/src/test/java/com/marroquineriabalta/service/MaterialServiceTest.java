package com.marroquineriabalta.service;

import com.marroquineriabalta.entity.Material;
import com.marroquineriabalta.entity.UnidadMedida;
import com.marroquineriabalta.repository.MaterialRepository;
import com.marroquineriabalta.repository.UnidadMedidaRepository;
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
 * Tests unitarios para MaterialService
 * Prueba la funcionalidad de gestión de materiales
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("MaterialService - Tests de gestión de materiales")
class MaterialServiceTest {

    @Mock
    private MaterialRepository materialRepository;

    @Mock
    private UnidadMedidaRepository unidadMedidaRepository;

    @Mock
    private InventarioMaterialService inventarioMaterialService;

    @InjectMocks
    private MaterialService materialService;

    private Material cuero;
    private UnidadMedida kilogramos;

    @BeforeEach
    void setUp() {
        // Configurar unidad de medida
        kilogramos = new UnidadMedida();
        kilogramos.setIdUnidadMedida(1L);
        kilogramos.setNombre("Kilogramos");
        kilogramos.setAbreviatura("kg");
        kilogramos.setActivo(true);

        // Configurar material
        cuero = new Material();
        cuero.setIdMaterial(1L);
        cuero.setNombre("Cuero Genuino");
        cuero.setDescripcion("Cuero de alta calidad");
        cuero.setUnidadMedida(kilogramos);
        cuero.setStockMinimo(10);
        cuero.setCostoPromedio(new BigDecimal("5000.00"));
        cuero.setActivo(true);
    }

    @Test
    @DisplayName("Test 1: Crear material correctamente")
    void testCrearMaterial_DeberiaGuardarCorrectamente() {
        // Given
        when(unidadMedidaRepository.findById(1L)).thenReturn(Optional.of(kilogramos));
        when(materialRepository.findByNombreAndActivoTrue("Cuero Genuino"))
                .thenReturn(Optional.empty());
        when(materialRepository.save(any(Material.class))).thenReturn(cuero);

        // When
        Material resultado = materialService.crearMaterial(cuero);

        // Then
        assertNotNull(resultado, "El material no debería ser null");
        assertEquals("Cuero Genuino", resultado.getNombre());
        assertEquals("kg", resultado.getUnidadMedida().getAbreviatura());

        verify(materialRepository, times(1)).save(any(Material.class));
    }

    @Test
    @DisplayName("Test 2: Error al crear material sin unidad de medida")
    void testCrearMaterial_SinUnidadMedida_DeberiaLanzarExcepcion() {
        // Given
        Material materialSinUnidad = new Material();
        materialSinUnidad.setNombre("Cuero");

        // When & Then
        Exception exception = assertThrows(RuntimeException.class, () -> {
            materialService.crearMaterial(materialSinUnidad);
        });

        assertTrue(exception.getMessage().contains("Debe especificar una unidad de medida"));
        verify(materialRepository, never()).save(any());
    }

    @Test
    @DisplayName("Test 3: Error al crear material con nombre duplicado")
    void testCrearMaterial_NombreDuplicado_DeberiaLanzarExcepcion() {
        // Given
        when(unidadMedidaRepository.findById(1L)).thenReturn(Optional.of(kilogramos));
        when(materialRepository.findByNombreAndActivoTrue("Cuero Genuino"))
                .thenReturn(Optional.of(cuero));

        // When & Then
        Exception exception = assertThrows(RuntimeException.class, () -> {
            materialService.crearMaterial(cuero);
        });

        assertTrue(exception.getMessage().contains("Ya existe un material con el nombre"));
        verify(materialRepository, never()).save(any());
    }

    @Test
    @DisplayName("Test 4: Listar materiales activos")
    void testListarMaterialesActivos_DeberiaRetornarListaActivos() {
        // Given
        Material hilo = new Material();
        hilo.setIdMaterial(2L);
        hilo.setNombre("Hilo");
        hilo.setActivo(true);

        when(materialRepository.findByActivoTrue())
                .thenReturn(Arrays.asList(cuero, hilo));

        // When
        List<Material> materiales = materialService.listarMaterialesActivos();

        // Then
        assertNotNull(materiales);
        assertEquals(2, materiales.size());
        assertTrue(materiales.stream().allMatch(Material::getActivo));

        verify(materialRepository, times(1)).findByActivoTrue();
    }

    @Test
    @DisplayName("Test 5: Desactivar material")
    void testDesactivarMaterial_DeberiaMarcarComoInactivo() {
        // Given
        when(materialRepository.findById(1L)).thenReturn(Optional.of(cuero));
        when(materialRepository.save(any(Material.class))).thenReturn(cuero);

        // When
        materialService.desactivarMaterial(1L);

        // Then
        verify(materialRepository, times(1)).findById(1L);
        verify(materialRepository, times(1)).save(any(Material.class));
    }

    @Test
    @DisplayName("Test 6: Obtener stock actual de material")
    void testObtenerStockActual_DeberiaRetornarStock() {
        // Given
        when(inventarioMaterialService.obtenerStockActual(1L)).thenReturn(50);

        // When
        Integer stock = materialService.obtenerStockActual(1L);

        // Then
        assertNotNull(stock);
        assertEquals(50, stock);
        verify(inventarioMaterialService, times(1)).obtenerStockActual(1L);
    }
}