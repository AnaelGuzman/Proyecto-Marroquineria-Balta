package com.marroquineriabalta.service;

import com.marroquineriabalta.entity.Estadistica;
import com.marroquineriabalta.repository.EstadisticaRepository;
import com.marroquineriabalta.repository.CompraMaterialRepository;
import com.marroquineriabalta.repository.CompraRepository;
import com.marroquineriabalta.repository.GastoRepository;
import com.marroquineriabalta.repository.VentaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.*;
import java.time.temporal.TemporalAdjusters;
import java.time.format.DateTimeFormatter;
import java.util.stream.Collectors;
import java.util.*;

@Service
@RequiredArgsConstructor
public class EstadisticaService {

    private final EstadisticaRepository estadisticaRepository;
    private final VentaRepository ventaRepository;
    private final CompraRepository compraRepository;
    private final CompraMaterialRepository compraMaterialRepository;
    private final GastoRepository gastoRepository;

    @Transactional
    public Estadistica crearEstadistica(Estadistica estadistica) {
        if (estadistica.getFecha() == null) {
            estadistica.setFecha(LocalDate.now());
        }
        return estadisticaRepository.save(estadistica);
    }

    @Transactional
    public Estadistica actualizarEstadistica(Long id, Estadistica estadisticaActualizada) {
        Estadistica estadistica = estadisticaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Estadística no encontrada"));

        estadistica.setFecha(estadisticaActualizada.getFecha());
        estadistica.setTipo(estadisticaActualizada.getTipo());
        estadistica.setTotal(estadisticaActualizada.getTotal());
        estadistica.setDescripcion(estadisticaActualizada.getDescripcion());

        return estadisticaRepository.save(estadistica);
    }

    @Transactional
    public void eliminarEstadistica(Long id) {
        if (!estadisticaRepository.existsById(id)) {
            throw new RuntimeException("Estadística no encontrada");
        }
        estadisticaRepository.deleteById(id);
    }

    public List<Estadistica> listarEstadisticas() {
        return estadisticaRepository.findAll();
    }

    public Optional<Estadistica> obtenerEstadisticaPorId(Long id) {
        return estadisticaRepository.findById(id);
    }

    public List<Estadistica> obtenerPorTipo(String tipo) {
        return estadisticaRepository.findByTipo(tipo);
    }

    public List<Estadistica> obtenerPorFechaBetween(LocalDate inicio, LocalDate fin) {
        return estadisticaRepository.findByFechaBetween(inicio, fin);
    }

