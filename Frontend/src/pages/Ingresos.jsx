import React from 'react'
import { Card, Toolbar, Button, Table } from '../components/UI.jsx'

export default function Ingresos() {
  const rows = [
    ['12 Ago', 'Venta billetera “Pampa”', '$ 25.000', 'Efectivo'],
    ['09 Ago', 'Venta cinturón “Andino”', '$ 28.000', 'Efectivo'],
    ['03 Ago', 'Venta morral “Ruta”', '$ 65.000', 'Efectivo'],
  ]

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="stack large-text">
      <Card title="Registrar venta" subtitle="Registre una venta o ingreso monetario">
        <div className="form-grid">
          {/* 1ª fila: Nombre del producto | Categoría */}
          <div className="field col-6">
            <label className="field-label">Nombre del producto</label>
            <input type="text" placeholder='Ej: Billetera "Pampa"' />
          </div>

          <div className="field col-6">
            <label className="field-label">Categoría</label>
            <select defaultValue="">
              <option value="">Seleccionar</option>
              <option value="cartera">Cartera</option>
              <option value="cinturon">Cinturón</option>
              <option value="morral">Morral</option>
              <option value="accesorio">Accesorio</option>
            </select>
          </div>

          {/* 2ª fila: Monto | Cantidad */}
          <div className="field col-6">
            <label className="field-label">Monto</label>
            <input type="number" placeholder="$ 0" min={0} step={100} />
          </div>

          <div className="field col-6">
            <label className="field-label">Cantidad</label>
            <div>
              <Button variant="ghost" aria-label="Restar">−</Button>
              <input type="number" defaultValue={1} min={1} step={1} style={{ flex: 1, padding: '0 .6rem', borderRadius: 10, border: '1px solid var(--border)', fontSize: '1.05rem' }} />
              <Button variant="ghost" aria-label="Sumar">+</Button>
            </div>
          </div>

          {/* 3ª fila: Fecha | Tipo de pago */}
          <div className="field col-6">
            <label className="field-label">Fecha</label>
            <input type="date" defaultValue={today} />
          </div>

          <div className="field col-6">
            <label className="field-label">Tipo de pago</label>
            <select defaultValue="ef">
              <option value="ef">Efectivo</option>
              <option value="tr">Transferencia</option>
              <option value="db">Débito</option>
              <option value="cr">Crédito</option>
              <option value="qr">QR</option>
            </select>
          </div>

          {/* 4ª fila: Cuero utilizado | Otros implementos */}
          <div className="field col-6">
            <label className="field-label">Cuero utilizado (pies)</label>
            <input type="number" placeholder="0" min={0} step="0.1" />
          </div>

          <div className="field col-6">
            <label className="field-label">Otros implementos</label>
            <select defaultValue="ninguno">
              <option value="ninguno">Ninguno</option>
              <option value="hilo">Hilo encerado</option>
              <option value="remaches">Remaches</option>
              <option value="hebilla">Hebilla</option>
              <option value="cierres">Cierres</option>
              <option value="tinte">Tinte</option>
              <option value="pegamento">Pegamento de contacto</option>
            </select>
          </div>
        </div>

        <Toolbar>
          <Button>Guardar</Button>
          <Button variant="ghost">Guardar y nuevo</Button>
          <Button variant="ghost">Cancelar</Button>
        </Toolbar>
      </Card>

      <Card title="Ingresos del mes" subtitle="Listado de ejemplo">
        <Table columns={['Fecha', 'Detalle', 'Monto', 'Medio']} rows={rows} />
      </Card>
    </div>
  )
}
