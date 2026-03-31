# PROMPT-11 — Drag & Drop + Custom Image Upload + Instagram
# Messenger MultiBox
# Arbeite autonom. Stoppe NUR bei Fehler.

## Kontext
Lies: docs/PROGRESS.md
Voraussetzung: PROMPT-09 abgeschlossen.

## Ziel
1. Drag & Drop Reihenfolge der Sidebar-Icons (mit persistenter Speicherung)
2. Eigenes Bild als Account-Icon hochladen (max 512px, base64 in accounts.json)
3. Instagram Direct als neuer Service

---

## TEIL 1 — Instagram zu services.ts hinzufügen

### src/main/services.ts — neuen Eintrag ergänzen

Im SERVICES Array nach dem letzten Eintrag hinzufügen:
```typescript
  {
    id: 'instagram',
    name: 'Instagram',
    url: 'https://www.instagram.com/direct/inbox/',
    color: '#E1306C',
    emoji: '📸',
  },
```

Instagram braucht denselben Chrome User-Agent wie WhatsApp.
In sessionManager.ts die UA-Bedingung anpassen:

ALT:
```typescript
if (account.serviceId.startsWith('whatsapp')) {
```

NEU:
```typescript
if (account.serviceId.startsWith('whatsapp') || account.serviceId === 'instagram') {
```

---

## TEIL 2 — Account Interface um customImage erweitern

### src/renderer/src/store/accountStore.ts

Account Interface ergänzen:
```typescript
export interface Account {
  id:           string
  name:         string
  color:        string
  order:        number
  serviceId:    string
  url:          string
  emoji?:       string
  customImage?: string   // NEU: base64 Data-URL, z.B. "data:image/png;base64,..."
}
```

Store um `reorderAccounts` ergänzen:
```typescript
interface AccountStore {
  // ... bestehende Felder ...
  reorderAccounts: (fromIndex: number, toIndex: number) => void
}

// In create():
reorderAccounts: (fromIndex, toIndex) =>
  set(s => {
    const arr = [...s.accounts].sort((a, b) => a.order - b.order)
    const [moved] = arr.splice(fromIndex, 1)
    arr.splice(toIndex, 0, moved)
    const reordered = arr.map((a, i) => ({ ...a, order: i }))
    return { accounts: reordered }
  }),
```

---

## TEIL 3 — IPC: Reihenfolge speichern + Image hochladen

### src/main/ipcHandlers.ts — neue Handler

```typescript
// Reihenfolge persistieren
ipcMain.handle('account:reorder', (_event, { orderedIds }: { orderedIds: string[] }) => {
  let accounts = loadAccounts()
  accounts = accounts.map(a => ({
    ...a,
    order: orderedIds.indexOf(a.id),
  }))
  saveAccounts(accounts)
  return { success: true }
})

// Custom Image: base64 in account speichern
ipcMain.handle('account:setImage', (_event, { id, imageBase64 }: { id: string; imageBase64: string }) => {
  let accounts = loadAccounts()
  accounts = accounts.map(a => a.id === id ? { ...a, customImage: imageBase64 } : a)
  saveAccounts(accounts)
  return { success: true }
})

// Image entfernen
ipcMain.handle('account:removeImage', (_event, { id }: { id: string }) => {
  let accounts = loadAccounts()
  accounts = accounts.map(a => a.id === id ? { ...a, customImage: undefined } : a)
  saveAccounts(accounts)
  return { success: true }
})
```

### src/preload/index.ts — neue Exports

```typescript
reorderAccounts: (orderedIds: string[]) =>
  ipcRenderer.invoke('account:reorder', { orderedIds }),
setAccountImage: (id: string, imageBase64: string) =>
  ipcRenderer.invoke('account:setImage', { id, imageBase64 }),
removeAccountImage: (id: string) =>
  ipcRenderer.invoke('account:removeImage', { id }),
```

---

## TEIL 4 — Bild-Upload Utility

### src/renderer/src/utils/imageUtils.ts — NEU ERSTELLEN

Erstelle Ordner `src/renderer/src/utils/` falls nicht vorhanden.

