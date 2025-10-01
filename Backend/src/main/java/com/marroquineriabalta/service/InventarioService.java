package com.marroquineriabalta.service;

import com.marroquineriabalta.entity.Inventario;
import com.marroquineriabalta.entity.Producto;
import com.marroquineriabalta.repository.InventarioRepository;
import com.marroquineriabalta.repository.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class InventarioService {

    private final InventarioRepository inventarioRepository;
    private final ProductoRepository productoRepository;

    @Transactional
    public Inventario registrarInventario(Inventario inventario) {
        if (inventario.getProducto() == null || inventario.getProducto().getIdProducto() == null) {
            throw new RuntimeException("Debe especificar un producto");
        }

        Producto producto = productoRepository.findById(inventario.getProducto().getIdProducto())
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        Optional<Inventario> existente = inventarioRepository.findByProductoIdProducto(producto.getIdProducto());
        if (existente.isPresent()) {
            throw new RuntimeException("Ya existe inventario para este producto");
        }

        inventario.setProducto(producto);
        inventario.setFechaActualizacion(LocalDateTime.now());
        return inventarioRepository.save(inventario);
    }

    @Transactional
    public Inventario actualizarInventario(Long id, Inventario inventarioActualizado) {
        Inventario inventario = inventarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inventario no encontrado"));

        inventario.setCantidadProducto(inventarioActualizado.getCantidadProducto());
        inventario.setCostoUnitario(inventarioActualizado.getCostoUnitario());
        inventario.setFechaActualizacion(LocalDateTime.now());

        return inventarioRepository.save(inventario);
    }

    @Transactional
    public void eliminarInventario(Long id) {
        if (!inventarioRepository.existsById(id)) {
            throw new RuntimeException("Inventario no encontrado");
        }
        inventarioRepository.deleteById(id);
    }

    @Transactional
    public Inventario ajustarCantidad(Long idProducto, Integer cantidad) {
        Inventario inventario = inventarioRepository.findByProductoIdProducto(idProducto)
                .orElseThrow(() -> new RuntimeException("Inventario no encontrado para el producto"));

        inventario.setCantidadProducto(inventario.getCantidadProducto() + cantidad);
        inventario.setFechaActualizacion(LocalDateTime.now());

        return inventarioRepository.save(inventario);
    }

    public List<Inventario> listarInventario() {
        return inventarioRepository.findAll();
    }

    public Optional<Inventario> obtenerInventarioPorId(Long id) {
        return inventarioRepository.findById(id);
    }

    public Optional<Inventario> obtenerInventarioPorProducto(Long idProducto) {
        return inventarioRepository.findByProductoIdProducto(idProducto);
    }

    public List<Inventario> obtenerProductosBajoStock(Integer minimo) {
        return inventarioRepository.findProductosBajoStock(minimo);
    }
}
