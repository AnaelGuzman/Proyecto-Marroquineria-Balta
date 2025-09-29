import React from 'react'
import { Card, Field, Toolbar, Button, Table } from '../components/UI.jsx'

export default function Egresos() {
  const rows = [
    ['11 Ago', 'Compra de cuero vaqueta', '$ 320.000', 'Insumos'],
    ['08 Ago', 'Compra de publicidad', '$ 40.000', 'Marketing'],
    ['05 Ago', 'Compra de hilo encerado', '$ 18.000', 'Insumos'],
  ]

  return (
    <div className="stack">
      <Card title="Registrar compra" subtitle="Registra la compra de un producto o insumo como egreso monetario">
        <div className="form-grid">
          {/* 1ª fila: Nombre del producto & Categoría */}
          <div className="field col-6">
            <label className="field-label">Nombre del producto</label>
            <input type="text" placeholder='Ej: Cuero vaqueta 3mm, Hilo encerado, Hebillas' />
          </div>
          <div className="field col-6">
            <label className="field-label">Categoría</label>
            <select defaultValue="">
              <option value="">Seleccionar</option>
              <option value="ins">Compra de insumos</option>
              <option value="mkt">Publicidad/Marketing</option>
              <option value="otr">Otros</option>
            </select>
          </div>

          {/* 2ª fila: Monto & Cantidad */}
          <div className="field col-6">
            <label className="field-label">Monto</label>
            <input type="number" placeholder="$ 0" min={0} step={100} />
          </div>
          <div className="field col-6">
            <label className="field-label">Cantidad</label>
            <div>
              <Button variant="ghost" aria-label="Restar">−</Button>
              <input 
                type="number" 
                defaultValue={1} 
                min={1} 
                step={1} 
                style={{ flex: 1, padding: '0 .6rem', borderRadius: 10, border: '1px solid var(--border)', fontSize: '1.05rem' }} 
              />
              <Button variant="ghost" aria-label="Sumar">+</Button>
            </div>
          </div>

          {/* 3ª fila: Fecha & Tipo de pago */}
          <div className="field col-6">
            <label className="field-label">Fecha</label>
            <input type="date" />
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

          {/* 4ª fila: Notas (campo completo) */}
          <div className="field col-12">
            <label className="field-label">Notas</label>
            <textarea placeholder="Observaciones" disabled style={{ minHeight: '80px' }} />
          </div>
        </div>
        <Toolbar>
          <Button>Guardar</Button>
          <Button variant="ghost">Cancelar</Button>
        </Toolbar>
      </Card>
      <Card title="Egresos del mes" subtitle="Listado de ejemplo">
        <Table columns={["Fecha", "Detalle", "Monto", "Categoría"]} rows={rows} />
      </Card>
    </div>
  )
}
