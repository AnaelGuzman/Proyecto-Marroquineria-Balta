import React from 'react'
import { Card, Table, Toolbar, Button, Field } from '../components/UI.jsx'

export default function Inventario() {
  const columnas = ['Producto', 'Stock', 'Precio', 'Categoría', 'Último mov.']

  const categoryOptions = [
    { value: 'billetera', label: 'Billetera' },
    { value: 'cinturon', label: 'Cinturón' },
    { value: 'sombrero', label: 'Sombrero' },
    { value: 'accesorio', label: 'Accesorio' },
  ]

  // Estilo para que los botones tengan un ancho fijo y se alineen uniformemente.
  const fixedButtonStyle = {
    minWidth: '30px',
    textAlign: 'center'
  }

  // Estilo para los contenedores de los controles de stock y precio, con altura fija.
  const controlContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    height: '62px'
  }

  const filas = [
    [
      // Producto con botón de edición
      <div key="prod" style={{ display: 'flex', alignItems: 'center', height: '62px' }}>
        <span>Billetera 1</span>
        <Button
          variant="ghost"
          small
          style={{ marginLeft: '0.5rem', ...fixedButtonStyle }}
          aria-label="Editar producto"
        >
          ✎
        </Button>
      </div>,
      // Stock con botones fijos
      <div key="stock" style={controlContainerStyle}>
        <Button
          variant="ghost"
          small
          aria-label="Disminuir stock"
          style={fixedButtonStyle}
        >
          −
        </Button>
        <span>12</span>
        <Button
          variant="ghost"
          small
          aria-label="Aumentar stock"
          style={fixedButtonStyle}
        >
          +
        </Button>
      </div>,
      // Nuevo campo: Precio con botones fijos
      <div key="price" style={controlContainerStyle}>
        <Button
          variant="ghost"
          small
          aria-label="Disminuir precio"
          style={fixedButtonStyle}
        >
          −
        </Button>
        <span>$35000</span>
        <Button
          variant="ghost"
          small
          aria-label="Aumentar precio"
          style={fixedButtonStyle}
        >
          +
        </Button>
      </div>,
      // Categoría seleccionable
      <select key="cat" defaultValue="accesorio" style={{ height: '62px', padding: '0 1.1rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1.18rem' }}>
        {categoryOptions.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>,
      '12 Ago'
    ],
    [
      <div key="prod" style={{ display: 'flex', alignItems: 'center', height: '62px' }}>
        <span>Cinturón 1</span>
        <Button
          variant="ghost"
          small
          style={{ marginLeft: '0.5rem', ...fixedButtonStyle }}
          aria-label="Editar producto"
        >
          ✎
        </Button>
      </div>,
      <div key="stock" style={controlContainerStyle}>
        <Button
          variant="ghost"
          small
          aria-label="Disminuir stock"
          style={fixedButtonStyle}
        >
          −
        </Button>
        <span>7</span>
        <Button
          variant="ghost"
          small
          aria-label="Aumentar stock"
          style={fixedButtonStyle}
        >
          +
        </Button>
      </div>,
      <div key="price" style={controlContainerStyle}>
        <Button
          variant="ghost"
          small
          aria-label="Disminuir precio"
          style={fixedButtonStyle}
        >
          −
        </Button>
        <span>$35000</span>
        <Button
          variant="ghost"
          small
          aria-label="Aumentar precio"
          style={fixedButtonStyle}
        >
          +
        </Button>
      </div>,
      <select key="cat" defaultValue="accesorio" style={{ height: '62px', padding: '0 1.1rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1.18rem' }}>
        {categoryOptions.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>,
      '10 Ago'
    ],
    [
      <div key="prod" style={{ display: 'flex', alignItems: 'center', height: '62px' }}>
        <span>Sombrero 1</span>
        <Button
          variant="ghost"
          small
          style={{ marginLeft: '0.5rem', ...fixedButtonStyle }}
          aria-label="Editar producto"
        >
          ✎
        </Button>
      </div>,
      <div key="stock" style={controlContainerStyle}>
        <Button
          variant="ghost"
          small
          aria-label="Disminuir stock"
          style={fixedButtonStyle}
        >
          −
        </Button>
        <span>3</span>
        <Button
          variant="ghost"
          small
          aria-label="Aumentar stock"
          style={fixedButtonStyle}
        >
          +
        </Button>
      </div>,
      <div key="price" style={controlContainerStyle}>
        <Button
          variant="ghost"
          small
          aria-label="Disminuir precio"
          style={fixedButtonStyle}
        >
          −
        </Button>
        <span>$40000</span>
        <Button
          variant="ghost"
          small
          aria-label="Aumentar precio"
          style={fixedButtonStyle}
        >
          +
        </Button>
      </div>,
      <select key="cat" defaultValue="morral" style={{ height: '62px', padding: '0 1.1rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1.18rem' }}>
        {categoryOptions.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>,
      '08 Ago'
    ]
  ]

  return (
    <div className="stack">
      <Card title="Inventario" subtitle="Agregue, edite y administre los productos en stock">
        {/* Filtros en línea */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '1rem' }}>
          <Field label="Buscar" type="text" placeholder="Nombre o categoría" />
          <Field
            label="Categoría"
            type="select"
            options={[
              { value: 'all', label: 'Todas' },
              ...categoryOptions
            ]}
          />
        </div>
        <Toolbar style={{ marginBottom: '1.5rem' }}>
          <Button>Nuevo producto</Button>
          <Button variant="ghost">Ajuste de stock</Button>
        </Toolbar>
        {/* Envuelve la tabla para separar verticalmente y cambia su fondo */}
        <div style={{ marginTop: '1.5rem' }}>
          <Table 
            columns={columnas} 
            rows={filas} 
            style={{ background: 'var(--panel)', borderColor: 'var(--border)' }} 
          />
        </div>
      </Card>
    </div>
  )
}