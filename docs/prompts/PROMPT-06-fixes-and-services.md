# PROMPT-06 — Fixes + Multi-Service Support
# WhatsApp MultiBox → Messenger MultiBox
# Arbeite autonom. Stoppe NUR bei Fehler.

## Kontext
Lies: docs/SPEC.md, docs/PROGRESS.md
Voraussetzung: PROMPT-01 bis PROMPT-05 abgeschlossen.

## Ziel
1. + Button Fix (zweiter Account lässt sich nicht hinzufügen)
2. Service-Auswahl beim Hinzufügen (WA, WA Business, Telegram, etc.)
3. Window Management Fix (Fenster verschieben, maximieren, resizen)
4. Titelleiste mit echten Window Controls

---

## Teil 1 — Service-Definitionen

Erstelle `src/main/services.ts` — NEU:

```typescript
export interface MessengerService {
  id: string
  name: string
  url: string
  color: string
  emoji: string
}

export const SERVICES: MessengerService[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    url: 'https://web.whatsapp.com',
    color: '#25d366',
    emoji: '💬',
  },
  {
    id: 'whatsapp-business',
    name: 'WhatsApp Business',
    url: 'https://web.whatsapp.com',
    color: '#128c7e',
    emoji: '🏢',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    url: 'https://web.telegram.org/a/',
    color: '#2AABEE',
    emoji: '✈️',
  },
  {
    id: 'signal',
    name: 'Signal',
    url: 'https://app.signal.org',
    color: '#3A76F0',
    emoji: '🔒',
  },
  {
    id: 'messenger',
    name: 'Messenger',
    url: 'https://www.messenger.com',
    color: '#0099FF',
    emoji: '⚡',
  },
  {
    id: 'discord',
    name: 'Discord',
    url: 'https://discord.com/app',
    color: '#5865F2',
    emoji: '🎮',
  },
  {
    id: 'slack',
    name: 'Slack',
    url: 'https://app.slack.com',
    color: '#4A154B',
    emoji: '🔷',
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    url: 'https://teams.microsoft.com',
    color: '#6264A7',
    emoji: '🔵',
  },
]

export function getServiceById(id: string): MessengerService | undefined {
  return SERVICES.find(s => s.id === id)
}
```

---

## Teil 2 — Account Interface erweitern

### src/main/sessionManager.ts — Account Interface anpassen

Ändere das `Account` Interface:
```typescript
export interface Account {
  id: string
  name: string
  color: string
  order: number
  serviceId: string   // NEU: z.B. 'whatsapp', 'telegram'
  url: string         // NEU: die URL des Services
}
```

In `createView()` die URL aus dem Account nehmen statt hardcodierter WA-URL:
```typescript
// ALT:
view.webContents.loadURL(WA_URL)

// NEU:
view.webContents.loadURL(account.url)
```

Auch User-Agent nur für WhatsApp setzen (andere Services brauchen das nicht):
```typescript
// Nach view.webContents.loadURL(account.url):
if (account.serviceId.startsWith('whatsapp')) {
  view.webContents.setUserAgent(CHROME_UA)
  ses.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] = CHROME_UA
    callback({ requestHeaders: details.requestHeaders })
  })
}
```

---

## Teil 3 — IPC Handler updaten

### src/main/ipcHandlers.ts

Füge neuen Handler für Service-Liste hinzu:
```typescript
import { SERVICES } from './services'

// In registerIpcHandlers():
ipcMain.handle('services:list', () => SERVICES)
```

---

## Teil 4 — Preload erweitern

### src/preload/index.ts — ergänzen

Im `contextBridge.exposeInMainWorld` Objekt hinzufügen:
```typescript
getServices: () => ipcRenderer.invoke('services:list'),
maximizeWindow: () => ipcRenderer.send('window:maximize'),
isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
onMaximizeChange: (cb: (maximized: boolean) => void) => {
  const handler = (_: unknown, val: boolean) => cb(val)
  ipcRenderer.on('window:maximizeChange', handler)
  return () => ipcRenderer.removeListener('window:maximizeChange', handler)
},
```

---

## Teil 5 — Window Management Fix

### src/main/ipcHandlers.ts — Window Controls erweitern

```typescript
ipcMain.on('window:minimize', () => { if (!win.isDestroyed()) win.minimize() })
ipcMain.on('window:maximize', () => {
  if (!win.isDestroyed()) {
    if (win.isMaximized()) win.unmaximize()
    else win.maximize()
  }
})
ipcMain.on('window:close', () => { if (!win.isDestroyed()) win.close() })
ipcMain.handle('window:isMaximized', () => win.isMaximized())
```

