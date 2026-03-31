import React from 'react'

interface Props {
  id:       string
  name:     string
  color:    string
  isActive: boolean
  badge:    number
  onClick:  () => void
  onRemove: () => void
}

export function AccountItem({ name, color, isActive, badge, onClick, onRemove }: Props) {
  const initials = name.slice(0, 2).toUpperCase()

  return (
    <div
      style={{
        position: 'relative', display: 'flex',
        justifyContent: 'center', alignItems: 'center',
        marginBottom: '8px', cursor: 'pointer',
      }}
      onClick={onClick}
      onContextMenu={(e) => {
        e.preventDefault()
        if (window.confirm(`"${name}" entfernen?`)) onRemove()
      }}
      title={`${name}\n(Rechtsklick → Entfernen)`}
    >
      {/* Active indicator bar */}
      {isActive && (
        <div style={{
          position: 'absolute', left: 0,
          width: '3px', height: '36px',
          background: '#25d366', borderRadius: '0 2px 2px 0',
        }} />
      )}

      {/* Avatar */}
      <div style={{
        width: '44px', height: '44px',
        borderRadius: isActive ? '14px' : '50%',
        background: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '14px', fontWeight: '700', color: '#fff',
        transition: 'border-radius 0.2s ease',
        boxShadow: isActive ? `0 0 0 2px #25d366` : 'none',
        userSelect: 'none',
      }}>
        {initials}
      </div>

      {/* Unread badge */}
      {badge > 0 && (
        <div style={{
          position: 'absolute', top: '2px', right: '6px',
          background: '#25d366', color: '#fff',
          borderRadius: '10px', minWidth: '18px', height: '18px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '10px', fontWeight: '700', padding: '0 4px',
          pointerEvents: 'none',
        }}>
          {badge > 99 ? '99+' : badge}
        </div>
      )}
    </div>
  )
}