     /**
     * Genera un reporte Excel por meses entre inicio..fin (inclusive).
     * Semanas: bloques LUNES..DOMINGO. Primera semana = 1ro..primer domingo.
     * Filtra opcionalmente por tipo ('ing'|'egr'|'all') y por categoría (busca texto en descripcion).
     */
    public byte[] generarReporteMensualPorPeriodo(LocalDate inicio, LocalDate fin, String tipoFiltro, String categoriaFiltro) {
        List<Estadistica> lista = estadisticaRepository.findByFechaBetween(inicio, fin);

        // aplicar filtros simples
        if (tipoFiltro != null && !"all".equalsIgnoreCase(tipoFiltro)) {
            String tf = tipoFiltro.toLowerCase();
            lista = lista.stream()
                    .filter(e -> e.getTipo() != null && e.getTipo().toLowerCase().contains(tf))
                    .collect(Collectors.toList());
        }
        if (categoriaFiltro != null && !"all".equalsIgnoreCase(categoriaFiltro)) {
            String cf = categoriaFiltro.toLowerCase();
            lista = lista.stream()
                    .filter(e -> e.getDescripcion() != null && e.getDescripcion().toLowerCase().contains(cf))
                    .collect(Collectors.toList());
        }

        YearMonth ymInicio = YearMonth.from(inicio);
        YearMonth ymFin = YearMonth.from(fin);
        LinkedHashMap<YearMonth, List<Estadistica>> mesesMap = new LinkedHashMap<>();
        YearMonth cur = ymInicio;
        while (!cur.isAfter(ymFin)) {
            YearMonth m = cur;
            YearMonth finalM = m;
            mesesMap.put(m, lista.stream()
                    .filter(e -> e.getFecha() != null && YearMonth.from(e.getFecha()).equals(finalM))
                    .collect(Collectors.toList()));
            cur = cur.plusMonths(1);
        }

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Reporte Mensual");
            int rowIdx = 0;

            for (Map.Entry<YearMonth, List<Estadistica>> entry : mesesMap.entrySet()) {
                YearMonth ym = entry.getKey();
                List<Estadistica> datos = entry.getValue();

                LocalDate first = ym.atDay(1);
                LocalDate last = ym.atEndOfMonth();

                // calcular inicios de semana dentro del mes (primera: 1ro, luego lunes siguientes)
                List<LocalDate> weekStarts = new ArrayList<>();
                weekStarts.add(first);
                LocalDate firstSunday = first.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));
                LocalDate nextStart = firstSunday.plusDays(1); // lunes siguiente
                while (!nextStart.isAfter(last)) {
                    weekStarts.add(nextStart);
                    LocalDate thisSunday = nextStart.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));
                    nextStart = thisSunday.plusDays(1);
                }
                int weeks = weekStarts.size();

                // Header del mes
                Row header = sheet.createRow(rowIdx++);
                header.createCell(0).setCellValue(ym.toString());
                for (int w = 0; w < weeks; w++) header.createCell(1 + w).setCellValue("Semana " + (w + 1));
                header.createCell(1 + weeks).setCellValue("Total");

                // acumuladores
                BigDecimal[] ventasPorSemana = new BigDecimal[weeks];
                BigDecimal[] comprasPorSemana = new BigDecimal[weeks];
                Arrays.fill(ventasPorSemana, BigDecimal.ZERO);
                Arrays.fill(comprasPorSemana, BigDecimal.ZERO);

                for (Estadistica e : datos) {
                    if (e.getFecha() == null) continue;
                    LocalDate d = e.getFecha();

                    int idx = 0;
                    for (int i = 0; i < weekStarts.size(); i++) {
                        LocalDate s = weekStarts.get(i);
                        LocalDate end = (i + 1 < weekStarts.size()) ? weekStarts.get(i + 1).minusDays(1) : last;
                        if ((!d.isBefore(s)) && (!d.isAfter(end))) {
                            idx = i;
                            break;
                        }
                    }

                    BigDecimal total = e.getTotal() != null ? e.getTotal() : BigDecimal.ZERO;
                    String tipo = e.getTipo() != null ? e.getTipo().toLowerCase() : "";

                    if (tipo.contains("ing") || tipo.contains("venta")) {
                        ventasPorSemana[idx] = ventasPorSemana[idx].add(total);
                    } else if (tipo.contains("egr") || tipo.contains("compra") || tipo.contains("gasto")) {
                        comprasPorSemana[idx] = comprasPorSemana[idx].add(total);
                    } else {
                        // fallback por signo
                        if (total.signum() >= 0) ventasPorSemana[idx] = ventasPorSemana[idx].add(total);
                        else comprasPorSemana[idx] = comprasPorSemana[idx].add(total.abs());
                    }
                }

                // Fila Ventas
                Row rv = sheet.createRow(rowIdx++);
                rv.createCell(0).setCellValue("Ventas");
                BigDecimal totalV = BigDecimal.ZERO;
                for (int i = 0; i < weeks; i++) {
                    rv.createCell(1 + i).setCellValue(ventasPorSemana[i].doubleValue());
                    totalV = totalV.add(ventasPorSemana[i]);
                }
                rv.createCell(1 + weeks).setCellValue(totalV.doubleValue());

                // Fila Compras
                Row rc = sheet.createRow(rowIdx++);
                rc.createCell(0).setCellValue("Compras");
                BigDecimal totalC = BigDecimal.ZERO;
                for (int i = 0; i < weeks; i++) {
                    rc.createCell(1 + i).setCellValue(comprasPorSemana[i].doubleValue());
                    totalC = totalC.add(comprasPorSemana[i]);
                }
                rc.createCell(1 + weeks).setCellValue(totalC.doubleValue());

                // Fila Ganancia
                Row rg = sheet.createRow(rowIdx++);
                rg.createCell(0).setCellValue("Ganancia (Ventas - Compras)");
                for (int i = 0; i < weeks; i++) {
                    rg.createCell(1 + i).setCellValue(ventasPorSemana[i].subtract(comprasPorSemana[i]).doubleValue());
                }
                rg.createCell(1 + weeks).setCellValue(totalV.subtract(totalC).doubleValue());

                // espacio
                rowIdx++;
            }

            // autosize (hasta 20 columnas)
            for (int c = 0; c < 20; c++) sheet.autoSizeColumn(c);

            workbook.write(baos);
            return baos.toByteArray();
        } catch (IOException ex) {
            throw new RuntimeException("Error al generar reporte Excel: " + ex.getMessage(), ex);
        }
    }


    /**
     * Genera un .xlsx con una hoja por mes entre inicio..fin (LocalDate).
     * En cada hoja:
     *  - Tabla Ventas: fecha/hora, metodoPago, montoNeto, comisionTotal, ivaTotal, montoBruto (orden ascendente). Totales al final.
     *  - Tabla Compras/CompraMaterial/Gastos: tipo, fecha/hora, metodoPago, monto_neto, iva_total, monto_total. Totales al final.
     *
     * Asume que los repositorios tienen findByFechaBetween(LocalDateTime, LocalDateTime).
     */
    @Transactional(readOnly = true)
    public byte[] generarReporteMensualDetallado(LocalDate inicio, LocalDate fin) {
        YearMonth ymInicio = YearMonth.from(inicio);
        YearMonth ymFin = YearMonth.from(fin);

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            YearMonth cur = ymInicio;
            while (!cur.isAfter(ymFin)) {
                LocalDate monthStart = cur.atDay(1);
                LocalDate monthEnd = cur.atEndOfMonth();

                LocalDateTime startLdt = monthStart.atStartOfDay();
                LocalDateTime endLdt = monthEnd.atTime(23, 59, 59, 999_999_999);

                // HOJA para el mes
                String sheetName = cur.toString(); // YYYY-MM
                Sheet sheet = workbook.createSheet(sheetName);

                int rowIdx = 0;

                // --- VENTAS ---
                Row titleVentas = sheet.createRow(rowIdx++);
                titleVentas.createCell(0).setCellValue("Ventas");

                // Header ventas
                Row headerV = sheet.createRow(rowIdx++);
                headerV.createCell(0).setCellValue("Fecha/Hora");
                headerV.createCell(1).setCellValue("Método de pago");
                headerV.createCell(2).setCellValue("Monto Neto");
                headerV.createCell(3).setCellValue("Comisión Total");
                headerV.createCell(4).setCellValue("IVA Total");
                headerV.createCell(5).setCellValue("Monto Bruto");

                // Obtener ventas del mes (orden ascendente por fecha)
                List<com.marroquineriabalta.entity.Venta> ventas =
                        ventaRepository.findByFechaBetween(startLdt, endLdt)
                                .stream()
                                .sorted(Comparator.comparing(com.marroquineriabalta.entity.Venta::getFecha))
                                .collect(Collectors.toList());

                BigDecimal sumMontoNetoV = BigDecimal.ZERO;
                BigDecimal sumComisionV = BigDecimal.ZERO;
                BigDecimal sumIvaV = BigDecimal.ZERO;
                BigDecimal sumBrutoV = BigDecimal.ZERO;

                for (com.marroquineriabalta.entity.Venta v : ventas) {
                    Row r = sheet.createRow(rowIdx++);
                    String fechaStr = v.getFecha() != null ? v.getFecha().format(dtf) : "";
                    // método de pago: primer método si existe
                    String metodo = "";
                    if (v.getMetodosPago() != null && !v.getMetodosPago().isEmpty()) {
                        try {
                            if (v.getMetodosPago().get(0) != null && v.getMetodosPago().get(0).getMetodoPago() != null) {
                                metodo = v.getMetodosPago().get(0).getMetodoPago().getNombre();
                            }
                        } catch (Exception ignored) { }
                    }

                    BigDecimal montoNeto = safe(v.getMontoNeto());
                    BigDecimal comision = safe(v.getComisionTotal());
                    BigDecimal iva = safe(v.getIvaTotal());
                    BigDecimal bruto = safe(v.getMontoBruto());

                    r.createCell(0).setCellValue(fechaStr);
                    r.createCell(1).setCellValue(metodo);
                    r.createCell(2).setCellValue(montoNeto.doubleValue());
                    r.createCell(3).setCellValue(comision.doubleValue());
                    r.createCell(4).setCellValue(iva.doubleValue());
                    r.createCell(5).setCellValue(bruto.doubleValue());

                    sumMontoNetoV = sumMontoNetoV.add(montoNeto);
                    sumComisionV = sumComisionV.add(comision);
                    sumIvaV = sumIvaV.add(iva);
                    sumBrutoV = sumBrutoV.add(bruto);
                }

                // fila totales ventas
                rowIdx++; // espacio
                Row totalsVRow = sheet.createRow(rowIdx++);
                totalsVRow.createCell(0).setCellValue("TOTALES");
                totalsVRow.createCell(2).setCellValue(sumMontoNetoV.doubleValue());
                totalsVRow.createCell(3).setCellValue(sumComisionV.doubleValue());
                totalsVRow.createCell(4).setCellValue(sumIvaV.doubleValue());
                totalsVRow.createCell(5).setCellValue(sumBrutoV.doubleValue());

                rowIdx += 2; // espacio antes de siguiente tabla

                // --- COMPRAS / COMPRA_MATERIAL / GASTOS ---
                Row titleCompras = sheet.createRow(rowIdx++);
                titleCompras.createCell(0).setCellValue("Compras / CompraMaterial / Gastos");

                // Header
                Row headerC = sheet.createRow(rowIdx++);
                headerC.createCell(0).setCellValue("Tipo");
                headerC.createCell(1).setCellValue("Fecha/Hora");
                headerC.createCell(2).setCellValue("Método de pago");
                headerC.createCell(3).setCellValue("Monto Neto");
                headerC.createCell(4).setCellValue("IVA Total");
                headerC.createCell(5).setCellValue("Monto Total");

                // Recolectar entradas combinadas
                class Entry {
                    LocalDateTime fecha;
                    String tipo;
                    String metodo;
                    BigDecimal montoNeto;
                    BigDecimal iva;
                    BigDecimal total;
                }
                List<Entry> entries = new ArrayList<>();

                // Compras
                List<com.marroquineriabalta.entity.Compra> compras = compraRepository.findByFechaBetween(startLdt, endLdt)
                        .stream().sorted(Comparator.comparing(com.marroquineriabalta.entity.Compra::getFecha))
                        .collect(Collectors.toList());
                for (com.marroquineriabalta.entity.Compra c : compras) {
                    Entry e = new Entry();
                    e.fecha = c.getFecha();
                    e.tipo = "Compra";
                    e.metodo = c.getMetodoPago() != null ? c.getMetodoPago().getNombre() : "";
                    e.montoNeto = safe(c.getMontoNeto());
                    e.iva = safe(c.getIvaTotal());
                    e.total = safe(c.getMontoTotal());
                    entries.add(e);

                    // Añadir CompraMaterial asociados (cada uno como fila separada tipo CompraMaterial)
                    List<com.marroquineriabalta.entity.CompraMaterial> cmList =
                            compraMaterialRepository.findByCompraIdCompra(c.getIdCompra());
                    for (com.marroquineriabalta.entity.CompraMaterial cm : cmList) {
                        Entry em = new Entry();
                        em.fecha = (cm.getCompra() != null && cm.getCompra().getFecha() != null) ? cm.getCompra().getFecha() : c.getFecha();
                        em.tipo = "CompraMaterial";
                        em.metodo = c.getMetodoPago() != null ? c.getMetodoPago().getNombre() : "";
                        em.montoNeto = safe(cm.getSubtotal());
                        em.iva = BigDecimal.ZERO;
                        em.total = safe(cm.getSubtotal());
                        entries.add(em);
                    }
                }

                // Gastos
                List<com.marroquineriabalta.entity.Gasto> gastos = gastoRepository.findByFechaBetween(startLdt, endLdt)
                        .stream().sorted(Comparator.comparing(com.marroquineriabalta.entity.Gasto::getFecha))
                        .collect(Collectors.toList());
                for (com.marroquineriabalta.entity.Gasto g : gastos) {
                    Entry eg = new Entry();
                    eg.fecha = g.getFecha();
                    eg.tipo = "Gasto";
                    eg.metodo = g.getMetodoPago() != null ? g.getMetodoPago().getNombre() : "";
                    eg.montoNeto = safe(g.getMonto());
                    eg.iva = BigDecimal.ZERO;
                    eg.total = safe(g.getMonto());
                    entries.add(eg);
                }

                // Ordenar todas las entradas por fecha ascendente
                entries.sort(Comparator.comparing(e -> e.fecha != null ? e.fecha : LocalDateTime.MIN));

                BigDecimal sumNetoC = BigDecimal.ZERO;
                BigDecimal sumIvaC = BigDecimal.ZERO;
                BigDecimal sumTotalC = BigDecimal.ZERO;

                for (Entry e : entries) {
                    Row r = sheet.createRow(rowIdx++);
                    String fechaStr = e.fecha != null ? e.fecha.format(dtf) : "";
                    r.createCell(0).setCellValue(e.tipo);
                    r.createCell(1).setCellValue(fechaStr);
                    r.createCell(2).setCellValue(e.metodo != null ? e.metodo : "");
                    r.createCell(3).setCellValue(e.montoNeto.doubleValue());
                    r.createCell(4).setCellValue(e.iva.doubleValue());
                    r.createCell(5).setCellValue(e.total.doubleValue());

                    sumNetoC = sumNetoC.add(e.montoNeto);
                    sumIvaC = sumIvaC.add(e.iva);
                    sumTotalC = sumTotalC.add(e.total);
                }

                // Totales compras/gastos
                rowIdx++;
                Row totalsC = sheet.createRow(rowIdx++);
                totalsC.createCell(0).setCellValue("TOTALES");
                totalsC.createCell(3).setCellValue(sumNetoC.doubleValue());
                totalsC.createCell(4).setCellValue(sumIvaC.doubleValue());
                totalsC.createCell(5).setCellValue(sumTotalC.doubleValue());

                // Autosize columnas básicas
                for (int c = 0; c <= 6; c++) sheet.autoSizeColumn(c);

                // siguiente mes
                cur = cur.plusMonths(1);
            }

            workbook.write(baos);
            return baos.toByteArray();
        } catch (IOException ex) {
            throw new RuntimeException("Error generando reporte detallado: " + ex.getMessage(), ex);
        }
    }

    private static BigDecimal safe(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }
}
