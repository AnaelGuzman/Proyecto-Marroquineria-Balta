package com.marroquineriabalta.service;

import com.marroquineriabalta.entity.Estadistica;
import com.marroquineriabalta.repository.EstadisticaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.YearMonth;
import java.time.DayOfWeek;
import java.time.temporal.TemporalAdjusters;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.ArrayList;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EstadisticaService {

    private final EstadisticaRepository estadisticaRepository;

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
}
