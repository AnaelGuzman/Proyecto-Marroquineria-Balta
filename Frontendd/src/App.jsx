import React, { useMemo, useState } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Dashboard from './pages/Dashboard.jsx'
import Ingresos from './pages/Venta/Ingresos.jsx'
import StatVentas from './pages/Venta/EstadisticasVentas.jsx'
import Egresos from './pages/Egresos.jsx'
import Reportes from './pages/Reportes.jsx'
import Inventario from './pages/Inventario/Inventario.jsx'
import Configuracion from './pages/Met-Cat.jsx'
import MenuItem from './components/MenuItem.jsx';
import Logo from './components/Logo.jsx'
import { Field, Button } from './components/UI.jsx'


const theme = createTheme({
  palette: {
    primary: {
      main: '#5D4037',
      light: '#8D6E63',
      dark: '#3E2723',
    },
    secondary: {
      main: '#A1887F',
      light: '#D7CCC8',
      dark: '#795548',
    },
    background: {
      default: '#EFEBE9',
      paper: '#FAF9F7',
    },
    text: {
      primary: '#3E2723',
      secondary: '#5D4037',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      color: '#3E2723',
    },
    h3: {
      fontSize: '1.8rem',
      fontWeight: 600,
      color: '#3E2723',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 20px rgba(93, 64, 55, 0.1)',
          border: '1px solid #D7CCC8',
        },
      },
    },
  },
});

// En App.jsx - actualiza la constante routes
const routes = [
  { 
    path: '#/', 
    label: 'Inicio', 
    element: Dashboard,
    icon: ''
  },
  { 
    path: '#/ingresos', 
    label: 'Venta', 
    element: Ingresos,
    icon: '',
    submenu: [
      { path: '#/ingresos', label: 'Registrar Venta' },
      { path: '#/ventas-estadisticas', label: 'Estadísticas de Ventas',element: StatVentas }
    ]
  },
  { 
    path: '#/egresos', 
    label: 'Compra', 
    element: Egresos,
    icon: '',
    submenu: [
      { path: '#/egresos', label: 'Registrar Compra' },
    ]
  },
  { 
    path: '#/inventario', 
    label: 'Inventario Productos', 
    element: Inventario,
    icon: '',
    submenu: [
      { path: '#/inventario', label: 'Gestión de Inventario' },
    ]
  },
  { 
    path: '#/reportes', 
    label: 'Estadísticas', 
    element: Reportes,
    icon: '',
    submenu: [
      { path: '#/reportes', label: 'Dashboard General' },
    ]
  },
  { 
    path: '#/configuracion', 
    label: 'Configuración', 
    element: Configuracion,
    icon: '',
    submenu: [
      { path: '#/configuracion', label: 'Métodos y Categorías' },
      { path: '#/usuarios', label: 'Usuarios' },
    ]
  },
]

export default function App() {
  const [hash, setHash] = useState(window.location.hash || '#/')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  React.useEffect(() => {
    const onHashChange = () => {
      setHash(window.location.hash || '#/')
      setSidebarOpen(false)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const Active = useMemo(() => {
    // Buscar coincidencia directa o dentro de submenús
    let match = routes.find(r => hash === r.path);
    
    if (!match) {
      for (const route of routes) {
        if (route.submenu) {
          const sub = route.submenu.find(s => hash === s.path);
          if (sub) {
            match = sub;
            break;
          }
        }
      }
    }

    return match ? match.element : routes[0].element;
  }, [hash]);


  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className={`shell ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="brand">
            <Logo />
            <div className="brand-text">
              <strong>BALTA</strong>
              <span className="muted">Marroquinería</span>
            </div>
          </div>
          <nav className="nav">
            {routes.map(route => (
              <MenuItem 
                key={route.path} 
                route={route} 
                hash={hash}
                onNavigate={() => setSidebarOpen(false)}
              />
            ))}
          </nav>
          <div className="sidebar-footer">
            <small>Conectado al backend</small>
          </div>
        </aside>
        {sidebarOpen && (
          <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
        )}
        <main className="content">
          <Header hash={hash} onToggleSidebar={() => setSidebarOpen(s => !s)} />
          <div className="page">
            <Active />
          </div>
        </main>
      </div>
    </ThemeProvider>
  )
}

function Header({ hash, onToggleSidebar }) {
  const title = useMemo(() => {
    const route = routes.find(r => hash === r.path)
    return route?.label ?? 'Inicio'
  }, [hash])

  const [showCalendar, setShowCalendar] = useState(false)
  const today = new Date().toISOString().split('T')[0]

  return (
    <>
      <header className="topbar">
        <button
          type="button"
          className="hamburger-btn"
          onClick={onToggleSidebar}
        >
          ☰
        </button>
        <h1>{title}</h1>
        <div className="spacer" />

        <Button variant="ghost" small onClick={() => setShowCalendar(true)}>
          Agendamientos
        </Button>

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
          onClick={() => setShowCalendar(false)}
        >
          <div
            style={{
              background: '#fff',
              padding: '1.5rem',
              borderRadius: '12px',
              minWidth: 300,
              position: 'relative',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>Selecciona fecha</h3>
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