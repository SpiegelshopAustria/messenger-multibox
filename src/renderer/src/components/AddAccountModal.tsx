import React, { useState } from 'react'

const COLORS = [
  '#25d366', '#128c7e', '#075e54',
  '#34b7f1', '#0063cb', '#7c3aed',
  '#dc2626', '#ea580c', '#ca8a04',
]

interface Props {
  onAdd:   (name: string, color: string) => void
  onClose: () => void
}

export function AddAccountModal({ onAdd, onClose }: Props) {
  const [name,  setName]  = useState('')
  const [color, setColor] = useState(COLORS[0])

  const submit = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd(trimmed, color)
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#1f2c34', borderRadius: '12px',
          padding: '24px', width: '300px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ color: '#e9edef', marginBottom: '20px', fontSize: '16px', fontWeight: '600' }}>
          Account hinzufuegen
        </h3>

        <label style={{ color: '#8696a0', fontSize: '12px', display: 'block', marginBottom: '6px' }}>
          Name / Bezeichnung
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
          placeholder="Privat, Buero, Werkstatt ..."
          autoFocus
          style={{
            width: '100%', background: '#2a3942',
            border: '1px solid #3b4a54', borderRadius: '8px',
            padding: '10px 12px', color: '#e9edef', fontSize: '14px',
            outline: 'none', marginBottom: '16px', boxSizing: 'border-box',
          }}
        />

        <label style={{ color: '#8696a0', fontSize: '12px', display: 'block', marginBottom: '8px' }}>
          Farbe
        </label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {COLORS.map((c) => (
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
              background: name.trim() ? '#25d366' : '#1a5c36',
              color: name.trim() ? '#fff' : '#8696a0',
              cursor: name.trim() ? 'pointer' : 'not-allowed',
              fontSize: '14px', fontWeight: '600',
            }}
          >
            Hinzufuegen
          </button>
        </div>
      </div>
    </div>
  )
}
