package com.marroquineriabalta.service;

import com.marroquineriabalta.entity.Agendamiento;
import com.marroquineriabalta.entity.Producto;
import com.marroquineriabalta.repository.AgendamientoRepository;
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
 * Tests unitarios para AgendamientoService
 * Prueba la funcionalidad de gestión de agendamientos
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AgendamientoService - Tests de gestión de agendamientos")
class AgendamientoServiceTest {

    @Mock
    private AgendamientoRepository agendamientoRepository;

    @Mock
    private ProductoRepository productoRepository;

    @InjectMocks
    private AgendamientoService agendamientoService;

    private Agendamiento agendamiento;
    private Producto producto;

    @BeforeEach
    void setUp() {
        // Configurar producto
        producto = new Producto();
        producto.setIdProducto(1L);
        producto.setNombre("Billetera Premium");
        producto.setPrecio(new BigDecimal("25000.00"));

        // Configurar agendamiento
        agendamiento = new Agendamiento();
        agendamiento.setIdAgendamiento(1L);
        agendamiento.setTitulo("Pedido especial");
        agendamiento.setDescripcion("Billetera personalizada");
        agendamiento.setProducto(producto);
        agendamiento.setFechaSolicitud(LocalDateTime.now());
        agendamiento.setFechaProgramada(LocalDateTime.now().plusDays(7));
        agendamiento.setFechaEntrega(LocalDateTime.now().plusDays(14));
        agendamiento.setEstado("PENDIENTE");
    }

    @Test
    @DisplayName("Test 1: Crear agendamiento correctamente")
    void testCrearAgendamiento_DeberiaGuardarCorrectamente() {
        // Given
        when(productoRepository.findById(1L)).thenReturn(Optional.of(producto));
        when(agendamientoRepository.save(any(Agendamiento.class)))
                .thenReturn(agendamiento);

        // When
        Agendamiento resultado = agendamientoService.crearAgendamiento(agendamiento);

        // Then
        assertNotNull(resultado, "El agendamiento no debería ser null");
        assertEquals("PENDIENTE", resultado.getEstado());
        assertEquals("Pedido especial", resultado.getTitulo());

        verify(agendamientoRepository, times(1)).save(any(Agendamiento.class));
    }

    @Test
    @DisplayName("Test 2: Error al crear agendamiento sin fecha programada")
    void testCrearAgendamiento_SinFechaProgramada_DeberiaLanzarExcepcion() {
        // Given
        agendamiento.setFechaProgramada(null);
        when(productoRepository.findById(1L)).thenReturn(Optional.of(producto));

        // When & Then
        Exception exception = assertThrows(RuntimeException.class, () -> {
            agendamientoService.crearAgendamiento(agendamiento);
        });

        assertTrue(exception.getMessage().contains("Debe indicar la fecha programada"));
        verify(agendamientoRepository, never()).save(any());
    }

    @Test
    @DisplayName("Test 3: Error al crear agendamiento sin fecha de entrega")
    void testCrearAgendamiento_SinFechaEntrega_DeberiaLanzarExcepcion() {
        // Given
        agendamiento.setFechaEntrega(null);
        when(productoRepository.findById(1L)).thenReturn(Optional.of(producto));

        // When & Then
        Exception exception = assertThrows(RuntimeException.class, () -> {
            agendamientoService.crearAgendamiento(agendamiento);
        });

        assertTrue(exception.getMessage().contains("Debe indicar la fecha de entrega"));
        verify(agendamientoRepository, never()).save(any());
    }

    @Test
    @DisplayName("Test 4: Error cuando fecha entrega es anterior a fecha programada")
    void testCrearAgendamiento_FechaEntregaAnterior_DeberiaLanzarExcepcion() {
        // Given
        agendamiento.setFechaEntrega(LocalDateTime.now().plusDays(5));
        agendamiento.setFechaProgramada(LocalDateTime.now().plusDays(10));
        when(productoRepository.findById(1L)).thenReturn(Optional.of(producto));

        // When & Then
        Exception exception = assertThrows(RuntimeException.class, () -> {
            agendamientoService.crearAgendamiento(agendamiento);
        });

        assertTrue(exception.getMessage().contains("La fecha de entrega no puede ser anterior"));
        verify(agendamientoRepository, never()).save(any());
    }

