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
 * Tests unitarios para CompraService
 * Prueba la funcionalidad de gestión de compras
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("CompraService - Tests de gestión de compras")
class CompraServiceTest {

    @Mock
    private CompraRepository compraRepository;

    @Mock
    private MetodoPagoRepository metodoPagoRepository;

    @Mock
    private CompraMaterialRepository compraMaterialRepository;

    @Mock
    private InventarioMaterialService inventarioMaterialService;

    @InjectMocks
    private CompraService compraService;

    private Compra compra;
    private MetodoPago efectivo;
    private Material material;
    private CompraMaterial compraMaterial;

    @BeforeEach
    void setUp() {
        // Configurar método de pago
        efectivo = new MetodoPago();
        efectivo.setIdMetodoPago(1L);
        efectivo.setNombre("Efectivo");
        efectivo.setComisionAsociada(0.0);

        // Configurar material
        material = new Material();
        material.setIdMaterial(1L);
        material.setNombre("Cuero");

        // Configurar compra material
        compraMaterial = new CompraMaterial();
        compraMaterial.setMaterial(material);
        compraMaterial.setCantidad(10);
        compraMaterial.setPrecioUnitario(new BigDecimal("5000.00"));

        // Configurar compra
        compra = new Compra();
        compra.setIdCompra(1L);
        compra.setFecha(LocalDateTime.now());
        compra.setMetodoPago(efectivo);
        compra.setObservaciones("Compra de prueba");
        compra.setTipoDocumento("factura");
        compra.setDetalles(new ArrayList<>());
    }

    @Test
    @DisplayName("Test 1: Registrar compra correctamente")
    void testRegistrarCompra_DeberiaGuardarCorrectamente() {
        // Given
        DetalleCompra detalle = new DetalleCompra();
        detalle.setCantidad(5);
        detalle.setPrecioUnitario(new BigDecimal("10000.00"));
        compra.getDetalles().add(detalle);

        when(metodoPagoRepository.findById(1L)).thenReturn(Optional.of(efectivo));
        when(compraRepository.save(any(Compra.class))).thenReturn(compra);

        // When
        Compra resultado = compraService.registrarCompra(compra);

        // Then
        assertNotNull(resultado, "La compra no debería ser null");
        assertNotNull(resultado.getMontoTotal());
        verify(compraRepository, times(1)).save(any(Compra.class));
    }

    @Test
    @DisplayName("Test 2: Error al registrar compra sin método de pago")
    void testRegistrarCompra_SinMetodoPago_DeberiaLanzarExcepcion() {
        // Given
        compra.setMetodoPago(null);

        // When & Then
        Exception exception = assertThrows(RuntimeException.class, () -> {
            compraService.registrarCompra(compra);
        });

        assertTrue(exception.getMessage().contains("Debe especificar un método de pago"));
        verify(compraRepository, never()).save(any());
    }

    @Test
    @DisplayName("Test 3: Registrar compra de material")
    void testRegistrarCompraMaterial_DeberiaGuardarYActualizarInventario() {
        // Given
        List<CompraMaterial> materiales = Arrays.asList(compraMaterial);

        when(metodoPagoRepository.findById(1L)).thenReturn(Optional.of(efectivo));
        when(compraRepository.save(any(Compra.class))).thenReturn(compra);
        when(compraMaterialRepository.save(any(CompraMaterial.class)))
                .thenReturn(compraMaterial);

        // When
        Compra resultado = compraService.registrarCompraMaterial(compra, materiales);

        // Then
        assertNotNull(resultado);
        verify(compraRepository, times(1)).save(any(Compra.class));
        verify(compraMaterialRepository, times(1)).save(any(CompraMaterial.class));
        verify(inventarioMaterialService, times(1))
                .registrarEntrada(anyLong(), anyInt(), any(BigDecimal.class), anyString());
    }

    @Test
    @DisplayName("Test 4: Listar todas las compras")
    void testListarCompras_DeberiaRetornarLista() {
        // Given
        when(compraRepository.findAll()).thenReturn(Arrays.asList(compra));

        // When
        List<Compra> compras = compraService.listarCompras();

        // Then
        assertNotNull(compras);
        assertEquals(1, compras.size());
        verify(compraRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Test 5: Obtener compra por ID")
    void testObtenerCompraPorId_DeberiaRetornarCompra() {
        // Given
        when(compraRepository.findById(1L)).thenReturn(Optional.of(compra));

        // When
        Optional<Compra> resultado = compraService.obtenerCompraPorId(1L);

        // Then
        assertTrue(resultado.isPresent());
        assertEquals(1L, resultado.get().getIdCompra());
        verify(compraRepository, times(1)).findById(1L);
    }

    @Test
    @DisplayName("Test 6: Eliminar compra")
    void testEliminarCompra_DeberiaEliminarCorrectamente() {
        // Given
        when(compraRepository.existsById(1L)).thenReturn(true);

        // When
        compraService.eliminarCompra(1L);

        // Then
        verify(compraRepository, times(1)).deleteById(1L);
    }
}