### src/main/index.ts — maximize Events senden

In `createWindow()` nach `win.on('resize', ...)` hinzufügen:
```typescript
win.on('maximize',   () => win.webContents.send('window:maximizeChange', true))
win.on('unmaximize', () => win.webContents.send('window:maximizeChange', false))
```

### src/main/index.ts — Frame für Windows anpassen

Im BrowserWindow Options:
```typescript
// Windows: frame:false entfernen, stattdessen:
frame:         isMac ? true : false,
titleBarStyle: isMac ? 'hiddenInset' : 'default',
// Resize bleibt aktiv durch frame:false + resizable:true (default)
resizable:     true,
```

**Wichtig:** Mit `frame:false` ist Resize über die Fensterränder deaktiviert.
Fix: `frame:false` durch `frame:true` + `titleBarOverlay` ersetzen für Windows:

```typescript
const win = new BrowserWindow({
  width:           1200,
  height:          800,
  minWidth:        800,
  minHeight:       600,
  show:            false,
  // Windows: nativer Frame MIT Overlay für custom Controls
  ...(isMac ? {
    frame:         true,
    titleBarStyle: 'hiddenInset',
  } : {
    frame:         false,
    // Ermöglicht Resize an den Fensterrändern trotz frame:false
  }),
  backgroundColor: '#111b21',
  webPreferences: {
    preload:          path.join(__dirname, '../preload/index.js'),
    contextIsolation: true,
    sandbox:          false,
  },
})
```

---

## Teil 6 — React: AddAccountModal mit Service-Auswahl

### src/renderer/src/components/AddAccountModal.tsx — VOLLSTÄNDIG ERSETZEN

```typescript
import React, { useState, useEffect } from 'react'

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
          Account hinzufügen
        </h3>

        {/* Service Auswahl */}
        <label style={{ color: '#8696a0', fontSize: '12px', display: 'block', marginBottom: '8px' }}>
          Messenger wählen
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
          placeholder="z.B. Privat, Büro, Werkstatt ..."
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
            Hinzufügen
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## Teil 7 — Sidebar: handleAdd anpassen

### src/renderer/src/components/Sidebar.tsx

`handleAdd` Funktion updaten:
```typescript
const handleAdd = async (name: string, color: string, serviceId: string, url: string) => {
  const id     = `${serviceId}-${Date.now()}`
  const result = await window.electronAPI.addAccount({ id, name, color, serviceId, url })
  if (result?.success) {
    addAccount({ id, name, color, order: accounts.length, serviceId, url })
    setActiveId(id)
  }
}
```

---

## Teil 8 — TitleBar Komponente (Window Controls für Windows)

### src/renderer/src/components/TitleBar.tsx — NEU ERSTELLEN

```typescript
import React, { useState, useEffect } from 'react'

