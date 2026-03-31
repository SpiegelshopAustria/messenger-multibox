import React, { useState } from 'react'
import { useModal } from '../hooks/useModal'

const EMOJI_GALLERY = [
  '\u{1F464}','\u{1F454}','\u{1F3E0}','\u{1F527}','\u{1F697}','\u{1F4BC}','\u{1F468}\u{200D}\u{1F4BB}','\u{1F469}\u{200D}\u{1F4BC}',
  '\u{1F4AC}','\u{1F4F1}','\u{1F4DE}','\u{1F4E7}','\u{1F48C}','\u{1F514}','\u{1F4E2}','\u{1F4A1}',
  '\u{1F3E2}','\u{1F3EA}','\u{1F3ED}','\u{1F511}','\u{1F4B0}','\u{1F4CA}','\u{2705}','\u{2B50}',
  '\u{1F3AF}','\u{1F3AE}','\u{1F3B5}','\u{1F355}','\u{2615}','\u{2708}\u{FE0F}','\u{1F30D}','\u{2764}\u{FE0F}',
  '\u{1F534}','\u{1F7E0}','\u{1F7E1}','\u{1F7E2}','\u{1F535}','\u{1F7E3}','\u{26AB}','\u{26AA}',
  '\u{1F31F}','\u{1F525}','\u{26A1}','\u{1F381}','\u{1F6E0}\u{FE0F}','\u{1F4CC}','\u{1F512}','\u{1F308}',
]

const COLORS = [
  '#25d366','#128c7e','#075e54',
  '#34b7f1','#0063cb','#7c3aed',
  '#dc2626','#ea580c','#ca8a04',
  '#6b7280','#0f172a','#be185d',
]

interface Account {
  id:        string
  name:      string
  color:     string
  emoji?:    string
  serviceId: string
}

interface Props {
  account: Account
  onSave:  (id: string, name: string, color: string, emoji: string) => void
  onClose: () => void
}

export function EditAccountModal({ account, onSave, onClose }: Props) {
  useModal()
  const [name,  setName]  = useState(account.name)
  const [color, setColor] = useState(account.color)
  const [emoji, setEmoji] = useState(account.emoji || '')

  const submit = () => {
    if (!name.trim()) return
    onSave(account.id, name.trim(), color, emoji)
    onClose()
  }

  const preview = emoji || name.slice(0, 2).toUpperCase()

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#1f2c34', borderRadius: '14px',
          padding: '24px', width: '380px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          maxHeight: '90vh', overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header mit Vorschau */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: emoji ? '26px' : '18px',
            fontWeight: '700', color: '#fff',
            boxShadow: `0 0 0 3px ${color}44`,
            flexShrink: 0,
          }}>
            {preview}
          </div>
          <div>
            <div style={{ color: '#e9edef', fontSize: '16px', fontWeight: '600' }}>
              Account bearbeiten
            </div>
            <div style={{ color: '#8696a0', fontSize: '12px', marginTop: '2px' }}>
              {account.serviceId}
            </div>
          </div>
        </div>

        {/* Name */}
        <label style={{ color: '#8696a0', fontSize: '12px', display: 'block', marginBottom: '6px' }}>
          Name
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit() }}
          autoFocus
          style={{
            width: '100%', background: '#2a3942',
            border: '1px solid #3b4a54', borderRadius: '8px',
            padding: '10px 12px', color: '#e9edef', fontSize: '14px',
            outline: 'none', marginBottom: '20px', boxSizing: 'border-box',
          }}
        />

        {/* Farbe */}
        <label style={{ color: '#8696a0', fontSize: '12px', display: 'block', marginBottom: '8px' }}>
          Farbe
        </label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {COLORS.map(c => (
            <div
              key={c}
              onClick={() => setColor(c)}
              style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: c, cursor: 'pointer',
                boxShadow: color === c ? `0 0 0 3px #fff, 0 0 0 5px ${c}` : 'none',
                transition: 'box-shadow 0.15s',
              }}
            />
          ))}
        </div>

        {/* Emoji Galerie */}
        <label style={{ color: '#8696a0', fontSize: '12px', display: 'block', marginBottom: '8px' }}>
          Icon (optional)
          {emoji && (
            <span
              onClick={() => setEmoji('')}
              style={{ marginLeft: '8px', color: '#ff6b6b', cursor: 'pointer', fontSize: '11px' }}
            >
              Entfernen
            </span>
          )}
        </label>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)',
          gap: '4px', marginBottom: '24px',
          background: '#2a3942', borderRadius: '10px',
          padding: '10px',
        }}>
          {EMOJI_GALLERY.map(e => (
            <div
              key={e}
              onClick={() => setEmoji(e === emoji ? '' : e)}
              style={{
                width: '36px', height: '36px', borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', cursor: 'pointer',
                background: emoji === e ? color + '44' : 'transparent',
                border: emoji === e ? `2px solid ${color}` : '2px solid transparent',
                transition: 'all 0.1s',
              }}
            >
              {e}
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none',
              background: '#2a3942', color: '#8696a0',
              cursor: 'pointer', fontSize: '14px',
            }}
          >
            Abbrechen
          </button>
          <button
            onClick={submit}
            disabled={!name.trim()}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none',
              background: name.trim() ? color : '#1a3a2a',
              color: name.trim() ? '#fff' : '#8696a0',
              cursor: name.trim() ? 'pointer' : 'not-allowed',
              fontSize: '14px', fontWeight: '600',
            }}
          >
            Speichern
          </button>
        </div>
      </div>
    </div>
  )
}
