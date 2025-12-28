package com.marroquineriabalta.service;

import com.marroquineriabalta.entity.InventarioMaterial;
import com.marroquineriabalta.entity.Material;
import com.marroquineriabalta.entity.UnidadMedida;
import com.marroquineriabalta.repository.InventarioMaterialRepository;
import com.marroquineriabalta.repository.MaterialRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios para InventarioMaterialService
 * Prueba la funcionalidad de gestión de inventario de materiales
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("InventarioMaterialService - Tests de gestión de inventario de materiales")
class InventarioMaterialServiceTest {

    @Mock
    private InventarioMaterialRepository inventarioMaterialRepository;

    @Mock
    private MaterialRepository materialRepository;

    @InjectMocks
    private InventarioMaterialService inventarioMaterialService;

    private Material material;
    private InventarioMaterial movimiento;

    @BeforeEach
    void setUp() {
        // Configurar unidad de medida
        UnidadMedida kg = new UnidadMedida();
        kg.setIdUnidadMedida(1L);
        kg.setNombre("Kilogramos");
        kg.setAbreviatura("kg");

        // Configurar material
        material = new Material();
        material.setIdMaterial(1L);
        material.setNombre("Cuero Genuino");
        material.setUnidadMedida(kg);
        material.setCostoPromedio(new BigDecimal("5000.00"));
        material.setStockMinimo(10);
        material.setActivo(true);

        // Configurar movimiento
        movimiento = new InventarioMaterial();
        movimiento.setIdInventarioMaterial(1L);
        movimiento.setMaterial(material);
        movimiento.setCantidad(50);
        movimiento.setCostoUnitario(new BigDecimal("5000.00"));
        movimiento.setTipoMovimiento("ENTRADA");
    }

    @Test
    @DisplayName("Test 1: Registrar entrada de material correctamente")
    void testRegistrarEntrada_DeberiaGuardarCorrectamente() {
        // Given
        when(materialRepository.findById(1L)).thenReturn(Optional.of(material));
        when(inventarioMaterialRepository.save(any(InventarioMaterial.class)))
                .thenReturn(movimiento);
        when(inventarioMaterialRepository.sumEntradasByMaterial(1L)).thenReturn(0);
        when(inventarioMaterialRepository.sumSalidasByMaterial(1L)).thenReturn(0);

        // When
        InventarioMaterial resultado = inventarioMaterialService.registrarEntrada(
                1L, 50, new BigDecimal("5000.00"), "Compra inicial"
        );

        // Then
        assertNotNull(resultado, "El movimiento no debería ser null");
        assertEquals("ENTRADA", resultado.getTipoMovimiento());
        assertEquals(50, resultado.getCantidad());

        verify(inventarioMaterialRepository, times(1)).save(any(InventarioMaterial.class));
        verify(materialRepository, times(1)).save(any(Material.class));
    }

    @Test
    @DisplayName("Test 2: Registrar salida de material correctamente")
    void testRegistrarSalida_ConStockSuficiente_DeberiaGuardar() {
        // Given
        when(materialRepository.findById(1L)).thenReturn(Optional.of(material));
        when(inventarioMaterialRepository.sumEntradasByMaterial(1L)).thenReturn(100);
        when(inventarioMaterialRepository.sumSalidasByMaterial(1L)).thenReturn(0);
        when(inventarioMaterialRepository.findFirstByMaterialIdMaterialOrderByFechaActualizacionDesc(1L))
                .thenReturn(Optional.of(movimiento));
        when(inventarioMaterialRepository.save(any(InventarioMaterial.class)))
                .thenReturn(movimiento);

        // When
        InventarioMaterial resultado = inventarioMaterialService.registrarSalida(
                1L, 20, "Producción"
        );

        // Then
        assertNotNull(resultado);
        verify(inventarioMaterialRepository, times(1)).save(any(InventarioMaterial.class));
    }

    @Test
    @DisplayName("Test 3: Error al registrar salida con stock insuficiente")
    void testRegistrarSalida_StockInsuficiente_DeberiaLanzarExcepcion() {
        // Given
        when(materialRepository.findById(1L)).thenReturn(Optional.of(material));
        when(inventarioMaterialRepository.sumEntradasByMaterial(1L)).thenReturn(10);
        when(inventarioMaterialRepository.sumSalidasByMaterial(1L)).thenReturn(0);

        // When & Then
        Exception exception = assertThrows(RuntimeException.class, () -> {
            inventarioMaterialService.registrarSalida(1L, 50, "Producción");
        });

        assertTrue(exception.getMessage().contains("Stock insuficiente"));
        verify(inventarioMaterialRepository, never()).save(any());
    }

    @Test
    @DisplayName("Test 4: Calcular stock actual correctamente")
    void testObtenerStockActual_DeberiaCalcularCorrectamente() {
        // Given
        when(inventarioMaterialRepository.sumEntradasByMaterial(1L)).thenReturn(100);
        when(inventarioMaterialRepository.sumSalidasByMaterial(1L)).thenReturn(30);

        // When
        Integer stockActual = inventarioMaterialService.obtenerStockActual(1L);

        // Then
        assertNotNull(stockActual);
        assertEquals(70, stockActual, "Stock actual debería ser 100 - 30 = 70");

        verify(inventarioMaterialRepository, times(1)).sumEntradasByMaterial(1L);
        verify(inventarioMaterialRepository, times(1)).sumSalidasByMaterial(1L);
    }

    @Test
    @DisplayName("Test 5: Obtener costo promedio de material")
    void testObtenerCostoPromedio_DeberiaRetornarUltimoCosto() {
        // Given
        when(inventarioMaterialRepository
                .findFirstByMaterialIdMaterialOrderByFechaActualizacionDesc(1L))
                .thenReturn(Optional.of(movimiento));

        // When
        BigDecimal costo = inventarioMaterialService.obtenerCostoPromedio(1L);

        // Then
        assertNotNull(costo);
        assertEquals(new BigDecimal("5000.00"), costo);
    }

    @Test
    @DisplayName("Test 6: Error al registrar entrada con material inexistente")
    void testRegistrarEntrada_MaterialNoExiste_DeberiaLanzarExcepcion() {
        // Given
        when(materialRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        Exception exception = assertThrows(RuntimeException.class, () -> {
            inventarioMaterialService.registrarEntrada(
                    999L, 10, new BigDecimal("1000.00"), "Test"
            );
        });

        assertTrue(exception.getMessage().contains("Material no encontrado"));
        verify(inventarioMaterialRepository, never()).save(any());
    }
}