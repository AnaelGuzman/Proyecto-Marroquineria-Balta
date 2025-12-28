package com.marroquineriabalta.service;

import com.marroquineriabalta.entity.Gasto;
import com.marroquineriabalta.entity.MetodoPago;
import com.marroquineriabalta.repository.GastoRepository;
import com.marroquineriabalta.repository.MetodoPagoRepository;
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
 * Tests unitarios para GastoService
 * Prueba la funcionalidad de gestión de gastos
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("GastoService - Tests de gestión de gastos")
class GastoServiceTest {

    @Mock
    private GastoRepository gastoRepository;

    @Mock
    private MetodoPagoRepository metodoPagoRepository;

    @InjectMocks
    private GastoService gastoService;

    private Gasto gasto;
    private MetodoPago efectivo;

    @BeforeEach
    void setUp() {
        // Configurar método de pago
        efectivo = new MetodoPago();
        efectivo.setIdMetodoPago(1L);
        efectivo.setNombre("Efectivo");
        efectivo.setComisionAsociada(0.0);

        // Configurar gasto
        gasto = new Gasto();
        gasto.setIdGasto(1L);
        gasto.setMonto(new BigDecimal("50000.00"));
        gasto.setDescripcion("Arriendo local");
        gasto.setMetodoPago(efectivo);
        gasto.setFecha(LocalDateTime.now());
    }

    @Test
    @DisplayName("Test 1: Registrar gasto correctamente")
    void testRegistrarGasto_DeberiaGuardarCorrectamente() {
        // Given
        when(metodoPagoRepository.findById(1L)).thenReturn(Optional.of(efectivo));
        when(gastoRepository.save(any(Gasto.class))).thenReturn(gasto);

        // When
        Gasto resultado = gastoService.registrarGasto(gasto);

        // Then
        assertNotNull(resultado, "El gasto no debería ser null");
        assertEquals(new BigDecimal("50000.00"), resultado.getMonto());
        assertEquals("Arriendo local", resultado.getDescripcion());
        assertNotNull(resultado.getFecha());

        verify(gastoRepository, times(1)).save(any(Gasto.class));
    }

    @Test
    @DisplayName("Test 2: Registrar gasto sin método de pago")
    void testRegistrarGasto_SinMetodoPago_DeberiaGuardar() {
        // Given
        gasto.setMetodoPago(null);
        when(gastoRepository.save(any(Gasto.class))).thenReturn(gasto);

        // When
        Gasto resultado = gastoService.registrarGasto(gasto);

        // Then
        assertNotNull(resultado);
        assertNull(resultado.getMetodoPago());
        verify(gastoRepository, times(1)).save(any(Gasto.class));
    }

    @Test
    @DisplayName("Test 3: Actualizar gasto correctamente")
    void testActualizarGasto_DeberiaModificarDatos() {
        // Given
        Gasto actualizado = new Gasto();
        actualizado.setMonto(new BigDecimal("75000.00"));
        actualizado.setDescripcion("Arriendo local + servicios");
        actualizado.setMetodoPago(efectivo);

        when(gastoRepository.findById(1L)).thenReturn(Optional.of(gasto));
        when(metodoPagoRepository.findById(1L)).thenReturn(Optional.of(efectivo));
        when(gastoRepository.save(any(Gasto.class))).thenReturn(gasto);

        // When
        Gasto resultado = gastoService.actualizarGasto(1L, actualizado);

        // Then
        assertNotNull(resultado);
        verify(gastoRepository, times(1)).findById(1L);
        verify(gastoRepository, times(1)).save(any(Gasto.class));
    }

    @Test
    @DisplayName("Test 4: Error al actualizar gasto inexistente")
    void testActualizarGasto_NoExiste_DeberiaLanzarExcepcion() {
        // Given
        when(gastoRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        Exception exception = assertThrows(RuntimeException.class, () -> {
            gastoService.actualizarGasto(999L, gasto);
        });

        assertTrue(exception.getMessage().contains("Gasto no encontrado"));
        verify(gastoRepository, never()).save(any());
    }

    @Test
    @DisplayName("Test 5: Listar todos los gastos")
    void testListarGastos_DeberiaRetornarLista() {
        // Given
        Gasto gasto2 = new Gasto();
        gasto2.setIdGasto(2L);
        gasto2.setMonto(new BigDecimal("30000.00"));
        gasto2.setDescripcion("Electricidad");

        when(gastoRepository.findAll()).thenReturn(Arrays.asList(gasto, gasto2));

        // When
        List<Gasto> gastos = gastoService.listarGastos();

        // Then
        assertNotNull(gastos);
        assertEquals(2, gastos.size());
        verify(gastoRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Test 6: Obtener gasto por ID")
    void testObtenerGastoPorId_DeberiaRetornarGasto() {
        // Given
        when(gastoRepository.findById(1L)).thenReturn(Optional.of(gasto));

        // When
        Optional<Gasto> resultado = gastoService.obtenerGastoPorId(1L);

        // Then
        assertTrue(resultado.isPresent());
        assertEquals(1L, resultado.get().getIdGasto());
        verify(gastoRepository, times(1)).findById(1L);
    }

    @Test
    @DisplayName("Test 7: Eliminar gasto")
    void testEliminarGasto_DeberiaEliminarCorrectamente() {
        // Given
        when(gastoRepository.existsById(1L)).thenReturn(true);

        // When
        gastoService.eliminarGasto(1L);

        // Then
        verify(gastoRepository, times(1)).deleteById(1L);
    }

    @Test
    @DisplayName("Test 8: Error al eliminar gasto inexistente")
    void testEliminarGasto_NoExiste_DeberiaLanzarExcepcion() {
        // Given
        when(gastoRepository.existsById(999L)).thenReturn(false);

        // When & Then
        Exception exception = assertThrows(RuntimeException.class, () -> {
            gastoService.eliminarGasto(999L);
        });

        assertTrue(exception.getMessage().contains("Gasto no encontrado"));
        verify(gastoRepository, never()).deleteById(any());
    }

    @Test
    @DisplayName("Test 9: Obtener total de gastos por período")
    void testObtenerTotalGastosPorPeriodo_DeberiaCalcularTotal() {
        // Given
        LocalDateTime inicio = LocalDateTime.now().minusDays(30);
        LocalDateTime fin = LocalDateTime.now();
        BigDecimal totalEsperado = new BigDecimal("150000.00");

        when(gastoRepository.sumMontoByFechaBetween(inicio, fin))
                .thenReturn(totalEsperado);

        // When
        BigDecimal total = gastoService.obtenerTotalGastosPorPeriodo(inicio, fin);

        // Then
        assertNotNull(total);
        assertEquals(totalEsperado, total);
        verify(gastoRepository, times(1)).sumMontoByFechaBetween(inicio, fin);
    }

    @Test
    @DisplayName("Test 10: Total gastos retorna cero cuando no hay gastos")
    void testObtenerTotalGastosPorPeriodo_SinGastos_DeberiaRetornarCero() {
        // Given
        LocalDateTime inicio = LocalDateTime.now().minusDays(30);
        LocalDateTime fin = LocalDateTime.now();

        when(gastoRepository.sumMontoByFechaBetween(inicio, fin))
                .thenReturn(null);

        // When
        BigDecimal total = gastoService.obtenerTotalGastosPorPeriodo(inicio, fin);

        // Then
        assertNotNull(total);
        assertEquals(BigDecimal.ZERO, total);
        verify(gastoRepository, times(1)).sumMontoByFechaBetween(inicio, fin);
    }
}