    @Test
    @DisplayName("Test 5: Crear agendamiento con producto personalizado (sin ID)")
    void testCrearAgendamiento_ProductoPersonalizado_DeberiaGuardar() {
        // Given
        agendamiento.setProducto(null);
        agendamiento.setProductoNombre("Cartera personalizada XL");
        when(agendamientoRepository.save(any(Agendamiento.class)))
                .thenReturn(agendamiento);

        // When
        Agendamiento resultado = agendamientoService.crearAgendamiento(agendamiento);

        // Then
        assertNotNull(resultado);
        assertEquals("Cartera personalizada XL", resultado.getProductoNombre());
        verify(agendamientoRepository, times(1)).save(any(Agendamiento.class));
    }

    @Test
    @DisplayName("Test 6: Actualizar agendamiento correctamente")
    void testActualizarAgendamiento_DeberiaModificarDatos() {
        // Given
        Agendamiento actualizado = new Agendamiento();
        actualizado.setTitulo("Pedido urgente");
        actualizado.setEstado("EN_PROCESO");
        actualizado.setFechaProgramada(LocalDateTime.now().plusDays(3));
        actualizado.setFechaEntrega(LocalDateTime.now().plusDays(7));

        when(agendamientoRepository.findById(1L)).thenReturn(Optional.of(agendamiento));
        when(agendamientoRepository.save(any(Agendamiento.class)))
                .thenReturn(agendamiento);

        // When
        Agendamiento resultado = agendamientoService.actualizarAgendamiento(1L, actualizado);

        // Then
        assertNotNull(resultado);
        verify(agendamientoRepository, times(1)).findById(1L);
        verify(agendamientoRepository, times(1)).save(any(Agendamiento.class));
    }

    @Test
    @DisplayName("Test 7: Error al actualizar agendamiento inexistente")
    void testActualizarAgendamiento_NoExiste_DeberiaLanzarExcepcion() {
        // Given
        when(agendamientoRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        Exception exception = assertThrows(RuntimeException.class, () -> {
            agendamientoService.actualizarAgendamiento(999L, agendamiento);
        });

        assertTrue(exception.getMessage().contains("Agendamiento no encontrado"));
        verify(agendamientoRepository, never()).save(any());
    }

    @Test
    @DisplayName("Test 8: Listar todos los agendamientos")
    void testListarAgendamientos_DeberiaRetornarLista() {
        // Given
        when(agendamientoRepository.findAll()).thenReturn(Arrays.asList(agendamiento));

        // When
        List<Agendamiento> agendamientos = agendamientoService.listarAgendamientos();

        // Then
        assertNotNull(agendamientos);
        assertEquals(1, agendamientos.size());
        verify(agendamientoRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Test 9: Obtener agendamiento por ID")
    void testObtenerPorId_DeberiaRetornarAgendamiento() {
        // Given
        when(agendamientoRepository.findById(1L)).thenReturn(Optional.of(agendamiento));

        // When
        Agendamiento resultado = agendamientoService.obtenerPorId(1L);

        // Then
        assertNotNull(resultado);
        assertEquals(1L, resultado.getIdAgendamiento());
        verify(agendamientoRepository, times(1)).findById(1L);
    }

    @Test
    @DisplayName("Test 10: Eliminar agendamiento")
    void testEliminarAgendamiento_DeberiaEliminarCorrectamente() {
        // Given
        when(agendamientoRepository.existsById(1L)).thenReturn(true);

        // When
        agendamientoService.eliminarAgendamiento(1L);

        // Then
        verify(agendamientoRepository, times(1)).deleteById(1L);
    }

    @Test
    @DisplayName("Test 11: Error al eliminar agendamiento inexistente")
    void testEliminarAgendamiento_NoExiste_DeberiaLanzarExcepcion() {
        // Given
        when(agendamientoRepository.existsById(999L)).thenReturn(false);

        // When & Then
        Exception exception = assertThrows(RuntimeException.class, () -> {
            agendamientoService.eliminarAgendamiento(999L);
        });

        assertTrue(exception.getMessage().contains("Agendamiento no encontrado"));
        verify(agendamientoRepository, never()).deleteById(any());
    }
}
