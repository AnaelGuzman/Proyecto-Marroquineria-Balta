package com.marroquineriabalta.service;

import com.marroquineriabalta.entity.UnidadMedida;
import com.marroquineriabalta.repository.UnidadMedidaRepository;
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
 * Tests unitarios para UnidadMedidaService
 * Prueba la funcionalidad de gestión de unidades de medida
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UnidadMedidaService - Tests de gestión de unidades de medida")
class UnidadMedidaServiceTest {

    @Mock
    private UnidadMedidaRepository unidadMedidaRepository;

    @InjectMocks
    private UnidadMedidaService unidadMedidaService;

    private UnidadMedida kilogramos;
    private UnidadMedida metros;

    @BeforeEach
    void setUp() {
        kilogramos = new UnidadMedida();
        kilogramos.setIdUnidadMedida(1L);
        kilogramos.setNombre("Kilogramos");
        kilogramos.setAbreviatura("kg");
        kilogramos.setActivo(true);

        metros = new UnidadMedida();
        metros.setIdUnidadMedida(2L);
        metros.setNombre("Metros");
        metros.setAbreviatura("m");
        metros.setActivo(true);
    }

    @Test
    @DisplayName("Test 1: Crear unidad de medida correctamente")
    void testCrearUnidadMedida_DeberiaGuardarCorrectamente() {
        // Given
        when(unidadMedidaRepository.findByNombreAndActivoTrue("Kilogramos"))
                .thenReturn(Optional.empty());
        when(unidadMedidaRepository.save(any(UnidadMedida.class))).thenReturn(kilogramos);

        // When
        UnidadMedida resultado = unidadMedidaService.crearUnidadMedida(kilogramos);

        // Then
        assertNotNull(resultado, "La unidad de medida no debería ser null");
        assertEquals("Kilogramos", resultado.getNombre());
        assertEquals("kg", resultado.getAbreviatura());
        assertTrue(resultado.getActivo());

        verify(unidadMedidaRepository, times(1)).save(any(UnidadMedida.class));
    }

    @Test
    @DisplayName("Test 2: Error al crear unidad con nombre duplicado")
    void testCrearUnidadMedida_NombreDuplicado_DeberiaLanzarExcepcion() {
        // Given
        when(unidadMedidaRepository.findByNombreAndActivoTrue("Kilogramos"))
                .thenReturn(Optional.of(kilogramos));

        // When & Then
        Exception exception = assertThrows(RuntimeException.class, () -> {
            unidadMedidaService.crearUnidadMedida(kilogramos);
        });

        assertTrue(exception.getMessage().contains("Ya existe una unidad de medida con el nombre"));
        verify(unidadMedidaRepository, never()).save(any());
    }

    @Test
    @DisplayName("Test 3: Actualizar unidad de medida correctamente")
    void testActualizarUnidadMedida_DeberiaModificarDatos() {
        // Given
        UnidadMedida actualizada = new UnidadMedida();
        actualizada.setNombre("Kilogramos");
        actualizada.setAbreviatura("KG");

        when(unidadMedidaRepository.findById(1L)).thenReturn(Optional.of(kilogramos));
        when(unidadMedidaRepository.save(any(UnidadMedida.class))).thenReturn(kilogramos);

        // When
        UnidadMedida resultado = unidadMedidaService.actualizarUnidadMedida(1L, actualizada);

        // Then
        assertNotNull(resultado);
        verify(unidadMedidaRepository, times(1)).findById(1L);
        verify(unidadMedidaRepository, times(1)).save(any(UnidadMedida.class));
    }

    @Test
    @DisplayName("Test 4: Error al actualizar unidad inexistente")
    void testActualizarUnidadMedida_NoExiste_DeberiaLanzarExcepcion() {
        // Given
        when(unidadMedidaRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        Exception exception = assertThrows(RuntimeException.class, () -> {
            unidadMedidaService.actualizarUnidadMedida(999L, kilogramos);
        });

        assertTrue(exception.getMessage().contains("Unidad de medida no encontrada"));
        verify(unidadMedidaRepository, never()).save(any());
    }

    @Test
    @DisplayName("Test 5: Listar unidades activas")
    void testListarUnidadesActivas_DeberiaRetornarSoloActivas() {
        // Given
        when(unidadMedidaRepository.findByActivoTrue())
                .thenReturn(Arrays.asList(kilogramos, metros));

        // When
        List<UnidadMedida> unidades = unidadMedidaService.listarUnidadesActivas();

        // Then
        assertNotNull(unidades);
        assertEquals(2, unidades.size());
        assertTrue(unidades.stream().allMatch(UnidadMedida::getActivo));

        verify(unidadMedidaRepository, times(1)).findByActivoTrue();
    }

    @Test
    @DisplayName("Test 6: Desactivar unidad de medida")
    void testDesactivarUnidadMedida_DeberiaEliminar() {
        // Given
        when(unidadMedidaRepository.findById(1L)).thenReturn(Optional.of(kilogramos));

        // When
        unidadMedidaService.desactivarUnidadMedida(1L);

        // Then
        verify(unidadMedidaRepository, times(1)).findById(1L);
        verify(unidadMedidaRepository, times(1)).delete(any(UnidadMedida.class));
    }
}