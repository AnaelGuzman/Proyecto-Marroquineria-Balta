import React from 'react'

export function Card({ title, subtitle, children, footer, accent }) {
  return (
    <section className={`card ${accent ?? ''}`}>
      {(title || subtitle) && (
        <header className="card-header">
          {title && <h3>{title}</h3>}
          {subtitle && <p className="muted small">{subtitle}</p>}
        </header>
      )}
      <div className="card-body">{children}</div>
      {footer && <footer className="card-footer">{footer}</footer>}
    </section>
  )
}

export function Field({ label, placeholder = '', type = 'text', hint, inline, options }) {
  return (
    <label className={`field ${inline ? 'inline' : ''}`}>
      <span className="field-label">{label}</span>
      {type === 'select' ? (
        <select disabled>
          {(options ?? []).map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea placeholder={placeholder} disabled rows={3} />
      ) : (
        <input type={type} placeholder={placeholder} disabled />
      )}
      {hint && <small className="muted">{hint}</small>}
    </label>
  )
}

export function Toolbar({ children }) {
  return <div className="toolbar">{children}</div>
}

export function Button({ children, variant = 'primary', small, disabled = false, ...rest }) {
  return (
    <button className={`btn ${variant} ${small ? 'small' : ''}`} disabled={disabled} {...rest}>
      {children}
    </button>
  )
}

export function Table({ columns = [], rows = [], footer }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>{columns.map(c => <th key={c}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length} className="muted center">Sin datos</td></tr>
          ) : (
            rows.map((r, i) => (
              <tr key={i}>
                {r.map((cell, j) => <td key={j}>{cell}</td>)}
              </tr>
            ))
          )}
        </tbody>
        {footer && <tfoot><tr><td colSpan={columns.length}>{footer}</td></tr></tfoot>}
      </table>
    </div>
  )
}
