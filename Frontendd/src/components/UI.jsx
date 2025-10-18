
import React from 'react'
import { 
  Card as MuiCard, 
  CardHeader, 
  CardContent, 
  CardActions, 
  Button as MuiButton, 
  Table as MuiTable, 
  TableHead, 
  TableBody, 
  TableRow, 
  TableCell 
} from '@mui/material';
import { styled } from '@mui/material/styles';

export function Card({ title, subtitle, children, footer, accent }) {
  return (
    <MuiCard 
      sx={{ 
        background: 'linear-gradient(135deg, var(--panel), var(--panel-2))',
        border: '1px solid var(--border)',
        borderRadius: 3,
        boxShadow: 'var(--shadow)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 30px rgba(93, 64, 55, 0.15)'
        },
        transition: 'all 0.3s ease',
        '&::before': accent ? {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, var(--brand), var(--brand-2))'
        } : {}
      }}
    >
      {(title || subtitle) && (
        <CardHeader
          title={title}
          subheader={subtitle}
          sx={{
            background: 'linear-gradient(135deg, var(--panel), var(--panel-2))',
            borderBottom: '1px solid var(--border)',
            '& .MuiCardHeader-title': {
              fontSize: '1.5rem',
              fontWeight: 600,
              color: 'var(--text)'
            },
            '& .MuiCardHeader-subheader': {
              color: 'var(--muted)',
              fontSize: '0.9rem'
            }
          }}
        />
      )}
      <CardContent 
        sx={{ 
          padding: 3, 
          flex: '1 1 auto', 
          display: 'block',
          width: '100%',
        }}
      >
        {children}
      </CardContent>
      {footer && (
        <CardActions 
          sx={{ 
            padding: 2, 
            borderTop: '1px solid var(--border)',
            background: 'transparent'
          }}
        >
          {footer}
        </CardActions>
      )}
    </MuiCard>
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
  return (
    <div 
      className="toolbar"
      style={{
        display: 'flex',
        gap: '1rem',
        marginTop: '1.5rem',
        flexWrap: 'wrap'
      }}
    >
      {children}
    </div>
  )
}

const StyledButton = styled(MuiButton)(({ variant }) => ({
  height: '56px',
  minHeight: '56px',
  padding: '0 1.5rem',
  borderRadius: '8px',
  fontSize: '1rem',
  fontWeight: 500,
  textTransform: 'none',
  transition: 'all 0.3s ease',
  gap: '0.5rem',
  ...(variant === 'primary' && {
    background: 'linear-gradient(135deg, var(--brand), var(--brand-2))',
    color: '#fff',
    border: '2px solid transparent',
    '&:hover': {
      background: 'linear-gradient(135deg, var(--brand-2), var(--brand))',
      transform: 'translateY(-1px)',
      boxShadow: '0 6px 20px rgba(93, 64, 55, 0.2)'
    }
  }),
  ...(variant === 'ghost' && {
    background: 'transparent',
    border: '2px solid var(--border)',
    color: 'var(--text)',
    '&:hover': {
      background: 'var(--accent)',
      borderColor: 'var(--brand)'
    }
  })
}));

export function Button({ children, variant = 'primary', small, disabled = false, ...rest }) {
  return (
    <StyledButton
      variant={variant === 'ghost' ? 'outlined' : 'contained'}
      size={small ? 'small' : 'medium'}
      disabled={disabled}
      {...rest}
    >
      {children}
    </StyledButton>
  )
}

export function Table({ columns = [], rows = [], footer }) {
  return (
    <div className="table-wrap">
      <MuiTable sx={{ 
        background: 'var(--panel)',
        '& .MuiTableHead-root': {
          '& .MuiTableCell-head': {
            background: 'linear-gradient(135deg, var(--brand), var(--brand-2))',
            color: '#FFF',
            fontSize: '1rem',
            fontWeight: 600,
            borderBottom: '1px solid var(--border)'
          }
        },
        '& .MuiTableBody-root': {
          '& .MuiTableRow-root': {
            transition: 'background 0.3s ease',
            '&:hover': { background: 'var(--accent)' },
            '&:nth-of-type(even)': { background: 'var(--panel-2)' },
            '& .MuiTableCell-body': {
              borderBottom: '1px solid var(--border)',
              color: 'var(--text)',
              fontSize: '0.95rem'
            }
          }
        }
      }}>
        <TableHead>
          <TableRow>
            {columns.map((column, index) => (
              <TableCell key={index}>{column}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} align="center" sx={{ color: 'var(--muted)', py: 3 }}>
                Sin datos
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <TableCell key={cellIndex}>{cell}</TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </MuiTable>
      {footer && (
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', background: 'var(--panel-2)' }}>
          {footer}
        </div>
      )}
    </div>
  )
}
