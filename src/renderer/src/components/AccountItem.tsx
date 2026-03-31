import React, { useState } from 'react'
import { ContextMenu, ContextMenuItem } from './ContextMenu'

interface Props {
  id:           string
  name:         string
  color:        string
  emoji?:       string
  customImage?: string
  isActive:     boolean
  badge:        number
  status?:      string
  onClick:      () => void
  onRemove:     () => void
  onEdit:       () => void
}

export function AccountItem({ name, color, emoji, customImage, isActive, badge, status, onClick, onRemove, onEdit }: Props) {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)

  const hasImage = !!customImage
  const display  = hasImage ? null : (emoji || name.slice(0, 2).toUpperCase())
  const isEmoji  = !hasImage && !!emoji

  const menuItems: ContextMenuItem[] = [
    {
      label:   'Bearbeiten',
      icon:    '\u{270F}\u{FE0F}',
      onClick: onEdit,
    },
    { divider: true, label: '', onClick: () => {} },
    {
      label:   'Entfernen',
      icon:    '\u{1F5D1}\u{FE0F}',
      onClick: onRemove,
      danger:  true,
    },
  ]

  return (
    <>
      <div
        style={{
          position: 'relative', display: 'flex',
          justifyContent: 'center', alignItems: 'center',
          marginBottom: '8px', cursor: 'pointer',
        }}
        onClick={onClick}
        onContextMenu={e => {
          e.preventDefault()
          setMenu({ x: e.clientX, y: e.clientY })
        }}
        title={name}
      >
        {/* Active bar */}
        {isActive && (
          <div style={{
            position: 'absolute', left: 0,
            width: '3px', height: '36px',
            background: color, borderRadius: '0 2px 2px 0',
          }} />
        )}

        {/* Avatar */}
        <div style={{
          width: '44px', height: '44px',
          borderRadius: isActive ? '14px' : '50%',
          background: color, overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: isEmoji ? '22px' : '14px',
          fontWeight: '700',
          color: '#fff',
          transition: 'border-radius 0.2s ease',
          boxShadow: isActive ? `0 0 0 2px ${color}` : 'none',
          userSelect: 'none',
        }}>
          {hasImage
            ? <img
                src={customImage}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                alt={name}
              />
            : display
          }
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

        {/* Status dot */}
        {status && status !== 'loading' && (
          <div style={{
            position: 'absolute', bottom: '0px', right: '6px',
            width: '10px', height: '10px',
            borderRadius: '50%',
            background: {
              'connected':    '#25d366',
              'qr_needed':    '#f59e0b',
              'disconnected': '#ef4444',
              'loading':      '#6b7280',
            }[status] ?? '#6b7280',
            border: '2px solid #111b21',
          }}
            title={
              status === 'connected'    ? 'Verbunden' :
              status === 'qr_needed'    ? 'QR-Code scannen' :
              status === 'disconnected' ? 'Getrennt' : ''
            }
          />
        )}
      </div>

      {/* Kontextmenue */}
      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={menuItems}
          onClose={() => setMenu(null)}
        />
      )}
    </>
  )
}
