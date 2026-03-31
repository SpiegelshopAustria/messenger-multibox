import React, { useState, useEffect } from 'react'

interface Props {
  onClose: () => void
}

export function SettingsPanel({ onClose }: Props) {
  const [autoStart, setAutoStartState] = useState(false)
  const [loading,   setLoading]        = useState(true)

  useEffect(() => {
    window.electronAPI.getAutoStart().then((val: boolean) => {
      setAutoStartState(val)
      setLoading(false)
    })
  }, [])

  const toggleAutoStart = async () => {
    const newVal = !autoStart
    await window.electronAPI.setAutoStart(newVal)
    setAutoStartState(newVal)
  }

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
          padding: '28px', width: '360px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ color: '#e9edef', fontSize: '16px', fontWeight: '600', margin: 0 }}>
            Einstellungen
          </h3>
          <div
            onClick={onClose}
            style={{ color: '#8696a0', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}
          >
            {'\u2715'}
          </div>
        </div>

        {/* Auto-Start */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px', background: '#2a3942', borderRadius: '10px',
          marginBottom: '12px',
        }}>
          <div>
            <div style={{ color: '#e9edef', fontSize: '14px', fontWeight: '500' }}>
              Autostart
            </div>
            <div style={{ color: '#8696a0', fontSize: '12px', marginTop: '2px' }}>
              App beim Systemstart starten
            </div>
          </div>
          <div
            onClick={!loading ? toggleAutoStart : undefined}
            style={{
              width: '44px', height: '24px',
              borderRadius: '12px',
              background: autoStart ? '#25d366' : '#3b4a54',
              cursor: loading ? 'default' : 'pointer',
              position: 'relative',
              transition: 'background 0.2s',
              flexShrink: 0,
            }}
          >
            <div style={{
              position: 'absolute',
              top: '2px',
              left: autoStart ? '22px' : '2px',
              width: '20px', height: '20px',
              borderRadius: '50%',
              background: '#fff',
              transition: 'left 0.2s',
              boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
            }} />
          </div>
        </div>

        {/* Keyboard Shortcuts Info */}
        <div style={{
          padding: '16px', background: '#2a3942', borderRadius: '10px',
        }}>
          <div style={{ color: '#e9edef', fontSize: '14px', fontWeight: '500', marginBottom: '12px' }}>
            Tastenkuerzel
          </div>
          {[
            ['Ctrl + 1-9', 'Account wechseln'],
            ['Ctrl + W',   'In Tray minimieren'],
            ['Ctrl + Shift + M', 'App ein/ausblenden'],
          ].map(([key, desc]) => (
            <div key={key} style={{
              display: 'flex', justifyContent: 'space-between',
              marginBottom: '8px',
            }}>
              <span style={{
                background: '#1f2c34', color: '#e9edef',
                padding: '2px 8px', borderRadius: '4px',
                fontSize: '12px', fontFamily: 'monospace',
              }}>
                {key}
              </span>
              <span style={{ color: '#8696a0', fontSize: '12px' }}>
                {desc}
              </span>
            </div>
          ))}
        </div>

        {/* Version */}
        <div style={{ color: '#8696a0', fontSize: '11px', textAlign: 'center', marginTop: '16px' }}>
          Messenger MultiBox v1.0.0
        </div>
      </div>
    </div>
  )
}
