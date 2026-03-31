# PROMPT-03 — React UI (Sidebar + Account Switcher)
# WhatsApp MultiBox
# Arbeite autonom. Stoppe NUR bei Fehler.

## Kontext
Lies: `docs/SPEC.md`, `docs/PROGRESS.md`
Voraussetzung: PROMPT-02 ✅

## Ziel
Vollständige React UI: Sidebar, Account-Items mit Badge,
Add-Account-Modal, Window Controls.

---

## src/renderer/src/store/accountStore.ts — VOLLSTÄNDIG ERSETZEN

```typescript
import { create } from 'zustand'

export interface Account {
  id: string
  name: string
  color: string
  order: number
}

interface AccountStore {
  accounts:     Account[]
  activeId:     string | null
  badges:       Record<string, number>
  setAccounts:  (accounts: Account[]) => void
  setActiveId:  (id: string | null) => void
  setBadge:     (id: string, count: number) => void
  addAccount:   (account: Account) => void
  removeAccount:(id: string) => void
}

export const useAccountStore = create<AccountStore>((set) => ({
  accounts:  [],
  activeId:  null,
  badges:    {},

  setAccounts:   (accounts) => set({ accounts }),
  setActiveId:   (id)       => set({ activeId: id }),
  setBadge:      (id, count)=> set((s) => ({ badges: { ...s.badges, [id]: count } })),
  addAccount:    (account)  => set((s) => ({ accounts: [...s.accounts, account] })),
  removeAccount: (id)       => set((s) => ({ accounts: s.accounts.filter(a => a.id !== id) })),
}))
```

---

## src/renderer/src/components/AccountItem.tsx — NEU ERSTELLEN

```typescript
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
```

---

## src/renderer/src/components/AddAccountModal.tsx — NEU ERSTELLEN

```typescript
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
          Account hinzufügen
        </h3>

        <label style={{ color: '#8696a0', fontSize: '12px', display: 'block', marginBottom: '6px' }}>
          Name / Bezeichnung
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
          placeholder="Privat, Büro, Werkstatt …"
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
            Hinzufügen
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## src/renderer/src/components/Sidebar.tsx — NEU ERSTELLEN

```typescript
import React, { useState } from 'react'
import { AccountItem }     from './AccountItem'
import { AddAccountModal } from './AddAccountModal'
import { useAccountStore } from '../store/accountStore'

// Typen für window.electronAPI (vom Preload bereitgestellt)
declare global {
  interface Window {
    electronAPI: {
      addAccount:       (a: { id: string; name: string; color: string }) => Promise<{ success: boolean }>
      removeAccount:    (id: string) => Promise<{ success: boolean; switchTo?: string | null }>
      switchAccount:    (id: string) => Promise<{ success: boolean }>
      getAccounts:      () => Promise<Array<{ id: string; name: string; color: string; order: number }>>
      onBadgeUpdate:    (cb: (d: { id: string; count: number }) => void) => () => void
      onSwitchFromTray: (cb: (d: { id: string }) => void) => () => void
      minimizeWindow:   () => void
      closeWindow:      () => void
      platform:         string
    }
  }
}

