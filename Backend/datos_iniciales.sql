-- =====================================================
-- SCRIPT COMPLETO: Datos básicos + Migración
-- Base de datos: PostgreSQL
-- Fecha: 2025-10-07
-- =====================================================

-- =====================================================
-- PARTE 1: DATOS BÁSICOS
-- =====================================================

-- Métodos de Pago
INSERT INTO metodo_pago (nombre, iva_asociado) VALUES
                                                   ('Efectivo', 0),
                                                   ('Tarjeta de Crédito', 19),
                                                   ('Tarjeta de Débito', 19),
                                                   ('Transferencia', 19)
ON CONFLICT (nombre) DO NOTHING;

-- Categorías
INSERT INTO categoria (nombre, descripcion) VALUES
                                                ('Billeteras', 'Billeteras de cuero'),
                                                ('Bolsos', 'Bolsos y carteras'),
                                                ('Cinturones', 'Cinturones de cuero'),
                                                ('Accesorios', 'Otros accesorios de cuero')
ON CONFLICT (nombre) DO NOTHING;

-- Usuario Administrador (password: admin123)
-- Hash BCrypt: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
INSERT INTO usuario (rut, nombre, correo_electronico, rol, user_password, fecha_creacion)
VALUES (
           '12345678-9',
           'Administrador',
           'admin@marroquineria.cl',
           'ADMINISTRADOR',
           '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
           NOW()
       )
ON CONFLICT (rut) DO NOTHING;

-- Productos de ejemplo
INSERT INTO producto (nombre, descripcion, precio, id_categoria) VALUES
                                                                     ('Billetera Clásica', 'Billetera de cuero genuino', 15000, 1),
                                                                     ('Bolso Ejecutivo', 'Bolso de cuero para documentos', 45000, 2),
                                                                     ('Cinturón Casual', 'Cinturón de cuero negro', 12000, 3)
ON CONFLICT DO NOTHING;

-- Inventario inicial
INSERT INTO inventario (id_producto, cantidad_producto, costo_unitario, fecha_actualizacion)
SELECT id_producto, 50, precio * 0.6, NOW()
FROM producto
WHERE NOT EXISTS (
    SELECT 1 FROM inventario WHERE inventario.id_producto = producto.id_producto
);

-- =====================================================
-- PARTE 2: MIGRACIÓN - AGREGAR COLUMNAS A VENTA
-- =====================================================

-- Agregar columnas financieras a la tabla VENTA (si no existen)
DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'venta' AND column_name = 'monto_neto'
        ) THEN
            ALTER TABLE venta
                ADD COLUMN monto_neto DECIMAL(10, 2) DEFAULT 0,
                ADD COLUMN monto_bruto DECIMAL(10, 2) DEFAULT 0,
                ADD COLUMN comision DECIMAL(10, 2) DEFAULT 0;

            RAISE NOTICE 'Columnas financieras agregadas a tabla venta';
        ELSE
            RAISE NOTICE 'Las columnas financieras ya existen en tabla venta';
        END IF;
    END $$;

-- =====================================================
-- PARTE 3: MIGRACIÓN - LIMPIAR COLUMNAS DE COMPRA
-- =====================================================

-- Eliminar columnas financieras innecesarias de COMPRA (si existen)
DO $$
    BEGIN
        -- Eliminar monto_neto
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'compra' AND column_name = 'monto_neto'
        ) THEN
            ALTER TABLE compra DROP COLUMN monto_neto;
            RAISE NOTICE 'Columna monto_neto eliminada de compra';
        END IF;

        -- Eliminar monto_bruto
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'compra' AND column_name = 'monto_bruto'
        ) THEN
            ALTER TABLE compra DROP COLUMN monto_bruto;
            RAISE NOTICE 'Columna monto_bruto eliminada de compra';
        END IF;

        -- Eliminar iva_total
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'compra' AND column_name = 'iva_total'
        ) THEN
            ALTER TABLE compra DROP COLUMN iva_total;
            RAISE NOTICE 'Columna iva_total eliminada de compra';
        END IF;

        -- Eliminar comision
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'compra' AND column_name = 'comision'
        ) THEN
            ALTER TABLE compra DROP COLUMN comision;
            RAISE NOTICE 'Columna comision eliminada de compra';
        END IF;
    END $$;

