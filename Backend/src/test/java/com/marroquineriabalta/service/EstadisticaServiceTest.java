package com.marroquineriabalta.service;

import com.marroquineriabalta.entity.Estadistica;
import com.marroquineriabalta.repository.EstadisticaRepository;
import com.marroquineriabalta.repository.VentaRepository;
import com.marroquineriabalta.repository.CompraRepository;
import com.marroquineriabalta.repository.CompraMaterialRepository;
import com.marroquineriabalta.repository.GastoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios para EstadisticaService
 * Prueba la funcionalidad de gestión de estadísticas
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("EstadisticaService - Tests de gestión de estadísticas")
class EstadisticaServiceTest {

    @Mock
    private EstadisticaRepository estadisticaRepository;

    @Mock
    private VentaRepository ventaRepository;

    @Mock
    private CompraRepository compraRepository;

    @Mock
    private CompraMaterialRepository compraMaterialRepository;

    @Mock
    private GastoRepository gastoRepository;

    @InjectMocks
    private EstadisticaService estadisticaService;

    private Estadistica estadistica;

    @BeforeEach
    void setUp() {
        estadistica = new Estadistica();
        estadistica.setIdEstadistica(1L);
        estadistica.setFecha(LocalDate.now());
        estadistica.setTipo("INGRESO");
        estadistica.setTotal(new BigDecimal("100000.00"));
        estadistica.setDescripcion("Venta del día");
    }

    @Test
    @DisplayName("Test 1: Crear estadística correctamente")
    void testCrearEstadistica_DeberiaGuardarCorrectamente() {
        // Given
        when(estadisticaRepository.save(any(Estadistica.class))).thenReturn(estadistica);

        // When
        Estadistica resultado = estadisticaService.crearEstadistica(estadistica);

        // Then
        assertNotNull(resultado, "La estadística no debería ser null");
        assertEquals("INGRESO", resultado.getTipo());
        assertEquals(new BigDecimal("100000.00"), resultado.getTotal());

        verify(estadisticaRepository, times(1)).save(any(Estadistica.class));
    }

    @Test
    @DisplayName("Test 2: Crear estadística sin fecha asigna fecha actual")
    void testCrearEstadistica_SinFecha_DeberiaAsignarFechaActual() {
        // Given
        estadistica.setFecha(null);
        when(estadisticaRepository.save(any(Estadistica.class))).thenReturn(estadistica);

        // When
        Estadistica resultado = estadisticaService.crearEstadistica(estadistica);

        // Then
        assertNotNull(resultado);
        verify(estadisticaRepository, times(1)).save(any(Estadistica.class));
    }

    @Test
    @DisplayName("Test 3: Actualizar estadística correctamente")
    void testActualizarEstadistica_DeberiaModificarDatos() {
        // Given
        Estadistica actualizada = new Estadistica();
        actualizada.setFecha(LocalDate.now().plusDays(1));
        actualizada.setTipo("EGRESO");
        actualizada.setTotal(new BigDecimal("50000.00"));
        actualizada.setDescripcion("Compra actualizada");

        when(estadisticaRepository.findById(1L)).thenReturn(Optional.of(estadistica));
        when(estadisticaRepository.save(any(Estadistica.class))).thenReturn(estadistica);

        // When
        Estadistica resultado = estadisticaService.actualizarEstadistica(1L, actualizada);

        // Then
        assertNotNull(resultado);
        verify(estadisticaRepository, times(1)).findById(1L);
        verify(estadisticaRepository, times(1)).save(any(Estadistica.class));
    }

    @Test
    @DisplayName("Test 4: Error al actualizar estadística inexistente")
    void testActualizarEstadistica_NoExiste_DeberiaLanzarExcepcion() {
        // Given
        when(estadisticaRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        Exception exception = assertThrows(RuntimeException.class, () -> {
            estadisticaService.actualizarEstadistica(999L, estadistica);
        });

        assertTrue(exception.getMessage().contains("Estadística no encontrada"));
        verify(estadisticaRepository, never()).save(any());
    }

    @Test
    @DisplayName("Test 5: Listar todas las estadísticas")
    void testListarEstadisticas_DeberiaRetornarLista() {
        // Given
        Estadistica est2 = new Estadistica();
        est2.setIdEstadistica(2L);
        est2.setTipo("EGRESO");

        when(estadisticaRepository.findAll()).thenReturn(Arrays.asList(estadistica, est2));

        // When
        List<Estadistica> estadisticas = estadisticaService.listarEstadisticas();

        // Then
        assertNotNull(estadisticas);
        assertEquals(2, estadisticas.size());
        verify(estadisticaRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Test 6: Obtener estadísticas por tipo")
    void testObtenerPorTipo_DeberiaRetornarCoincidencias() {
        // Given
        when(estadisticaRepository.findByTipo("INGRESO"))
                .thenReturn(Arrays.asList(estadistica));

        // When
        List<Estadistica> resultado = estadisticaService.obtenerPorTipo("INGRESO");

        // Then
        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        assertEquals("INGRESO", resultado.get(0).getTipo());
        verify(estadisticaRepository, times(1)).findByTipo("INGRESO");
    }

    @Test
    @DisplayName("Test 7: Obtener estadísticas por rango de fechas")
    void testObtenerPorFechaBetween_DeberiaRetornarRango() {
        // Given
        LocalDate inicio = LocalDate.now().minusDays(7);
        LocalDate fin = LocalDate.now();

        when(estadisticaRepository.findByFechaBetween(inicio, fin))
                .thenReturn(Arrays.asList(estadistica));

        // When
        List<Estadistica> resultado = estadisticaService.obtenerPorFechaBetween(inicio, fin);

        // Then
        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        verify(estadisticaRepository, times(1)).findByFechaBetween(inicio, fin);
    }

    @Test
    @DisplayName("Test 8: Eliminar estadística")
    void testEliminarEstadistica_DeberiaEliminarCorrectamente() {
        // Given
        when(estadisticaRepository.existsById(1L)).thenReturn(true);

        // When
        estadisticaService.eliminarEstadistica(1L);

        // Then
        verify(estadisticaRepository, times(1)).deleteById(1L);
    }

    @Test
    @DisplayName("Test 9: Error al eliminar estadística inexistente")
    void testEliminarEstadistica_NoExiste_DeberiaLanzarExcepcion() {
        // Given
        when(estadisticaRepository.existsById(999L)).thenReturn(false);

        // When & Then
        Exception exception = assertThrows(RuntimeException.class, () -> {
            estadisticaService.eliminarEstadistica(999L);
        });

        assertTrue(exception.getMessage().contains("Estadística no encontrada"));
        verify(estadisticaRepository, never()).deleteById(any());
    }

    @Test
    @DisplayName("Test 10: Obtener estadística por ID")
    void testObtenerEstadisticaPorId_DeberiaRetornarEstadistica() {
        // Given
        when(estadisticaRepository.findById(1L)).thenReturn(Optional.of(estadistica));

        // When
        Optional<Estadistica> resultado = estadisticaService.obtenerEstadisticaPorId(1L);

        // Then
        assertTrue(resultado.isPresent());
        assertEquals(1L, resultado.get().getIdEstadistica());
        verify(estadisticaRepository, times(1)).findById(1L);
    }
}