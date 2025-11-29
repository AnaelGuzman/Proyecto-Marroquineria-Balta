package com.marroquineriabalta.service;

import com.marroquineriabalta.entity.*;
import com.marroquineriabalta.repository.CompraMaterialRepository;
import com.marroquineriabalta.repository.CompraRepository;
import com.marroquineriabalta.repository.MetodoPagoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CompraService {

    private final CompraRepository compraRepository;
    private final MetodoPagoRepository metodoPagoRepository;
    private final CompraMaterialRepository  compraMaterialRepository;
    private final InventarioMaterialService inventarioMaterialService;

    @Transactional
    public Compra registrarCompra(Compra compra) {
        if (compra.getMetodoPago() == null || compra.getMetodoPago().getIdMetodoPago() == null) {
            throw new RuntimeException("Debe especificar un método de pago");
        }

        MetodoPago metodoPago = metodoPagoRepository.findById(compra.getMetodoPago().getIdMetodoPago())
                .orElseThrow(() -> new RuntimeException("Método de pago no encontrado"));

        compra.setMetodoPago(metodoPago);
        compra.setFecha(LocalDateTime.now());

        List<DetalleCompra> detallesConCompra = new ArrayList<>();
        BigDecimal montoTotal = BigDecimal.ZERO;

        for (DetalleCompra detalle : compra.getDetalles()) {
            detalle.setCompra(compra);
            BigDecimal subtotal = detalle.getPrecioUnitario()
                    .multiply(BigDecimal.valueOf(detalle.getCantidad()));
            detalle.setSubtotal(subtotal);

            montoTotal = montoTotal.add(subtotal);
            detallesConCompra.add(detalle);
        }

        compra.setDetalles(detallesConCompra);
        compra.setMontoTotal(montoTotal);

        // Usar el tipo de documento que viene del frontend
        String tipoDocumento = compra.getTipoDocumento();
        if (tipoDocumento == null || tipoDocumento.trim().isEmpty()) {
            tipoDocumento = "sin-documento";
        }

        // Calcular IVA según tipo de documento
        BigDecimal ivaTotal;
        BigDecimal montoNeto;

        if ("factura".equals(tipoDocumento)) {
            // Con factura: IVA es recuperable
            // Monto neto = Total / 1.19
            montoNeto = montoTotal.divide(new BigDecimal("1.19"), 2, RoundingMode.HALF_UP);
            ivaTotal = montoTotal.subtract(montoNeto);
        } else {
            // Con boleta o sin documento: IVA NO es recuperable
            ivaTotal = BigDecimal.ZERO;
            montoNeto = montoTotal;
        }

        compra.setMontoNeto(montoNeto);
        compra.setIvaTotal(ivaTotal);

        return compraRepository.save(compra);
    }

    @Transactional
    public Compra actualizarCompra(Long id, Compra compraActualizada) {
        Compra compra = compraRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Compra no encontrada"));

        if (compraActualizada.getMetodoPago() != null && compraActualizada.getMetodoPago().getIdMetodoPago() != null) {
            MetodoPago metodoPago = metodoPagoRepository.findById(compraActualizada.getMetodoPago().getIdMetodoPago())
                    .orElseThrow(() -> new RuntimeException("Método de pago no encontrado"));
            compra.setMetodoPago(metodoPago);
        }

        compra.setObservaciones(compraActualizada.getObservaciones());

        return compraRepository.save(compra);
    }

    @Transactional
    public void eliminarCompra(Long id) {
        if (!compraRepository.existsById(id)) {
            throw new RuntimeException("Compra no encontrada");
        }
        compraRepository.deleteById(id);
    }

    public List<Compra> listarCompras() {
        return compraRepository.findAll();
    }

    public Optional<Compra> obtenerCompraPorId(Long id) {
        return compraRepository.findById(id);
    }

    public BigDecimal obtenerTotalComprasPorPeriodo(LocalDateTime inicio, LocalDateTime fin) {
        BigDecimal total = compraRepository.sumMontoTotalByFechaBetween(inicio, fin);
        return total != null ? total : BigDecimal.ZERO;
    }
    @Transactional
    public Compra registrarCompraMaterial(Compra compra, List<CompraMaterial> materiales) {
        if (compra.getMetodoPago() == null || compra.getMetodoPago().getIdMetodoPago() == null) {
            throw new RuntimeException("Debe especificar un método de pago");
        }

        MetodoPago metodoPago = metodoPagoRepository.findById(compra.getMetodoPago().getIdMetodoPago())
                .orElseThrow(() -> new RuntimeException("Método de pago no encontrado"));

        compra.setMetodoPago(metodoPago);
        compra.setFecha(LocalDateTime.now());

        // Calcular monto total
        BigDecimal montoTotal = materiales.stream()
                .map(m -> m.getPrecioUnitario().multiply(BigDecimal.valueOf(m.getCantidad())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        compra.setMontoTotal(montoTotal);

        // Para compras de materiales, el IVA no es recuperable generalmente
        compra.setMontoNeto(montoTotal);
        compra.setIvaTotal(BigDecimal.ZERO);
        compra.setTipoDocumento("compra-material");

        Compra compraGuardada = compraRepository.save(compra);

        // Guardar materiales de la compra
        for (CompraMaterial material : materiales) {
            material.setCompra(compraGuardada);
            material.setSubtotal(material.getPrecioUnitario().multiply(BigDecimal.valueOf(material.getCantidad())));
            compraMaterialRepository.save(material);

            // Registrar entrada en inventario de materiales
            inventarioMaterialService.registrarEntrada(
                    material.getMaterial().getIdMaterial(),
                    material.getCantidad(),
                    material.getPrecioUnitario(),
                    "Compra #" + compraGuardada.getIdCompra()
            );
        }

        return compraGuardada;
    }

    public List<CompraMaterial> obtenerMaterialesPorCompra(Long idCompra) {
        return compraMaterialRepository.findByCompraIdCompra(idCompra);
    }
    @Transactional
    public Compra registrarCompraMaterialDesdeRequest(Map<String, Object> request) {
        // Extraer compra y materiales del request
        Map<String, Object> compraMap = (Map<String, Object>) request.get("compra");
        List<Map<String, Object>> materialesMap = (List<Map<String, Object>>) request.get("materiales");

        // Crear objeto Compra
        Compra compra = new Compra();
        compra.setFecha(LocalDateTime.parse((String) compraMap.get("fecha")));
        compra.setObservaciones((String) compraMap.get("observaciones"));
        compra.setTipoDocumento("compra-material");

        // Configurar método de pago
        MetodoPago metodoPago = new MetodoPago();
        Map<String, Object> metodoPagoMap = (Map<String, Object>) compraMap.get("metodoPago");
        metodoPago.setIdMetodoPago(Long.valueOf(metodoPagoMap.get("idMetodoPago").toString()));
        compra.setMetodoPago(metodoPago);

        // Crear lista de CompraMaterial
        List<CompraMaterial> materiales = new ArrayList<>();
        for (Map<String, Object> materialMap : materialesMap) {
            CompraMaterial cm = new CompraMaterial();
            cm.setCantidad(Integer.valueOf(materialMap.get("cantidad").toString()));
            cm.setPrecioUnitario(new BigDecimal(materialMap.get("precioUnitario").toString()));

            Material material = new Material();
            Map<String, Object> materialObj = (Map<String, Object>) materialMap.get("material");
            material.setIdMaterial(Long.valueOf(materialObj.get("idMaterial").toString()));
            cm.setMaterial(material);

            materiales.add(cm);
        }

        return registrarCompraMaterial(compra, materiales);
    }

}