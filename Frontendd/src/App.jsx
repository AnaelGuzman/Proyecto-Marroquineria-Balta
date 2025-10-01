import React, { useMemo, useState } from 'react'
import Dashboard from './pages/Dashboard.jsx'
import Ingresos from './pages/Ingresos.jsx'
import Egresos from './pages/Egresos.jsx'
import Reportes from './pages/Reportes.jsx'
import Inventario from './pages/Inventario.jsx'
import Logo from './components/Logo.jsx'
import { Field, Button } from './components/UI.jsx'

const routes = [
  { path: '#/', label: 'Inicio', element: Dashboard },
  { path: '#/ingresos', label: 'Venta', element: Ingresos },
  { path: '#/egresos', label: 'Compra', element: Egresos },
  { path: '#/inventario', label: 'Inventario', element: Inventario },
  { path: '#/reportes', label: 'Estadísticas', element: Reportes },
]

export default function App() {
  const [hash, setHash] = useState(window.location.hash || '#/')
  React.useEffect(() => {
    const onHashChange = () => setHash(window.location.hash || '#/')
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const Active = useMemo(() => {
    const match = routes.find(r => hash === r.path) || routes[0]
    return match.element
  }, [hash])

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <Logo />
          <div className="brand-text">
            <strong>BALTA</strong>
            <span className="muted">Administración</span>
          </div>
        </div>
        <nav className="nav">
          {routes.map(r => (
            <a key={r.path} href={r.path} className={hash === r.path ? 'active' : ''}>
              {r.label}
            </a>
          ))}
        </nav>
        <div className="sidebar-footer">
          <small>Maqueta visual • Sin backend</small>
        </div>
      </aside>
      <main className="content">
        <Header hash={hash} />
        <div className="page">
          <Active />
        </div>
      </main>
    </div>
  )
}

function Header({ hash }) {
  const title = useMemo(() => {
    const route = routes.find(r => hash === r.path)
    return route?.label ?? 'Inicio'
  }, [hash])

  // Estado para controlar el pop-up del calendario de agendamientos
  const [showCalendar, setShowCalendar] = useState(false)

  // Fecha de hoy para el calendario (solo maqueta)
  const today = new Date().toISOString().split('T')[0]

  return (
    <>
      <header className="topbar">
        <h1>{title}</h1>
        <div className="spacer" />

        {/* Botón de agendamientos con el mismo estilo que el perfil */}
        <Button variant="ghost" small onClick={() => setShowCalendar(true)}>
          Agendamientos
        </Button>

        {/* Botón de perfil, ahora con el mismo estilo */}
        <Button variant="ghost" small title="Solo demostración">
          <span className="avatar" style={{ marginRight: '0.5rem' }}>⚙️</span>
          Marco antonio
        </Button>
      </header>

      {showCalendar && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowCalendar(false)} // Cierre al hacer clic fuera
        >
          <div
            style={{
              background: '#fff',
              padding: '1.5rem',
              borderRadius: '8px',
              minWidth: 300,
              position: 'relative',
            }}
            onClick={e => e.stopPropagation()} // Evitar cierre al hacer clic dentro
          >
            <h3 style={{ marginTop: 0 }}>Selecciona fecha</h3>
            {/* Puedes reemplazar esto por un componente de calendario */}
            <Field label="Fecha" type="date" defaultValue={today} />
            <div style={{ marginTop: '1rem', textAlign: 'right' }}>
              <Button onClick={() => setShowCalendar(false)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
