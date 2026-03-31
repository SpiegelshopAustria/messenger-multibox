import React, { useState, useEffect } from 'react'
import { useModal } from '../hooks/useModal'

interface Service {
  id: string
  name: string
  url: string
  color: string
  emoji: string
}

interface Props {
  onAdd:   (name: string, color: string, serviceId: string, url: string) => void
  onClose: () => void
}

export function AddAccountModal({ onAdd, onClose }: Props) {
  useModal()
  const [services,   setServices]   = useState<Service[]>([])
  const [serviceId,  setServiceId]  = useState('')
  const [name,       setName]       = useState('')
  const [color,      setColor]      = useState('#25d366')

  useEffect(() => {
    window.electronAPI.getServices().then((list: Service[]) => {
      setServices(list)
      if (list.length > 0) {
        setServiceId(list[0].id)
        setColor(list[0].color)
        setName(list[0].name)
      }
    })
  }, [])

  const selectedService = services.find(s => s.id === serviceId)

  const handleServiceSelect = (s: Service) => {
    setServiceId(s.id)
    setColor(s.color)
    setName(s.name)
  }

  const submit = () => {
    if (!name.trim() || !serviceId || !selectedService) return
    onAdd(name.trim(), color, serviceId, selectedService.url)
    onClose()
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
          padding: '24px', width: '360px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ color: '#e9edef', marginBottom: '20px', fontSize: '16px', fontWeight: '600' }}>
          Account hinzufuegen
        </h3>

        {/* Service Auswahl */}
        <label style={{ color: '#8696a0', fontSize: '12px', display: 'block', marginBottom: '8px' }}>
          Messenger waehlen
        </label>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px', marginBottom: '20px',
        }}>
          {services.map((s) => (
            <div
              key={s.id}
              onClick={() => handleServiceSelect(s)}
              title={s.name}
              style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '10px 4px', borderRadius: '10px',
                background: serviceId === s.id ? s.color + '33' : '#2a3942',
                border: serviceId === s.id ? `2px solid ${s.color}` : '2px solid transparent',
                cursor: 'pointer', transition: 'all 0.15s',
                fontSize: '20px',
              }}
            >
              <span>{s.emoji}</span>
              <span style={{
                fontSize: '9px', color: '#8696a0',
                marginTop: '4px', textAlign: 'center',
                lineHeight: '1.2',
              }}>
                {s.name.replace(' Business', '\nBiz')}
              </span>
            </div>
          ))}
        </div>

        {/* Name */}
        <label style={{ color: '#8696a0', fontSize: '12px', display: 'block', marginBottom: '6px' }}>
          Bezeichnung
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
          placeholder="z.B. Privat, Buero, Werkstatt ..."
          autoFocus
          style={{
            width: '100%', background: '#2a3942',
            border: '1px solid #3b4a54', borderRadius: '8px',
            padding: '10px 12px', color: '#e9edef', fontSize: '14px',
            outline: 'none', marginBottom: '20px', boxSizing: 'border-box',
          }}
        />

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
              background: name.trim() && selectedService ? selectedService.color : '#1a3a2a',
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
