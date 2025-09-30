-- Métodos de Pago
INSERT INTO metodo_pago (nombre, iva_asociado) VALUES
                                                   ('Efectivo', 0),
                                                   ('Tarjeta de Crédito', 19),
                                                   ('Tarjeta de Débito', 19),
                                                   ('Transferencia', 19)
    ON CONFLICT DO NOTHING;

-- Categorías
INSERT INTO categoria (nombre, descripcion) VALUES
                                                ('Billeteras', 'Billeteras de cuero'),
                                                ('Bolsos', 'Bolsos y carteras'),
                                                ('Cinturones', 'Cinturones de cuero'),
                                                ('Accesorios', 'Otros accesorios de cuero')
    ON CONFLICT DO NOTHING;

-- Usuario Administrador (password: admin123)
-- Generado con BCrypt, puedes usar https://bcrypt-generator.com/
INSERT INTO usuario (rut, nombre, correo_electronico, rol, user_password, fecha_creacion)
VALUES (
           '12345678-9',
           'Administrador',
           'admin@marroquineria.cl',
           'ADMINISTRADOR',
           '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
           NOW()
       )
    ON CONFLICT DO NOTHING;

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