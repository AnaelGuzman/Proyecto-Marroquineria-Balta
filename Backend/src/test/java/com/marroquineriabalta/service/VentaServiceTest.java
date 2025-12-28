package com.marroquineriabalta.service;

import com.marroquineriabalta.entity.*;
import com.marroquineriabalta.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios para VentaService
 * Prueba la funcionalidad de gestión de ventas
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("VentaService - Tests de gestión de ventas")
class VentaServiceTest {

    @Mock
    private VentaRepository ventaRepository;

    @Mock
    private MetodoPagoRepository metodoPagoRepository;

    @Mock
    private ProductoRepository productoRepository;

    @Mock
    private InventarioRepository inventarioRepository;

    @Mock
    private MetodoPagoVentaRepository metodoPagoVentaRepository;

    @InjectMocks
    private VentaService ventaService;

    private Venta venta;
    private Producto producto;
    private MetodoPago efectivo;
    private Inventario inventario;

    @BeforeEach
    void setUp() {
        // Configurar producto
        producto = new Producto();
        producto.setIdProducto(1L);
        producto.setNombre("Billetera");
        producto.setPrecio(new BigDecimal("25000.00"));

        // Configurar inventario
        inventario = new Inventario();
        inventario.setIdInventario(1L);
        inventario.setProducto(producto);
        inventario.setCantidadProducto(100);

        // Configurar método de pago
        efectivo = new MetodoPago();
        efectivo.setIdMetodoPago(1L);
        efectivo.setNombre("Efectivo");
        efectivo.setComisionAsociada(0.0);

        // Configurar detalle de venta
        DetalleVenta detalle = new DetalleVenta();
        detalle.setProducto(producto);
        detalle.setCantidad(2);
        detalle.setPrecioUnitario(new BigDecimal("25000.00"));

        // Configurar método de pago de venta
        MetodoPagoVenta metodoPagoVenta = new MetodoPagoVenta();
        metodoPagoVenta.setMetodoPago(efectivo);
        metodoPagoVenta.setMontoAsignado(new BigDecimal("50000.00"));

        // Configurar venta
        venta = new Venta();
        venta.setIdVenta(1L);
        venta.setFecha(LocalDateTime.now());
        venta.setDetalles(new ArrayList<>(Arrays.asList(detalle)));
        venta.setMetodosPago(new ArrayList<>(Arrays.asList(metodoPagoVenta)));
        venta.setObservaciones("Venta de prueba");
    }

    @Test
    @DisplayName("Test 1: Registrar venta correctamente")
    void testRegistrarVenta_DeberiaGuardarCorrectamente() {
        // Given
        when(metodoPagoRepository.findById(1L)).thenReturn(Optional.of(efectivo));
        when(productoRepository.findById(1L)).thenReturn(Optional.of(producto));
        when(inventarioRepository.findByProductoIdProducto(1L))
                .thenReturn(Optional.of(inventario));
        when(ventaRepository.save(any(Venta.class))).thenReturn(venta);

        // When
        Venta resultado = ventaService.registrarVenta(venta);

        // Then
        assertNotNull(resultado, "La venta no debería ser null");
        verify(ventaRepository, times(1)).save(any(Venta.class));
        verify(inventarioRepository, times(1)).save(any(Inventario.class));
    }

    @Test
    @DisplayName("Test 2: Error al registrar venta sin método de pago")
    void testRegistrarVenta_SinMetodoPago_DeberiaLanzarExcepcion() {
        // Given
        venta.setMetodosPago(new ArrayList<>());

        // When & Then
        Exception exception = assertThrows(RuntimeException.class, () -> {
            ventaService.registrarVenta(venta);
        });

        assertTrue(exception.getMessage().contains("Debe especificar al menos un método de pago"));
        verify(ventaRepository, never()).save(any());
    }

    @Test
    @DisplayName("Test 3: Error al registrar venta sin productos")
    void testRegistrarVenta_SinProductos_DeberiaLanzarExcepcion() {
        // Given
        venta.setDetalles(new ArrayList<>());

        // When & Then
        Exception exception = assertThrows(RuntimeException.class, () -> {
            ventaService.registrarVenta(venta);
        });

        assertTrue(exception.getMessage().contains("debe tener al menos un producto"));
        verify(ventaRepository, never()).save(any());
    }

    @Test
    @DisplayName("Test 4: Listar todas las ventas")
    void testListarVentas_DeberiaRetornarLista() {
        // Given
        when(ventaRepository.findAll()).thenReturn(Arrays.asList(venta));

        // When
        List<Venta> ventas = ventaService.listarVentas();

        // Then
        assertNotNull(ventas);
        assertEquals(1, ventas.size());
        verify(ventaRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Test 5: Obtener venta por ID")
    void testObtenerVentaPorId_DeberiaRetornarVenta() {
        // Given
        when(ventaRepository.findById(1L)).thenReturn(Optional.of(venta));

        // When
        Optional<Venta> resultado = ventaService.obtenerVentaPorId(1L);

        // Then
        assertTrue(resultado.isPresent());
        assertEquals(1L, resultado.get().getIdVenta());
        verify(ventaRepository, times(1)).findById(1L);
    }

    @Test
    @DisplayName("Test 6: Eliminar venta devuelve productos al inventario")
    void testEliminarVenta_DeberiaRestaurarInventario() {
        // Given
        when(ventaRepository.findById(1L)).thenReturn(Optional.of(venta));
        when(inventarioRepository.findByProductoIdProducto(1L))
                .thenReturn(Optional.of(inventario));

        // When
        ventaService.eliminarVenta(1L);

        // Then
        verify(inventarioRepository, times(1)).save(any(Inventario.class));
        verify(ventaRepository, times(1)).deleteById(1L);
    }
}