export function Sidebar() {
  const { accounts, activeId, badges, setActiveId, addAccount, removeAccount, setBadge } =
    useAccountStore()
  const [showModal, setShowModal] = useState(false)
  const isMac = window.electronAPI?.platform === 'darwin'

  const handleSwitch = async (id: string) => {
    await window.electronAPI.switchAccount(id)
    setActiveId(id)
  }

  const handleAdd = async (name: string, color: string) => {
    const id     = `wa-${Date.now()}`
    const result = await window.electronAPI.addAccount({ id, name, color })
    if (result?.success) {
      addAccount({ id, name, color, order: accounts.length })
      setActiveId(id)
    }
  }

  const handleRemove = async (id: string) => {
    const result = await window.electronAPI.removeAccount(id)
    removeAccount(id)
    if (result?.switchTo) setActiveId(result.switchTo)
    else if (result?.switchTo === null) setActiveId(null)
  }

  return (
    <>
      <div
        style={{
          width: '72px', height: '100vh',
          background: '#111b21',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '12px 0',
          borderRight: '1px solid #1f2c34',
          position: 'fixed', left: 0, top: 0, zIndex: 100,
          // Sidebar ist draggable (Fenster verschieben)
          WebkitAppRegion: 'drag',
        } as React.CSSProperties}
      >
        {/* Windows: eigene Window Controls (kein nativer Frame) */}
        {!isMac && (
          <div style={{
            display: 'flex', flexDirection: 'column', gap: '6px',
            marginBottom: '16px',
            WebkitAppRegion: 'no-drag',
          } as React.CSSProperties}>
            <div
              onClick={() => window.electronAPI.closeWindow()}
              style={{
                width: '12px', height: '12px', borderRadius: '50%',
                background: '#ff5f57', cursor: 'pointer',
              }}
              title="Schließen"
            />
            <div
              onClick={() => window.electronAPI.minimizeWindow()}
              style={{
                width: '12px', height: '12px', borderRadius: '50%',
                background: '#ffbd2e', cursor: 'pointer',
              }}
              title="Minimieren"
            />
          </div>
        )}

        {/* Mac: Spacer damit Traffic Lights (hiddenInset) genug Platz haben */}
        {isMac && <div style={{ height: '32px' }} />}

        {/* Account Liste */}
        <div style={{
          flex: 1, width: '100%',
          overflowY: 'auto', padding: '0 4px',
          WebkitAppRegion: 'no-drag',
        } as React.CSSProperties}>
          {[...accounts]
            .sort((a, b) => a.order - b.order)
            .map((account) => (
              <AccountItem
                key={account.id}
                {...account}
                isActive={activeId === account.id}
                badge={badges[account.id] ?? 0}
                onClick={() => handleSwitch(account.id)}
                onRemove={() => handleRemove(account.id)}
              />
            ))}
        </div>

        {/* Account hinzufügen */}
        <div
          onClick={() => setShowModal(true)}
          style={{
            width: '44px', height: '44px', borderRadius: '50%',
            background: '#2a3942',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: '24px', color: '#8696a0',
            marginTop: '8px', transition: 'background 0.2s',
            WebkitAppRegion: 'no-drag',
          } as React.CSSProperties}
          title="WhatsApp Account hinzufügen"
        >
          +
        </div>
      </div>

      {showModal && (
        <AddAccountModal
          onAdd={handleAdd}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
```

---

## src/renderer/src/App.tsx — VOLLSTÄNDIG ERSETZEN

```typescript
import React, { useEffect } from 'react'
import { Sidebar }         from './components/Sidebar'
import { useAccountStore } from './store/accountStore'

export function App() {
  const { setAccounts, setActiveId, setBadge } = useAccountStore()

  useEffect(() => {
    // Gespeicherte Accounts laden
    window.electronAPI.getAccounts().then((accounts) => {
      if (accounts?.length) {
        setAccounts(accounts)
        setActiveId(accounts[0].id)
      }
    })

    // Badge-Updates vom Main Process empfangen
    const cleanBadge = window.electronAPI.onBadgeUpdate(({ id, count }) => {
      setBadge(id, count)
    })

    // Tray-Account-Switch empfangen
    const cleanTray = window.electronAPI.onSwitchFromTray(({ id }) => {
      window.electronAPI.switchAccount(id)
      setActiveId(id)
    })

    return () => { cleanBadge(); cleanTray() }
  }, [])

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      {/* WebView-Bereich — wird von Electron Main per BrowserView befüllt */}
      <div style={{ marginLeft: '72px', flex: 1, background: '#222e35' }} />
    </div>
  )
}
```

---

## src/renderer/src/main.tsx — VOLLSTÄNDIG ERSETZEN

```typescript
import React    from 'react'
import ReactDOM from 'react-dom/client'
import { App }  from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

---

## Smoke Test

```bash
npm run typecheck
```

0 Fehler in beiden tsconfigs. Bei Fehlern: fixen, retry.

---

## Git Commit

```bash
git add -A
git commit -m "feat: React UI — Sidebar, AccountItem, Modal (PROMPT-03)"
```

---

## PROGRESS.md updaten

`PROMPT-03: React UI` → ✅

---

## Abschluss

```powershell
[System.Media.SystemSounds]::Beep.Play()
Add-Type -AssemblyName PresentationFramework
[System.Windows.MessageBox]::Show('PROMPT-03 fertig — UI ✅', 'MrT', 'OK', 'Information')
```