-- =====================================================
-- PARTE 4: MIGRACIÓN DE DATOS EXISTENTES
-- =====================================================

-- Actualizar valores existentes en tabla VENTA (si tiene datos antiguos)
UPDATE venta
SET
    monto_bruto = monto_total,
    monto_neto = monto_total - COALESCE(iva_total, 0),
    comision = 0
WHERE (monto_bruto IS NULL OR monto_bruto = 0)
  AND monto_total > 0;

-- =====================================================
-- PARTE 5: VERIFICACIÓN
-- =====================================================

-- =====================================================
-- PARTE X: MIGRACIÓN - AGENDAMIENTOS (producto opcional)
-- =====================================================

-- Permite agendar con nombre de producto libre (sin id_producto)
DO $$
    BEGIN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'agendamiento' AND column_name = 'id_producto' AND is_nullable = 'NO'
        ) THEN
            ALTER TABLE agendamiento ALTER COLUMN id_producto DROP NOT NULL;
            RAISE NOTICE 'Agendamiento.id_producto ahora permite NULL';
        END IF;
    END $$;

-- Resumen de datos insertados
SELECT '════════════════════════════════════════' as separador;
SELECT '✅ MIGRACIÓN COMPLETADA' as mensaje;
SELECT '════════════════════════════════════════' as separador;

SELECT 'Métodos de Pago' as tipo, COUNT(*) as total FROM metodo_pago;
SELECT 'Categorías' as tipo, COUNT(*) as total FROM categoria;
SELECT 'Productos' as tipo, COUNT(*) as total FROM producto;
SELECT 'Inventario' as tipo, COUNT(*) as total FROM inventario;
SELECT 'Usuarios' as tipo, COUNT(*) as total FROM usuario;

SELECT '════════════════════════════════════════' as separador;
SELECT '📊 ESTRUCTURA DE TABLAS' as seccion;
SELECT '════════════════════════════════════════' as separador;

-- Verificar columnas de VENTA
SELECT 'VENTA - Columnas financieras:' as info;
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'venta'
  AND column_name IN ('monto_neto', 'monto_bruto', 'comision', 'iva_total', 'monto_total')
ORDER BY ordinal_position;

SELECT '' as espacio;

-- Verificar columnas de COMPRA
SELECT 'COMPRA - Columnas (simplificado):' as info;
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'compra'
  AND column_name IN ('monto_total', 'fecha', 'id_metodo_pago', 'observaciones')
ORDER BY ordinal_position;

SELECT '════════════════════════════════════════' as separador;
SELECT '🎉 SCRIPT EJECUTADO EXITOSAMENTE' as mensaje;
SELECT '════════════════════════════════════════' as separador;

SELECT '👤 CREDENCIALES DE ACCESO' as info;
SELECT '   Email: admin@marroquineria.cl' as dato;
SELECT '   Password: admin123' as dato;
SELECT '   RUT: 12345678-9' as dato;

SELECT '' as espacio;

SELECT '📋 RESUMEN DE ESTRUCTURA' as info;
SELECT '   VENTA: Con desglose financiero completo' as estructura;
SELECT '     • monto_neto (lo que recibes)' as detalle;
SELECT '     • iva_total' as detalle;
SELECT '     • comision (solo tarjetas)' as detalle;
SELECT '     • monto_bruto (total)' as detalle;
SELECT '' as espacio;
SELECT '   COMPRA: Simple - solo monto total' as estructura;
SELECT '     • monto_total (lo que pagas)' as detalle;
SELECT '' as espacio;
SELECT '   GASTO: Simple - solo monto total' as estructura;
SELECT '     • monto (lo que pagas)' as detalle;

SELECT '════════════════════════════════════════' as separador;

-- =====================================================
-- NOTAS:
-- =====================================================
-- 1. Script idempotente (se puede ejecutar múltiples veces)
-- 2. Datos básicos: 4 métodos de pago, 4 categorías, 3 productos
-- 3. Inventario inicial: 50 unidades por producto
-- 4. VENTA: Mantiene campos financieros para reportes detallados
-- 5. COMPRA/GASTO: Simplificados, solo monto total
-- 6. Password admin: admin123 (CAMBIAR EN PRODUCCIÓN)
-- =====================================================