export function TitleBar() {
  const [maximized, setMaximized] = useState(false)
  const isMac = window.electronAPI?.platform === 'darwin'

  useEffect(() => {
    window.electronAPI.isMaximized().then(setMaximized)
    const cleanup = window.electronAPI.onMaximizeChange(setMaximized)
    return cleanup
  }, [])

  if (isMac) return null // Mac hat native Traffic Lights

  return (
    <div style={{
      position: 'fixed', top: 0, left: '72px',
      right: 0, height: '32px',
      background: '#111b21',
      display: 'flex', alignItems: 'center',
      justifyContent: 'flex-end',
      paddingRight: '8px',
      zIndex: 200,
      WebkitAppRegion: 'drag',
    } as React.CSSProperties}>

      {/* App Titel */}
      <span style={{
        position: 'absolute', left: '50%', transform: 'translateX(-50%)',
        color: '#8696a0', fontSize: '12px', pointerEvents: 'none',
        userSelect: 'none',
      }}>
        Messenger MultiBox
      </span>

      {/* Window Controls */}
      <div style={{
        display: 'flex', gap: '0px',
        WebkitAppRegion: 'no-drag',
      } as React.CSSProperties}>

        {/* Minimize */}
        <button
          onClick={() => window.electronAPI.minimizeWindow()}
          style={btnStyle('#ffbd2e')}
          title="Minimieren"
        >
          ─
        </button>

        {/* Maximize / Restore */}
        <button
          onClick={() => window.electronAPI.maximizeWindow()}
          style={btnStyle('#27c93f')}
          title={maximized ? 'Verkleinern' : 'Maximieren'}
        >
          {maximized ? '❐' : '□'}
        </button>

        {/* Close */}
        <button
          onClick={() => window.electronAPI.closeWindow()}
          style={btnStyle('#ff5f57', true)}
          title="Schließen"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

function btnStyle(hoverColor: string, isClose = false): React.CSSProperties {
  return {
    width: '46px', height: '32px',
    background: 'transparent', border: 'none',
    color: '#8696a0', cursor: 'pointer',
    fontSize: '12px', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.15s, color 0.15s',
  }
}
```

---

## Teil 9 — App.tsx anpassen

### src/renderer/src/App.tsx — VOLLSTÄNDIG ERSETZEN

```typescript
import React, { useEffect } from 'react'
import { Sidebar }         from './components/Sidebar'
import { TitleBar }        from './components/TitleBar'
import { useAccountStore } from './store/accountStore'

export function App() {
  const { setAccounts, setActiveId, setBadge } = useAccountStore()
  const isMac = window.electronAPI?.platform === 'darwin'

  useEffect(() => {
    window.electronAPI.getAccounts().then((accounts) => {
      if (accounts?.length) {
        setAccounts(accounts)
        setActiveId(accounts[0].id)
      }
    })
    const cleanBadge = window.electronAPI.onBadgeUpdate(({ id, count }) => setBadge(id, count))
    const cleanTray  = window.electronAPI.onSwitchFromTray(({ id }) => {
      window.electronAPI.switchAccount(id)
      setActiveId(id)
    })
    return () => { cleanBadge(); cleanTray() }
  }, [])

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <TitleBar />
      {/* WebView Bereich - TitleBar-Höhe berücksichtigen */}
      <div style={{
        marginLeft: '72px',
        marginTop: isMac ? '0' : '32px',
        flex: 1,
        background: '#222e35',
      }} />
    </div>
  )
}
```

---

## Teil 10 — accountStore erweitern

### src/renderer/src/store/accountStore.ts — Account Interface ergänzen

```typescript
export interface Account {
  id: string
  name: string
  color: string
  order: number
  serviceId: string  // NEU
  url: string        // NEU
}
```

---

## Teil 11 — AccountItem: Service-Emoji anzeigen

### src/renderer/src/components/AccountItem.tsx

Badge-Anzeige ergänzen — Emoji vom Service anzeigen statt nur Initialen:

Im Avatar-Div:
```typescript
// Statt nur Initialen:
{badge > 0 ? initials : (serviceEmoji || initials)}
```

Props erweitern:
```typescript
interface Props {
  id:           string
  name:         string
  color:        string
  isActive:     boolean
  badge:        number
  serviceEmoji?: string
  onClick:      () => void
  onRemove:     () => void
}
```

---

## Teil 12 — sessionManager: BrowserView Offset für TitleBar

In `getViewBounds()` den Top-Offset für die TitleBar berücksichtigen:
```typescript
function getViewBounds(win: BrowserWindow) {
  const [width, height] = win.getContentSize()
  const isMac    = process.platform === 'darwin'
  const topOffset = isMac ? 0 : 32  // TitleBar-Höhe auf Windows
  return {
    x:      SIDEBAR_WIDTH,
    y:      topOffset,
    width:  Math.max(1, width - SIDEBAR_WIDTH),
    height: Math.max(1, height - topOffset),
  }
}
```

---

## Smoke Tests

```bash
npm run typecheck
```

0 Fehler erwartet. Bei Fehlern: fixen.

```bash
npm run dev
```

Prüfen:
- [ ] + Button öffnet Modal mit Service-Auswahl
- [ ] Alle 8 Services erscheinen als Kacheln
- [ ] Zweiter Account lässt sich hinzufügen
- [ ] TitleBar erscheint oben rechts mit Minimize/Maximize/Close
- [ ] Fenster lässt sich verschieben (an TitleBar ziehen)
- [ ] Fenster lässt sich maximieren (Maximize-Button oder Doppelklick TitleBar)
- [ ] Fenster lässt sich an den Rändern resizen
- [ ] WhatsApp Web lädt korrekt unterhalb der TitleBar

---

## Git Commit

```bash
git add -A
git commit -m "feat: multi-service support + window management + titlebar (PROMPT-06)"
```

## PROGRESS.md updaten

PROMPT-06: Fixes + Multi-Service + Window Management -> DONE

## Abschluss

```powershell
[System.Media.SystemSounds]::Beep.Play()
Add-Type -AssemblyName PresentationFramework
[System.Windows.MessageBox]::Show('PROMPT-06 fertig - Multi-Service + Window Fix!', 'MrT', 'OK', 'Information')
```
