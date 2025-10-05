package com.marroquineriabalta;

import org.junit.jupiter.api.Test;
import com.marroquineriabalta.entity.*;
import com.marroquineriabalta.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class MarroquineriaApplicationTests {

    @Autowired
    private CategoriaService categoriaService;
    
    @Autowired
    private CompraService compraService;
    
    @Autowired
    private GastoService gastoService;
    
    @Autowired
    private InventarioService inventarioService;
    
    @Autowired
    private MetodoPagoService metodoPagoService;
    
    @Autowired
    private ProductoService productoService;
    
    @Autowired
    private VentaService ventaService;

    @Test
    void testCRUDCategoria() {
        // Create
        Categoria categoria = new Categoria();
        categoria.setNombre("Test Categoria");
        categoria.setDescripcion("Test Descripcion");
        Categoria savedCategoria = categoriaService.crearCategoria(categoria);
        assertNotNull(savedCategoria.getIdCategoria());

        // Read
        Categoria foundCategoria = categoriaService.obtenerCategoriaPorId(savedCategoria.getIdCategoria())
                .orElse(null);
        assertNotNull(foundCategoria);
        assertEquals("Test Categoria", foundCategoria.getNombre());

        // Update
        foundCategoria.setNombre("Updated Categoria");
        Categoria updatedCategoria = categoriaService.actualizarCategoria(foundCategoria.getIdCategoria(), foundCategoria);
        assertEquals("Updated Categoria", updatedCategoria.getNombre());

        // Delete
        categoriaService.eliminarCategoria(savedCategoria.getIdCategoria());
        assertTrue(categoriaService.obtenerCategoriaPorId(savedCategoria.getIdCategoria()).isEmpty());
    }
    @Test
    void testCRUDCompra() {
        // First create a MetodoPago
        MetodoPago metodoPago = new MetodoPago();
        metodoPago.setNombre("Test Método");
        metodoPago.setIvaAsociado(21);
        MetodoPago savedMetodoPago = metodoPagoService.crearMetodoPago(metodoPago);

        // Create Compra
        Compra compra = new Compra();
        compra.setMetodoPago(savedMetodoPago);
        compra.setObservaciones("Test Compra");
        compra.setDetalles(new ArrayList<>());
        Compra savedCompra = compraService.registrarCompra(compra);
        assertNotNull(savedCompra.getIdCompra());

        // Read
        Compra foundCompra = compraService.obtenerCompraPorId(savedCompra.getIdCompra())
                .orElse(null);
        assertNotNull(foundCompra);
        assertEquals("Test Compra", foundCompra.getObservaciones());

        // Update
        foundCompra.setObservaciones("Updated Compra");
        Compra updatedCompra = compraService.actualizarCompra(foundCompra.getIdCompra(), foundCompra);
        assertEquals("Updated Compra", updatedCompra.getObservaciones());

        // Delete
        compraService.eliminarCompra(savedCompra.getIdCompra());
        assertTrue(compraService.obtenerCompraPorId(savedCompra.getIdCompra()).isEmpty());
    }
    @Test
    void testCRUDGasto() {
        // First create a MetodoPago
        MetodoPago metodoPago = new MetodoPago();
        metodoPago.setNombre("Test Método");
        metodoPago.setIvaAsociado(21);
        MetodoPago savedMetodoPago = metodoPagoService.crearMetodoPago(metodoPago);

        // Create Gasto
        Gasto gasto = new Gasto();
        gasto.setDescripcion("Test Gasto");
        gasto.setMonto(new BigDecimal("100.00"));
        gasto.setMetodoPago(savedMetodoPago);
        Gasto savedGasto = gastoService.registrarGasto(gasto);
        assertNotNull(savedGasto.getIdGasto());

        // Read
        Gasto foundGasto = gastoService.obtenerGastoPorId(savedGasto.getIdGasto())
                .orElse(null);
        assertNotNull(foundGasto);
        assertEquals("Test Gasto", foundGasto.getDescripcion());

        // Update
        foundGasto.setDescripcion("Updated Gasto");
        Gasto updatedGasto = gastoService.actualizarGasto(foundGasto.getIdGasto(), foundGasto);
        assertEquals("Updated Gasto", updatedGasto.getDescripcion());

        // Delete
        gastoService.eliminarGasto(savedGasto.getIdGasto());
        assertTrue(gastoService.obtenerGastoPorId(savedGasto.getIdGasto()).isEmpty());
    }
    @Test
    void testCRUDInventario() {
        // First create a Categoria
        Categoria categoria = new Categoria();
        categoria.setNombre("Test Categoria");
        categoria.setDescripcion("Test Descripcion");
        Categoria savedCategoria = categoriaService.crearCategoria(categoria);
        // Then create a Producto
        Producto producto = new Producto();
        producto.setNombre("Test Producto");
        producto.setDescripcion("Test Descripcion");
        producto.setPrecio(new BigDecimal("100.00"));
        producto.setCategoria(savedCategoria);
        Producto savedProducto = productoService.crearProducto(producto);
        //Create
        Inventario inventario = new Inventario();
        inventario.setCantidadProducto(69);
        inventario.setCostoUnitario(new BigDecimal("100.00"));
        inventario.setProducto(savedProducto);
        inventario.setFechaActualizacion(LocalDateTime.now());
        Inventario savedInventario = inventarioService.registrarInventario(inventario);
        assertNotNull(savedInventario.getIdInventario());

        //Read
        Inventario foundInventario = inventarioService.obtenerInventarioPorId(savedInventario.getIdInventario())
                .orElse(null);
        assertNotNull(foundInventario);
        assertEquals(69, foundInventario.getCantidadProducto());

        //Update
        foundInventario.setCantidadProducto(100);
        Inventario updatedInventario = inventarioService.actualizarInventario(foundInventario.getIdInventario(), foundInventario);
        assertEquals(100, updatedInventario.getCantidadProducto());

        //Delete
        inventarioService.eliminarInventario(savedInventario.getIdInventario());
        assertTrue(inventarioService.obtenerInventarioPorId(savedInventario.getIdInventario()).isEmpty());

    }
    @Test
    void testCRUDMetodoPago() {
        // Create
        MetodoPago metodoPago = new MetodoPago();
        metodoPago.setNombre("Test Método");
        metodoPago.setIvaAsociado(21);
        MetodoPago savedMetodoPago = metodoPagoService.crearMetodoPago(metodoPago);
        assertNotNull(savedMetodoPago.getIdMetodoPago());

        // Read
        MetodoPago foundMetodoPago = metodoPagoService.obtenerMetodoPagoPorId(savedMetodoPago.getIdMetodoPago())
                .orElse(null);
        assertNotNull(foundMetodoPago);
        assertEquals("Test Método", foundMetodoPago.getNombre());

        // Update
        foundMetodoPago.setNombre("Updated Método");
        MetodoPago updatedMetodoPago = metodoPagoService.actualizarMetodoPago(foundMetodoPago.getIdMetodoPago(), foundMetodoPago);
        assertEquals("Updated Método", updatedMetodoPago.getNombre());

        // Delete
        metodoPagoService.eliminarMetodoPago(savedMetodoPago.getIdMetodoPago());
        assertTrue(metodoPagoService.obtenerMetodoPagoPorId(savedMetodoPago.getIdMetodoPago()).isEmpty());
    }
    @Test
    void testCRUDProducto(){
        //First create a Categoria
        Categoria categoria = new Categoria();
        categoria.setNombre("Test Categoria");
        categoria.setDescripcion("Test Descripcion");
        Categoria savedCategoria = categoriaService.crearCategoria(categoria);
        //Then create a Producto
        Producto producto = new Producto();
        producto.setNombre("Test Producto");
        producto.setDescripcion("Test Descripcion");
        producto.setPrecio(new BigDecimal("100.00"));
        producto.setCategoria(savedCategoria);
        Producto savedProducto = productoService.crearProducto(producto);
        assertNotNull(savedProducto.getIdProducto());

        //Read
        Producto foundProducto = productoService.obtenerProductoPorId(savedProducto.getIdProducto())
                .orElse(null);
        assertNotNull(foundProducto);
        assertEquals("Test Producto", foundProducto.getNombre());

        //Update
        foundProducto.setNombre("Updated Producto");
        Producto updatedProducto = productoService.actualizarProducto(foundProducto.getIdProducto(), foundProducto);
        assertEquals("Updated Producto", updatedProducto.getNombre());

        //Delete
        productoService.eliminarProducto(savedProducto.getIdProducto());
        assertTrue(productoService.obtenerProductoPorId(savedProducto.getIdProducto()).isEmpty());
    }
    @Test
    void testCRUDventa(){
        //First create a Categoria
        Categoria categoria = new Categoria();
        categoria.setNombre("Test Categoria");
        categoria.setDescripcion("Test Descripcion");
        Categoria savedCategoria = categoriaService.crearCategoria(categoria);
        //Then create a Producto
        Producto producto = new Producto();
        producto.setNombre("Test Producto");
        producto.setDescripcion("Test Descripcion");
        producto.setPrecio(new BigDecimal("100.00"));
        producto.setCategoria(savedCategoria);
        Producto savedProducto = productoService.crearProducto(producto);
        //Then create a MetodoPago
        MetodoPago metodoPago = new MetodoPago();
        metodoPago.setNombre("Test Método");
        metodoPago.setIvaAsociado(21);
        MetodoPago savedMetodoPago = metodoPagoService.crearMetodoPago(metodoPago);
        // Then create a DetalleVenta
        //NO SE PUEDE AUN, PORQUE VENTA Y DETALLEVENTA SE REFERENCIAN
        // DetalleVenta detalleVenta = new DetalleVenta();
        // detalleVenta.setCantidad(10);
        // detalleVenta.setPrecioUnitario(new BigDecimal("100.00"));
        // detalleVenta.setSubTotal(new BigDecimal("1000.00"));
        // detalleVenta.setProducto(savedProducto);
        // List<DetalleVenta> detalles = new ArrayList<>();

        //Then create a Venta
        Venta venta = new Venta();
        venta.setFecha(LocalDateTime.now());
        venta.setMontoTotal(new BigDecimal("300.00"));
        venta.setIvaTotal(new BigDecimal("0.21"));
        venta.setObservaciones("Observaciones venta");
        venta.setMetodoPago(savedMetodoPago);
        // Falta arreglar lo de arriba, por mientras esta vacia
        //venta.setDetalles(detalles);
        venta.setDetalles(new ArrayList<>());
        Venta savedVenta = ventaService.registrarVenta(venta);
        assertNotNull(savedVenta.getIdVenta());

        //Read
        Venta foundVenta = ventaService.obtenerVentaPorId(savedVenta.getIdVenta())
                .orElse(null);
        assertNotNull(foundVenta);
        assertEquals("Observaciones venta", foundVenta.getObservaciones());

        //Update
        foundVenta.setObservaciones("Updated Venta");
        //Falta metodo actualizarVenta
        //Venta updatedVenta = ventaService.actualizarVenta(foundVenta.getIdVenta(), foundVenta);
        //assertEquals("Updated Venta", updatedVenta.getObservaciones());

        //Delete
        ventaService.eliminarVenta(savedVenta.getIdVenta());
        assertTrue(ventaService.obtenerVentaPorId(savedVenta.getIdVenta()).isEmpty());
    }
}
