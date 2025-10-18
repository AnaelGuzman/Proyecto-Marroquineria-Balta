package com.marroquineriabalta.mapper;

import com.marroquineriabalta.dto.*;
import com.marroquineriabalta.entity.*;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class VentaMapper {

    public VentaDTO toDTO(Venta venta) {
        if (venta == null) {
            return null;
        }

        VentaDTO dto = new VentaDTO(
                venta.getIdVenta(),
                venta.getFecha(),
                venta.getMontoNeto(),
                venta.getIvaTotal(),
                venta.getComisionTotal(),
                venta.getMontoBruto(),
                venta.getObservaciones()
        );

        // Mapear métodos de pago
        if (venta.getMetodosPago() != null) {
            dto.setMetodosPago(venta.getMetodosPago().stream()
                    .map(this::toMetodoPagoVentaDTO)
                    .collect(Collectors.toList()));
        }

        // Mapear detalles
        if (venta.getDetalles() != null) {
            dto.setDetalles(venta.getDetalles().stream()
                    .map(this::toDetalleVentaDTO)
                    .collect(Collectors.toList()));
        }

        return dto;
    }

    private MetodoPagoVentaDTO toMetodoPagoVentaDTO(MetodoPagoVenta metodoPagoVenta) {
        if (metodoPagoVenta == null) {
            return null;
        }

        MetodoPagoDTO metodoPagoDTO = null;
        if (metodoPagoVenta.getMetodoPago() != null) {
            metodoPagoDTO = new MetodoPagoDTO(
                    metodoPagoVenta.getMetodoPago().getIdMetodoPago(),
                    metodoPagoVenta.getMetodoPago().getComisionAsociada(),
                    metodoPagoVenta.getMetodoPago().getNombre()
            );
        }

        return new MetodoPagoVentaDTO(
                metodoPagoVenta.getIdMetodoPagoVenta(),
                metodoPagoDTO,
                metodoPagoVenta.getMontoAsignado(),
                metodoPagoVenta.getComisionCalculada()
        );
    }

    private DetalleVentaDTO toDetalleVentaDTO(DetalleVenta detalleVenta) {
        if (detalleVenta == null) {
            return null;
        }

        ProductoDTO productoDTO = null;
        if (detalleVenta.getProducto() != null) {
            productoDTO = new ProductoDTO(
                    detalleVenta.getProducto().getIdProducto(),
                    detalleVenta.getProducto().getNombre(),
                    detalleVenta.getProducto().getPrecio()
            );

            // Mapear categoría si existe
            if (detalleVenta.getProducto().getCategoria() != null) {
                productoDTO.setCategoria(new CategoriaDTO(
                        detalleVenta.getProducto().getCategoria().getIdCategoria(),
                        detalleVenta.getProducto().getCategoria().getNombre(),
                        detalleVenta.getProducto().getCategoria().getDescripcion()
                ));
            }
        }

        return new DetalleVentaDTO(
                detalleVenta.getIdDetalleVenta(),
                productoDTO,
                detalleVenta.getCantidad(),
                detalleVenta.getPrecioUnitario(),
                detalleVenta.getSubtotal()
        );
    }

    // Método para lista
    public java.util.List<VentaDTO> toDTOList(java.util.List<Venta> ventas) {
        if (ventas == null) {
            return java.util.Collections.emptyList();
        }

        return ventas.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
}