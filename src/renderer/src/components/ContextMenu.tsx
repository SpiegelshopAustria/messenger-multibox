import React, { useEffect, useRef } from 'react'
import { useModal } from '../hooks/useModal'

export interface ContextMenuItem {
  label:     string
  icon?:     string
  onClick:   () => void
  danger?:   boolean
  divider?:  boolean
}

interface Props {
  x:       number
  y:       number
  items:   ContextMenuItem[]
  onClose: () => void
}

export function ContextMenu({ x, y, items, onClose }: Props) {
  useModal()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const timer = setTimeout(() => document.addEventListener('mousedown', handler), 50)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handler)
    }
  }, [onClose])

  const menuWidth  = 180
  const menuHeight = items.length * 36 + 8
  const adjustedX  = x + menuWidth  > window.innerWidth  ? x - menuWidth  : x
  const adjustedY  = y + menuHeight > window.innerHeight ? y - menuHeight : y

  return (
    <div
      ref={ref}
      style={{
        position:     'fixed',
        left:         adjustedX,
        top:          adjustedY,
        width:        `${menuWidth}px`,
        background:   '#233138',
        borderRadius: '8px',
        boxShadow:    '0 8px 32px rgba(0,0,0,0.5)',
        border:       '1px solid #3b4a54',
        zIndex:       99999,
        padding:      '4px 0',
        userSelect:   'none',
      }}
    >
      {items.map((item, i) => {
        if (item.divider) {
          return (
            <div
              key={i}
              style={{
                height:     '1px',
                background: '#3b4a54',
                margin:     '4px 0',
              }}
            />
          )
        }
        return (
          <div
            key={i}
            onClick={() => { item.onClick(); onClose() }}
            style={{
              display:    'flex',
              alignItems: 'center',
              gap:        '10px',
              padding:    '8px 14px',
              cursor:     'pointer',
              color:      item.danger ? '#ff6b6b' : '#e9edef',
              fontSize:   '13px',
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.background =
                item.danger ? '#3d2020' : '#2a3942'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.background = 'transparent'
            }}
          >
            {item.icon && (
              <span style={{ fontSize: '15px', width: '18px', textAlign: 'center' }}>
                {item.icon}
              </span>
            )}
            {item.label}
          </div>
        )
      })}
    </div>
  )
}
