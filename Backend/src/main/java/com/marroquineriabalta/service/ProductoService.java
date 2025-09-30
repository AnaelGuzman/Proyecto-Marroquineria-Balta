package com.marroquineriabalta.service;

import com.marroquineriabalta.entity.Categoria;
import com.marroquineriabalta.entity.Producto;
import com.marroquineriabalta.repository.CategoriaRepository;
import com.marroquineriabalta.repository.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProductoService {

    private final ProductoRepository productoRepository;
    private final CategoriaRepository categoriaRepository;

    @Transactional
    public Producto crearProducto(Producto producto) {
        if (producto.getCategoria() != null && producto.getCategoria().getIdCategoria() != null) {
            Categoria categoria = categoriaRepository.findById(producto.getCategoria().getIdCategoria())
                    .orElseThrow(() -> new RuntimeException("Categoría no encontrada"));
            producto.setCategoria(categoria);
        }
        return productoRepository.save(producto);
    }

    @Transactional
    public Producto actualizarProducto(Long id, Producto productoActualizado) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        producto.setNombre(productoActualizado.getNombre());
        producto.setDescripcion(productoActualizado.getDescripcion());
        producto.setPrecio(productoActualizado.getPrecio());

        if (productoActualizado.getCategoria() != null && productoActualizado.getCategoria().getIdCategoria() != null) {
            Categoria categoria = categoriaRepository.findById(productoActualizado.getCategoria().getIdCategoria())
                    .orElseThrow(() -> new RuntimeException("Categoría no encontrada"));
            producto.setCategoria(categoria);
        }

        return productoRepository.save(producto);
    }

    @Transactional
    public void eliminarProducto(Long id) {
        if (!productoRepository.existsById(id)) {
            throw new RuntimeException("Producto no encontrado");
        }
        productoRepository.deleteById(id);
    }

    public List<Producto> listarProductos() {
        return productoRepository.findAll();
    }

    public Optional<Producto> obtenerProductoPorId(Long id) {
        return productoRepository.findById(id);
    }

    public List<Producto> buscarPorNombre(String nombre) {
        return productoRepository.buscarPorNombre(nombre);
    }

    public List<Producto> obtenerProductosPorCategoria(Long idCategoria) {
        return productoRepository.findByCategoriaIdCategoria(idCategoria);
    }
}
