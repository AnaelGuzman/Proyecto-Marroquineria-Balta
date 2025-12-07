import React, { useMemo, useState, useRef, useEffect } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Dashboard from './pages/Dashboard.jsx'
import Ingresos from './pages/Venta/Ingresos.jsx'
import StatVentas from './pages/Venta/EstadisticasVentas.jsx'
import Egresos from './pages/Egresos.jsx'
import StatCompras from './pages/Compra/EstadisticasCompras.jsx'
import Reportes from './pages/Reportes.jsx'
import Inventario from './pages/Inventario/Inventario.jsx'
import InventarioMateriales from './pages/Inventario/InventarioMateriales.jsx'
import Configuracion from './pages/Met-Cat.jsx'
import Login from './pages/auth/Login.jsx'
import Registro from './pages/auth/Registro.jsx'
import MenuItem from './components/MenuItem.jsx';
import Logo from './components/Logo.jsx'
import { Button } from './components/UI.jsx'
import { Logout, Person } from '@mui/icons-material'
import AgendamientosModal from './components/AgendamientosModal.jsx'
import GestionUsuarios from './pages/GestionUsuarios.jsx'

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

const routes = [
  { 
    path: '#/', 
    label: 'Inicio', 
    element: Dashboard,
    icon: '🏠'
  },
  { 
    path: '#/ingresos', 
    label: 'Venta', 
    element: Ingresos,
    icon: '💰'
  },
  { 
    path: '#/egresos', 
    label: 'Compra', 
    element: Egresos,
    icon: '🛒'
  },
  { 
    path: '#/inventario', 
    label: 'Inventario', 
    element: Inventario,
    icon: '📦',
    submenu: [
      { path: '#/inventario', label: 'Gestión de Inventario' },
      { path: '#/inventarioMat', label: 'Inventario Materiales', element: InventarioMateriales },
    ]
  },
  { 
    path: '#/reportes', 
    label: 'Estadísticas', 
    element: Reportes,
    icon: '📊',
    submenu: [
      { path: '#/reportes', label: 'Dashboard General' },
      { path: '#/ventas-estadisticas', label: 'Estadísticas de Ventas', element: StatVentas },
      { path: '#/compras-estadisticas', label: 'Estadísticas de Compras', element: StatCompras },
    ]
  },
  { 
    path: '#/configuracion', 
    label: 'Configuración', 
    element: Configuracion,
    icon: '⚙️',
    submenu: [
      { path: '#/configuracion', label: 'Métodos y Categorías' },
      { path: '#/usuarios', label: 'Gestión de Usuarios', element: GestionUsuarios },  // ✅ AGREGAR
    ]
  },
]

export default function App() {
  const [hash, setHash] = useState(window.location.hash || '#/')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [openMenuPath, setOpenMenuPath] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const sidebarRef = useRef(null);
  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);
  const isSwiping = useRef(false);
  const SIDEBAR_WIDTH = 280;

  // Verificar autenticación al cargar
  useEffect(() => {
    const usuarioData = localStorage.getItem('usuario');
    if (usuarioData) {
      try {
        const parsed = JSON.parse(usuarioData);
        setUsuario(parsed);
        setIsAuthenticated(true);
      } catch (e) {
        localStorage.removeItem('usuario');
        setIsAuthenticated(false);
      }
    }
  }, []);

  // Manejar rutas de autenticación
  useEffect(() => {
    const currentHash = window.location.hash || '#/';
    
    // Si no está autenticado y no está en login/registro, redirigir a login
    if (!isAuthenticated && currentHash !== '#/login' && currentHash !== '#/registro') {
      window.location.hash = '#/login';
      return;
    }

    // Si está autenticado y está en login/registro, redirigir a home
    if (isAuthenticated && (currentHash === '#/login' || currentHash === '#/registro')) {
      window.location.hash = '#/';
      return;
    }
  }, [isAuthenticated, hash]);

  React.useEffect(() => {
    const onHashChange = () => {
      setHash(window.location.hash || '#/')
      setSidebarOpen(false)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  React.useEffect(() => {
    const activeRouteParent = routes.find(r => r.submenu?.some(s => s.path === hash));
    if (activeRouteParent) {
      setOpenMenuPath(activeRouteParent.path);
    }
  }, [hash]);

  // Gestos táctiles para cerrar el sidebar deslizando
  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    const handleTouchStart = (e) => {
      if (!sidebarOpen) return;
      touchStartX.current = e.touches[0].clientX;
      touchCurrentX.current = touchStartX.current;
      isSwiping.current = false;
    };

    const handleTouchMove = (e) => {
      if (!sidebarOpen) return;
      touchCurrentX.current = e.touches[0].clientX;
      const dx = touchCurrentX.current - touchStartX.current;

      if (dx > -10) return;

      isSwiping.current = true;
      sidebar.style.transition = 'none';
      sidebar.style.transform = `translateX(${Math.max(dx, -SIDEBAR_WIDTH)}px)`;
    };

    const handleTouchEnd = () => {
      if (!sidebarOpen) return;
      const dx = touchCurrentX.current - touchStartX.current;

      if (isSwiping.current && dx < -80) {
        setSidebarOpen(false);
      }

      sidebar.style.transition = '';
      sidebar.style.transform = '';
      isSwiping.current = false;
    };

    sidebar.addEventListener('touchstart', handleTouchStart, { passive: true });
    sidebar.addEventListener('touchmove', handleTouchMove, { passive: true });
    sidebar.addEventListener('touchend', handleTouchEnd);

    return () => {
      sidebar.removeEventListener('touchstart', handleTouchStart);
      sidebar.removeEventListener('touchmove', handleTouchMove);
      sidebar.removeEventListener('touchend', handleTouchEnd);
    };
  }, [sidebarOpen]);

  const handleMenuToggle = (path) => {
    setOpenMenuPath(prevPath => (prevPath === path ? null : path));
  };

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      localStorage.removeItem('usuario');
      setIsAuthenticated(false);
      setUsuario(null);
      window.location.hash = '#/login';
    }
  };

  const handleLoginSuccess = (userData) => {
    setUsuario(userData);
    setIsAuthenticated(true);
    window.location.hash = '#/';
  };

    const Active = useMemo(() => {
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

  // Renderizar páginas de autenticación
  if (hash === '#/login') {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Login onLoginSuccess={handleLoginSuccess} />
      </ThemeProvider>
    );
  }



  // Si no está autenticado, mostrar login
  if (!isAuthenticated) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Login onLoginSuccess={handleLoginSuccess} />
      </ThemeProvider>
    );
  }


  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      <div className={`shell ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <aside ref={sidebarRef} className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
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
                isOpen={openMenuPath === route.path}
                onToggle={() => handleMenuToggle(route.path)}
                onNavigate={() => setSidebarOpen(false)}
              />
            ))}
          </nav>
          <div className="sidebar-footer">
            <small>Conectado al backend</small>
          </div>
        </aside>
        {sidebarOpen && (
          <div 
            className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`}
            onClick={() => setSidebarOpen(false)} 
          />
        )}
        <main 
          className="content"
          style={{ 
            flex: 1, 
            overflowY: 'auto',
            height: '100vh' 
          }}
        >
          <Header 
            hash={hash} 
            onOpenSidebar={() => setSidebarOpen(true)} 
            sidebarOpen={sidebarOpen}
            usuario={usuario}
            onLogout={handleLogout}
          />
          <div className="page">
            <Active />
          </div>
        </main>
      </div>
    </ThemeProvider>
  )
}

