import React, { useState } from 'react'
import { ContextMenu, ContextMenuItem } from './ContextMenu'

interface Props {
  id:        string
  name:      string
  color:     string
  emoji?:    string
  isActive:  boolean
  badge:     number
  onClick:   () => void
  onRemove:  () => void
  onEdit:    () => void
}

export function AccountItem({ name, color, emoji, isActive, badge, onClick, onRemove, onEdit }: Props) {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)

  const display = emoji || name.slice(0, 2).toUpperCase()
  const isEmoji = !!emoji

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
          background: color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: isEmoji ? '22px' : '14px',
          fontWeight: isEmoji ? '400' : '700',
          color: '#fff',
          transition: 'border-radius 0.2s ease',
          boxShadow: isActive ? `0 0 0 2px ${color}` : 'none',
          userSelect: 'none',
        }}>
          {display}
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
