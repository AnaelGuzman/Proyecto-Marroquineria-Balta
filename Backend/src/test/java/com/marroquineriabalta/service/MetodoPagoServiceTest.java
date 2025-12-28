package com.marroquineriabalta.service;

import com.marroquineriabalta.entity.MetodoPago;
import com.marroquineriabalta.entity.MetodoPagoVenta;
import com.marroquineriabalta.repository.MetodoPagoRepository;
import com.marroquineriabalta.repository.MetodoPagoVentaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios para MetodoPagoService
 * Prueba la funcionalidad de gestión de métodos de pago
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("MetodoPagoService - Tests de gestión de métodos de pago")
class MetodoPagoServiceTest {

    @Mock
    private MetodoPagoRepository metodoPagoRepository;

    @Mock
    private MetodoPagoVentaRepository metodoPagoVentaRepository;

    @InjectMocks
    private MetodoPagoService metodoPagoService;

    private MetodoPago efectivo;
    private MetodoPago tarjeta;

    @BeforeEach
    void setUp() {
        efectivo = new MetodoPago();
        efectivo.setIdMetodoPago(1L);
        efectivo.setNombre("Efectivo");
        efectivo.setComisionAsociada(0.0);

        tarjeta = new MetodoPago();
        tarjeta.setIdMetodoPago(2L);
        tarjeta.setNombre("Tarjeta de Crédito");
        tarjeta.setComisionAsociada(2.5);
    }

    @Test
    @DisplayName("Test 1: Crear método de pago correctamente")
    void testCrearMetodoPago_DeberiaGuardarCorrectamente() {
        // Given
        when(metodoPagoRepository.findAll()).thenReturn(new ArrayList<>());
        when(metodoPagoRepository.save(any(MetodoPago.class))).thenReturn(efectivo);

        // When
        MetodoPago resultado = metodoPagoService.crearMetodoPago(efectivo);

        // Then
        assertNotNull(resultado, "El método de pago no debería ser null");
        assertEquals("Efectivo", resultado.getNombre());
        assertEquals(0.0, resultado.getComisionAsociada());

        verify(metodoPagoRepository, times(1)).save(any(MetodoPago.class));
    }

    @Test
    @DisplayName("Test 2: Error al crear método con nombre duplicado")
    void testCrearMetodoPago_NombreDuplicado_DeberiaLanzarExcepcion() {
        // Given
        when(metodoPagoRepository.findAll()).thenReturn(Arrays.asList(efectivo));

        // When & Then
        Exception exception = assertThrows(RuntimeException.class, () -> {
            metodoPagoService.crearMetodoPago(efectivo);
        });

        assertTrue(exception.getMessage().contains("Ya existe un método de pago con el nombre"));
        verify(metodoPagoRepository, never()).save(any());
    }

    @Test
    @DisplayName("Test 3: Error al crear método con comisión negativa")
    void testCrearMetodoPago_ComisionNegativa_DeberiaLanzarExcepcion() {
        // Given
        efectivo.setComisionAsociada(-1.0);
        when(metodoPagoRepository.findAll()).thenReturn(new ArrayList<>());

        // When & Then
        Exception exception = assertThrows(RuntimeException.class, () -> {
            metodoPagoService.crearMetodoPago(efectivo);
        });

        assertTrue(exception.getMessage().contains("La comisión no puede ser negativa"));
        verify(metodoPagoRepository, never()).save(any());
    }

    @Test
    @DisplayName("Test 4: Actualizar método de pago correctamente")
    void testActualizarMetodoPago_DeberiaModificarDatos() {
        // Given
        MetodoPago actualizado = new MetodoPago();
        actualizado.setNombre("Efectivo USD");
        actualizado.setComisionAsociada(1.0);

        when(metodoPagoRepository.findById(1L)).thenReturn(Optional.of(efectivo));
        when(metodoPagoRepository.findAll()).thenReturn(Arrays.asList(efectivo));
        when(metodoPagoRepository.save(any(MetodoPago.class))).thenReturn(efectivo);

        // When
        MetodoPago resultado = metodoPagoService.actualizarMetodoPago(1L, actualizado);

        // Then
        assertNotNull(resultado);
        verify(metodoPagoRepository, times(1)).findById(1L);
        verify(metodoPagoRepository, times(1)).save(any(MetodoPago.class));
    }

    @Test
    @DisplayName("Test 5: Error al actualizar método inexistente")
    void testActualizarMetodoPago_NoExiste_DeberiaLanzarExcepcion() {
        // Given
        when(metodoPagoRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        Exception exception = assertThrows(RuntimeException.class, () -> {
            metodoPagoService.actualizarMetodoPago(999L, efectivo);
        });

        assertTrue(exception.getMessage().contains("Método de pago no encontrado"));
        verify(metodoPagoRepository, never()).save(any());
    }

    @Test
    @DisplayName("Test 6: Listar métodos de pago")
    void testListarMetodosPago_DeberiaRetornarLista() {
        // Given
        when(metodoPagoRepository.findAll()).thenReturn(Arrays.asList(efectivo, tarjeta));

        // When
        List<MetodoPago> metodos = metodoPagoService.listarMetodosPago();

        // Then
        assertNotNull(metodos);
        assertEquals(2, metodos.size());
        verify(metodoPagoRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Test 7: Eliminar método de pago sin uso")
    void testEliminarMetodoPago_SinUso_DeberiaEliminar() {
        // Given
        when(metodoPagoRepository.findById(1L)).thenReturn(Optional.of(efectivo));
        when(metodoPagoVentaRepository.findByMetodoPagoIdMetodoPago(1L))
                .thenReturn(new ArrayList<>());

        // When
        metodoPagoService.eliminarMetodoPago(1L);

        // Then
        verify(metodoPagoRepository, times(1)).deleteById(1L);
    }

    @Test
    @DisplayName("Test 8: Error al eliminar método de pago en uso")
    void testEliminarMetodoPago_EnUso_DeberiaLanzarExcepcion() {
        // Given
        MetodoPagoVenta uso = new MetodoPagoVenta();
        when(metodoPagoRepository.findById(1L)).thenReturn(Optional.of(efectivo));
        when(metodoPagoVentaRepository.findByMetodoPagoIdMetodoPago(1L))
                .thenReturn(Arrays.asList(uso));

        // When & Then
        Exception exception = assertThrows(RuntimeException.class, () -> {
            metodoPagoService.eliminarMetodoPago(1L);
        });

        assertTrue(exception.getMessage().contains("está siendo utilizado"));
        verify(metodoPagoRepository, never()).deleteById(any());
    }
}