// src/components/MenuItem.jsx
import React, { useState } from 'react';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';

export default function MenuItem({ route, hash, onNavigate }) {
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const hasSubmenu = route.submenu && route.submenu.length > 0;
  const isActive = hash === route.path || (hasSubmenu && route.submenu.some(item => hash === item.path));

  const handleClick = (e) => {
    if (hasSubmenu) {
      e.preventDefault();
      setSubmenuOpen(!submenuOpen);
    } else {
      onNavigate();
    }
  };

  const handleSubmenuClick = (subPath) => {
    window.location.hash = subPath;
    onNavigate();
  };

  return (
    <div className="menu-item">
      <a
        href={route.path}
        className={`nav-link ${isActive ? 'active' : ''} ${hasSubmenu ? 'has-submenu' : ''}`}
        onClick={handleClick}
      >
        <span className="nav-icon" style={{ marginRight: '0.75rem', fontSize: '1.2rem' }}>
          {route.icon}
        </span>
        <span className="nav-label" style={{ flex: 1 }}>
          {route.label}
        </span>
        {hasSubmenu && (
          <span className="nav-arrow">
            {submenuOpen ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </span>
        )}
      </a>
      
      {hasSubmenu && submenuOpen && (
        <div className="submenu">
          {route.submenu.map((subItem, index) => (
            <a
              key={index}
              href={subItem.path}
              className={`submenu-link ${hash === subItem.path ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                handleSubmenuClick(subItem.path);
              }}
            >
              {subItem.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}