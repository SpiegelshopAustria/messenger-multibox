# PROMPT-07 — Rechtsklick Kontextmenü + Account bearbeiten
# WhatsApp MultiBox
# Arbeite autonom. Stoppe NUR bei Fehler.

## Kontext
Lies: docs/PROGRESS.md
Voraussetzung: PROMPT-06 abgeschlossen.

## Ziel
Rechtsklick auf Account-Avatar öffnet ein Kontextmenü mit:
  - Bearbeiten (Name + Emoji/Icon aus Galerie)
  - Trennlinie
  - Entfernen

Das Edit-Modal erlaubt:
  - Name ändern
  - Emoji aus vordefinierter Galerie wählen (kein Datei-Upload nötig,
    Emojis sind universell, funktionieren auf Windows + Mac)
  - Farbe ändern

---

## Teil 1 — ContextMenu Komponente

### src/renderer/src/components/ContextMenu.tsx — NEU ERSTELLEN

```typescript
import React, { useEffect, useRef } from 'react'

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
  const ref = useRef<HTMLDivElement>(null)

  // Klick außerhalb schließt Menü
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    // Kurze Verzögerung damit der auslösende Klick nicht sofort schließt
    const timer = setTimeout(() => document.addEventListener('mousedown', handler), 50)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handler)
    }
  }, [onClose])

  // Viewport-Grenzen berücksichtigen
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
```

---

## Teil 2 — EditAccountModal Komponente

### src/renderer/src/components/EditAccountModal.tsx — NEU ERSTELLEN

```typescript
import React, { useState } from 'react'

// Emoji-Galerie — universell auf Windows + Mac
const EMOJI_GALLERY = [
  // Personen / Arbeit
  '👤','👔','🏠','🔧','🚗','💼','👨‍💻','👩‍💼',
  // Kommunikation
  '💬','📱','📞','📧','💌','🔔','📢','💡',
  // Business
  '🏢','🏪','🏭','🔑','💰','📊','✅','⭐',
  // Freizeit
  '🎯','🎮','🎵','🍕','☕','✈️','🌍','❤️',
  // Symbole
  '🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪',
  // Weitere
  '🌟','🔥','⚡','🎁','🛠️','📌','🔒','🌈',
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
  const [name,  setName]  = useState(account.name)
  const [color, setColor] = useState(account.color)
  const [emoji, setEmoji] = useState(account.emoji || '')

  const submit = () => {
    if (!name.trim()) return
    onSave(account.id, name.trim(), color, emoji)
    onClose()
  }

  // Vorschau: Emoji falls gesetzt, sonst Initialen
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
```

---

## Teil 3 — Account Interface um emoji erweitern

### src/renderer/src/store/accountStore.ts

Account Interface ergänzen:
```typescript
export interface Account {
  id:        string
  name:      string
  color:     string
  order:     number
  serviceId: string
  url:       string
  emoji?:    string   // NEU
}
```

Store um `updateAccount` ergänzen:
```typescript
interface AccountStore {
  // ... bestehende Felder ...
  updateAccount: (id: string, changes: Partial<Account>) => void  // NEU
}

// In create():
updateAccount: (id, changes) =>
  set(s => ({
    accounts: s.accounts.map(a => a.id === id ? { ...a, ...changes } : a)
  })),
```

---

## Teil 4 — IPC: Account updaten

### src/main/ipcHandlers.ts

Neuen Handler hinzufügen:
```typescript
ipcMain.handle('account:update', (_event, { id, changes }: { id: string; changes: Partial<Account> }) => {
  let accounts = loadAccounts()
  accounts = accounts.map(a => a.id === id ? { ...a, ...changes } : a)
  saveAccounts(accounts)
  return { success: true }
})
```

### src/preload/index.ts

Im exposeInMainWorld ergänzen:
```typescript
updateAccount: (id: string, changes: Record<string, unknown>) =>
  ipcRenderer.invoke('account:update', { id, changes }),
```

---

## Teil 5 — AccountItem: Rechtsklick Kontextmenü

### src/renderer/src/components/AccountItem.tsx — VOLLSTÄNDIG ERSETZEN

```typescript
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
      icon:    '✏️',
      onClick: onEdit,
    },
    { divider: true, label: '', onClick: () => {} },
    {
      label:   'Entfernen',
      icon:    '🗑️',
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

      {/* Kontextmenü */}
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
```

---

## Teil 6 — Sidebar: Edit-Handler + Modal einbinden

### src/renderer/src/components/Sidebar.tsx

Imports ergänzen:
```typescript
import { EditAccountModal } from './EditAccountModal'
```

State ergänzen:
```typescript
const [editAccount, setEditAccount] = useState<Account | null>(null)
```

Handler ergänzen:
```typescript
const handleEdit = async (id: string, name: string, color: string, emoji: string) => {
  const changes = { name, color, emoji }
  await window.electronAPI.updateAccount(id, changes)
  updateAccount(id, changes)
}
```

In der Account-Liste `onEdit` prop übergeben:
```typescript
<AccountItem
  key={account.id}
  {...account}
  isActive={activeId === account.id}
  badge={badges[account.id] ?? 0}
  onClick={() => handleSwitch(account.id)}
  onRemove={() => handleRemove(account.id)}
  onEdit={() => setEditAccount(account)}   // NEU
/>
```

Modal am Ende der Sidebar-Komponente ergänzen (nach AddAccountModal):
```typescript
{editAccount && (
  <EditAccountModal
    account={editAccount}
    onSave={handleEdit}
    onClose={() => setEditAccount(null)}
  />
)}
```

`updateAccount` aus Store importieren:
```typescript
const { accounts, activeId, badges, setActiveId, addAccount,
        removeAccount, setBadge, updateAccount } = useAccountStore()
```

---

## Teil 7 — Smoke Tests

```bash
npm run typecheck
```

0 Fehler. Bei Fehlern: fixen.

```bash
npm run dev
```

Prüfen:
- [ ] Rechtsklick auf Account öffnet Kontextmenü (Bearbeiten / Entfernen)
- [ ] Bearbeiten öffnet Modal mit Name, Farbe, Emoji-Galerie
- [ ] Vorschau-Avatar aktualisiert sich live beim Auswählen
- [ ] Speichern aktualisiert den Account in der Sidebar sofort
- [ ] Emoji wird im Avatar angezeigt (ersetzt Initialen)
- [ ] Entfernen aus Kontextmenü funktioniert
- [ ] Klick außerhalb Kontextmenü schließt es

---

## Git Commit

```bash
git add -A
git commit -m "feat: context menu + edit modal with emoji gallery (PROMPT-07)"
```

## PROGRESS.md updaten

PROMPT-07: Kontextmenü + Account bearbeiten + Emoji-Galerie -> DONE

## Abschluss

```powershell
[System.Media.SystemSounds]::Beep.Play()
Add-Type -AssemblyName PresentationFramework
[System.Windows.MessageBox]::Show('PROMPT-07 fertig - Kontextmenue + Edit Modal!', 'MrT', 'OK', 'Information')
```