```typescript
/**
 * Liest eine Bilddatei, skaliert sie auf max 512px,
 * und gibt eine base64 Data-URL zurück.
 */
export async function processImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      const img = new Image()
      img.onload = () => {
        const MAX = 512
        let { width, height } = img

        // Skalieren wenn nötig
        if (width > MAX || height > MAX) {
          const ratio = Math.min(MAX / width, MAX / height)
          width  = Math.round(width  * ratio)
          height = Math.round(height * ratio)
        }

        const canvas = document.createElement('canvas')
        canvas.width  = width
        canvas.height = height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)

        // PNG ausgeben (verlustfrei, gut für Icons)
        resolve(canvas.toDataURL('image/png', 1.0))
      }
      img.onerror = () => reject(new Error('Bild konnte nicht geladen werden'))
      img.src = dataUrl
    }
    reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'))
    reader.readAsDataURL(file)
  })
}
```

---

## TEIL 5 — EditAccountModal: Image Upload einbauen

### src/renderer/src/components/EditAccountModal.tsx — VOLLSTÄNDIG ERSETZEN

```typescript
import React, { useState, useRef } from 'react'
import { processImageFile } from '../utils/imageUtils'

const EMOJI_GALLERY = [
  '👤','👔','🏠','🔧','🚗','💼','👨‍💻','👩‍💼',
  '💬','📱','📞','📧','💌','🔔','📢','💡',
  '🏢','🏪','🏭','🔑','💰','📊','✅','⭐',
  '🎯','🎮','🎵','🍕','☕','✈️','🌍','❤️',
  '🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪',
  '🌟','🔥','⚡','🎁','🛠️','📌','🔒','🌈',
]

const COLORS = [
  '#25d366','#128c7e','#075e54',
  '#34b7f1','#0063cb','#7c3aed',
  '#dc2626','#ea580c','#ca8a04',
  '#6b7280','#0f172a','#be185d',
]

interface Account {
  id:          string
  name:        string
  color:       string
  emoji?:      string
  customImage?: string
  serviceId:   string
}

interface Props {
  account: Account
  onSave:  (id: string, name: string, color: string, emoji: string, customImage?: string) => void
  onClose: () => void
}

export function EditAccountModal({ account, onSave, onClose }: Props) {
  const [name,        setName]        = useState(account.name)
  const [color,       setColor]       = useState(account.color)
  const [emoji,       setEmoji]       = useState(account.emoji || '')
  const [customImage, setCustomImage] = useState<string | undefined>(account.customImage)
  const [uploading,   setUploading]   = useState(false)
  const [error,       setError]       = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const submit = () => {
    if (!name.trim()) return
    onSave(account.id, name.trim(), color, emoji, customImage)
    onClose()
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Dateityp prüfen
    if (!file.type.startsWith('image/')) {
      setError('Nur Bilddateien erlaubt (PNG, JPG, GIF, WebP)')
      return
    }

    setError('')
    setUploading(true)
    try {
      const base64 = await processImageFile(file)
      setCustomImage(base64)
      setEmoji('')  // Emoji deaktivieren wenn Custom Image gesetzt
    } catch (err) {
      setError('Bild konnte nicht verarbeitet werden')
    } finally {
      setUploading(false)
    }
  }

  const removeCustomImage = () => {
    setCustomImage(undefined)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Vorschau bestimmen
  const hasImage = !!customImage
  const hasEmoji = !!emoji && !hasImage
  const preview  = hasImage ? null : (emoji || name.slice(0, 2).toUpperCase())

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
        {/* Header mit Live-Vorschau */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: color, overflow: 'hidden', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: hasEmoji ? '26px' : '18px',
            fontWeight: '700', color: '#fff',
            boxShadow: `0 0 0 3px ${color}44`,
          }}>
            {hasImage
              ? <img src={customImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : preview
            }
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
          Hintergrundfarbe
        </label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {COLORS.map(c => (
            <div key={c} onClick={() => setColor(c)} style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: c, cursor: 'pointer',
              boxShadow: color === c ? `0 0 0 3px #fff, 0 0 0 5px ${c}` : 'none',
              transition: 'box-shadow 0.15s',
            }} />
          ))}
        </div>

        {/* Custom Image Upload */}
        <label style={{ color: '#8696a0', fontSize: '12px', display: 'block', marginBottom: '8px' }}>
          Eigenes Bild (max 512px)
          {customImage && (
            <span
              onClick={removeCustomImage}
              style={{ marginLeft: '8px', color: '#ff6b6b', cursor: 'pointer', fontSize: '11px' }}
            >
              Entfernen
            </span>
          )}
        </label>
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: '100%', padding: '12px',
            background: '#2a3942', border: `1px dashed ${customImage ? '#25d366' : '#3b4a54'}`,
            borderRadius: '8px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '10px',
            marginBottom: '16px', transition: 'border-color 0.15s',
          }}
        >
          {customImage ? (
            <>
              <img src={customImage} style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }} />
              <span style={{ color: '#25d366', fontSize: '13px' }}>Bild hochgeladen — klicken zum Ändern</span>
            </>
          ) : (
            <>
              <span style={{ fontSize: '20px' }}>🖼️</span>
              <span style={{ color: '#8696a0', fontSize: '13px' }}>
                {uploading ? 'Wird verarbeitet...' : 'PNG, JPG, GIF, WebP — klicken zum Auswählen'}
              </span>
            </>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        {error && (
          <div style={{ color: '#ff6b6b', fontSize: '12px', marginBottom: '12px' }}>
            {error}
          </div>
        )}

        {/* Emoji Galerie — deaktiviert wenn Custom Image aktiv */}
        <label style={{
          color: customImage ? '#4a5568' : '#8696a0',
          fontSize: '12px', display: 'block', marginBottom: '8px',
        }}>
          Oder Emoji wählen {customImage ? '(deaktiviert — Bild aktiv)' : ''}
          {emoji && !customImage && (
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
          opacity: customImage ? 0.4 : 1,
          pointerEvents: customImage ? 'none' : 'auto',
        }}>
          {EMOJI_GALLERY.map(e => (
            <div key={e} onClick={() => !customImage && setEmoji(e === emoji ? '' : e)} style={{
              width: '36px', height: '36px', borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', cursor: customImage ? 'default' : 'pointer',
              background: emoji === e && !customImage ? `${color}44` : 'transparent',
              border: emoji === e && !customImage ? `2px solid ${color}` : '2px solid transparent',
              transition: 'all 0.1s',
            }}>
              {e}
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '8px 16px', borderRadius: '8px', border: 'none',
            background: '#2a3942', color: '#8696a0', cursor: 'pointer', fontSize: '14px',
          }}>
            Abbrechen
          </button>
          <button onClick={submit} disabled={!name.trim()} style={{
            padding: '8px 16px', borderRadius: '8px', border: 'none',
            background: name.trim() ? color : '#1a3a2a',
            color: name.trim() ? '#fff' : '#8696a0',
            cursor: name.trim() ? 'pointer' : 'not-allowed',
            fontSize: '14px', fontWeight: '600',
          }}>
            Speichern
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## TEIL 6 — AccountItem: Custom Image anzeigen

### src/renderer/src/components/AccountItem.tsx

Props und Avatar-Anzeige anpassen:

```typescript
interface Props {
  id:           string
  name:         string
  color:        string
  emoji?:       string
  customImage?: string  // NEU
  isActive:     boolean
  badge:        number
  status?:      string
  onClick:      () => void
  onRemove:     () => void
  onEdit:       () => void
}
```

Im Avatar-Div:
```typescript
// ALT: zeigt nur Emoji oder Initialen
// NEU: Custom Image hat höchste Priorität
const hasImage = !!customImage
const display  = hasImage ? null : (emoji || name.slice(0, 2).toUpperCase())
const isEmoji  = !hasImage && !!emoji

// Avatar Div:
<div style={{
  width: '44px', height: '44px',
  borderRadius: isActive ? '14px' : '50%',
  background: color, overflow: 'hidden',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: isEmoji ? '22px' : '14px',
  fontWeight: '700', color: '#fff',
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
```

---

## TEIL 7 — Drag & Drop Reihenfolge

### src/renderer/src/components/Sidebar.tsx — DnD einbauen

Das Drag & Drop wird nativ mit HTML5 Drag API implementiert (keine zusätzliche Library nötig).

State ergänzen:
```typescript
const [dragIndex, setDragIndex] = useState<number | null>(null)
const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
```

`reorderAccounts` aus Store importieren:
```typescript
const { accounts, activeId, badges, statuses, setActiveId,
        addAccount, removeAccount, setBadge, updateAccount,
        reorderAccounts } = useAccountStore()
```

Reorder-Handler:
```typescript
const handleDragStart = (index: number) => {
  setDragIndex(index)
}

const handleDragOver = (e: React.DragEvent, index: number) => {
  e.preventDefault()
  setDragOverIndex(index)
}

const handleDrop = async (index: number) => {
  if (dragIndex === null || dragIndex === index) {
    setDragIndex(null)
    setDragOverIndex(null)
    return
  }
  reorderAccounts(dragIndex, index)

  // Neue Reihenfolge persistieren
  const sorted = [...accounts]
    .sort((a, b) => a.order - b.order)
  const reordered = sorted.map((_, i) =>
    i === index ? sorted[dragIndex] : (i === dragIndex ? sorted[index] : sorted[i])
  )
  await window.electronAPI.reorderAccounts(reordered.map(a => a.id))

  setDragIndex(null)
  setDragOverIndex(null)
}

const handleDragEnd = () => {
  setDragIndex(null)
  setDragOverIndex(null)
}
```

AccountItem mit Drag-Props rendern:
```typescript
{[...accounts]
  .sort((a, b) => a.order - b.order)
  .map((account, index) => (
    <div
      key={account.id}
      draggable
      onDragStart={() => handleDragStart(index)}
      onDragOver={e => handleDragOver(e, index)}
      onDrop={() => handleDrop(index)}
      onDragEnd={handleDragEnd}
      style={{
        opacity: dragIndex === index ? 0.4 : 1,
        transform: dragOverIndex === index && dragIndex !== index
          ? 'translateY(4px) scale(1.05)'
          : 'none',
        transition: 'opacity 0.15s, transform 0.15s',
        cursor: 'grab',
      }}
    >
      <AccountItem
        {...account}
        isActive={activeId === account.id}
        badge={badges[account.id] ?? 0}
        status={statuses?.[account.id]}
        onClick={() => handleSwitch(account.id)}
        onRemove={() => handleRemove(account.id)}
        onEdit={() => setEditAccount(account)}
      />
    </div>
  ))
}
```

---

## TEIL 8 — Sidebar: handleEdit mit customImage

```typescript
const handleEdit = async (
  id: string,
  name: string,
  color: string,
  emoji: string,
  customImage?: string
) => {
  const changes: Partial<Account> = { name, color, emoji, customImage }
  await window.electronAPI.updateAccount(id, changes)

  // Custom Image separat persistieren (kann groß sein)
  if (customImage !== undefined) {
    await window.electronAPI.setAccountImage(id, customImage)
  }

  updateAccount(id, changes)
}
```

---

## TEIL 9 — Smoke Test

```bash
npm run typecheck
```

0 Fehler. Bei Fehlern: fixen.

```bash
npm run dev
```

Prüfen:
- [ ] Instagram erscheint in der Service-Auswahl beim + Button
- [ ] Instagram Direct öffnet sich korrekt (inbox)
- [ ] Bearbeiten-Modal: Upload-Bereich erscheint
- [ ] Bild auswählen → wird auf 512px skaliert → erscheint als Preview
- [ ] Avatar in Sidebar zeigt das eigene Bild
- [ ] Emoji-Galerie ist grau wenn Custom Image aktiv
- [ ] Custom Image bleibt nach App-Neustart erhalten
- [ ] Drag auf Account-Icon → beim Loslassen neue Reihenfolge
- [ ] Reihenfolge bleibt nach App-Neustart erhalten

---

## Git Commit

```bash
git add -A
git commit -m "feat: drag-drop reorder + custom image upload + instagram (PROMPT-11)"
```

## PROGRESS.md updaten

PROMPT-11: Drag & Drop + Custom Image + Instagram -> DONE

## Abschluss

```powershell
[System.Media.SystemSounds]::Beep.Play()
Add-Type -AssemblyName PresentationFramework
[System.Windows.MessageBox]::Show('PROMPT-11 fertig - DnD + Bild-Upload + Instagram!', 'MrT', 'OK', 'Information')
```