function Header({ hash, onOpenSidebar, sidebarOpen, usuario, onLogout }) {
  const title = useMemo(() => {
    const directRoute = routes.find(r => hash === r.path)
    if (directRoute) return directRoute.label

    for (const route of routes) {
      const sub = route.submenu?.find(s => s.path === hash)
      if (sub) return sub.label || route.label
    }

    return 'Inicio'
  }, [hash])

  const [showCalendar, setShowCalendar] = useState(false)

  const chipBaseStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.45rem 0.9rem',
    borderRadius: '10px',
    height: '50px',
    minHeight: '50px'
  };

  const profileChipStyle = {
    ...chipBaseStyle,
    background: 'rgba(93, 64, 55, 0.08)',
    border: '1px solid var(--border)',
    color: 'var(--text)'
  };

  const agendamientoButtonStyle = {
    ...chipBaseStyle,
    background: 'linear-gradient(135deg, var(--brand), var(--brand-2))',
    border: '1px solid var(--brand)',
    color: '#fff',
    boxShadow: '0 4px 12px rgba(93, 64, 55, 0.25)'
  };

  return (
    <>
      <header 
        className="topbar"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          backgroundColor: 'var(--bg-default, #EFEBE9)'
        }}
      >
        <button
          type="button"
          className={`hamburger-btn ${sidebarOpen ? 'hide' : ''}`}
          onClick={onOpenSidebar}
          aria-label="Abrir menú"
        >
          ☰
        </button>
        <h1>{title}</h1>
        <div className="spacer" />

        <Button variant="ghost" small onClick={() => setShowCalendar(true)} className="btn-responsive" style={agendamientoButtonStyle}>
          <span className="icon">📅</span>
          <span className="text">Agendamientos</span>
        </Button>

        {/* Usuario con dropdown de logout */}
        <div style={profileChipStyle}>
          <Person sx={{ fontSize: 20, color: 'var(--brand)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{ 
              fontWeight: '600', 
              fontSize: '0.9rem',
              color: 'var(--text)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {usuario?.nombre || 'Usuario'}
            </span>
            <span style={{ 
              fontSize: '0.75rem', 
              color: 'var(--muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {usuario?.rol || 'USUARIO'}
            </span>
          </div>
        </div>

        <Button
          variant="ghost"
          small
          onClick={onLogout}
          style={{
            background: 'transparent',
            color: 'var(--error)',
            border: '2px solid var(--error)',
            height: '50px',
            minHeight: '50px'
          }}
        >
          <Logout sx={{ fontSize: 20 }} />
          <span className="text">Salir</span>
        </Button>
      </header>

      <AgendamientosModal open={showCalendar} onClose={() => setShowCalendar(false)} />
    </>
  )
}
