# PROMPT-08 — Auto-Start + Keyboard Shortcuts + Status Indicator + Production Build
# WhatsApp MultiBox
# Arbeite autonom. Stoppe NUR bei Fehler.

## Kontext
Lies: docs/PROGRESS.md
Voraussetzung: PROMPT-07 abgeschlossen.

## Ziel
1. Auto-Start beim Systemstart (Windows + Mac)
2. Keyboard Shortcuts Ctrl+1 bis Ctrl+9 + globale Shortcuts
3. Account-Status Indicator (eingeloggt / QR nötig)
4. Fensterposition + Größe merken
5. Production Build (Windows Installer + Portable)

---

## TEIL 1 — Auto-Start

### src/main/autoStart.ts — NEU ERSTELLEN

```typescript
import { app }   from 'electron'
import * as path from 'path'

export function getAutoStartStatus(): boolean {
  const settings = app.getLoginItemSettings()
  return settings.openAtLogin
}

export function setAutoStart(enable: boolean): void {
  if (process.platform === 'linux') return  // Linux braucht andere Methode

  const exePath = process.execPath

  app.setLoginItemSettings({
    openAtLogin: enable,
    // Mac: App im Hintergrund starten (kein Fenster)
    openAsHidden: process.platform === 'darwin' ? enable : false,
    // Windows: Pfad zur .exe
    path: exePath,
    args: process.platform === 'win32'
      ? ['--processStart', `"${path.basename(exePath)}"`, '--process-start-args', '"--hidden"']
      : [],
  })
}
```

### src/main/ipcHandlers.ts — ergänzen

```typescript
import { getAutoStartStatus, setAutoStart } from './autoStart'

// In registerIpcHandlers() hinzufügen:
ipcMain.handle('autostart:get', () => getAutoStartStatus())
ipcMain.handle('autostart:set', (_event, { enable }: { enable: boolean }) => {
  setAutoStart(enable)
  return { success: true, enabled: enable }
})
```

### src/preload/index.ts — ergänzen

```typescript
getAutoStart: () => ipcRenderer.invoke('autostart:get'),
setAutoStart: (enable: boolean) => ipcRenderer.invoke('autostart:set', { enable }),
```

---

## TEIL 2 — Keyboard Shortcuts

### src/main/shortcuts.ts — NEU ERSTELLEN

```typescript
import { globalShortcut, BrowserWindow } from 'electron'
import { loadAccounts, showAccount }      from './sessionManager'

export function registerShortcuts(win: BrowserWindow): void {
  const accounts = loadAccounts()

  // Ctrl+1 bis Ctrl+9 — Account wechseln
  for (let i = 1; i <= 9; i++) {
    const modifier = process.platform === 'darwin' ? 'Cmd' : 'Ctrl'
    globalShortcut.register(`${modifier}+${i}`, () => {
      const sorted = [...accounts].sort((a, b) => a.order - b.order)
      const account = sorted[i - 1]
      if (account) {
        showAccount(win, account.id)
        if (!win.isDestroyed()) {
          win.webContents.send('account:switch-from-tray', { id: account.id })
          if (!win.isVisible()) win.show()
        }
      }
    })
  }

  // Ctrl+W — App in Tray minimieren (statt schließen)
  const modifier = process.platform === 'darwin' ? 'Cmd' : 'Ctrl'
  globalShortcut.register(`${modifier}+W`, () => {
    if (!win.isDestroyed()) win.hide()
  })

  // Ctrl+Shift+M — App aus Tray öffnen / verstecken (Toggle)
  globalShortcut.register(`${modifier}+Shift+M`, () => {
    if (win.isDestroyed()) return
    if (win.isVisible()) win.hide()
    else { win.show(); win.focus() }
  })
}

export function unregisterShortcuts(): void {
  globalShortcut.unregisterAll()
}
```

### src/main/index.ts — Shortcuts registrieren

Nach `createTray(win)` einfügen:
```typescript
import { registerShortcuts, unregisterShortcuts } from './shortcuts'

// Nach createTray(win):
registerShortcuts(win)
```

In `app.on('will-quit')`:
```typescript
app.on('will-quit', () => {
  destroyTray()
  unregisterShortcuts()
})
```

---

## TEIL 3 — Fensterposition merken

### src/main/windowState.ts — NEU ERSTELLEN

```typescript
import { app, BrowserWindow, screen } from 'electron'
import * as fs   from 'fs'
import * as path from 'path'

const STATE_FILE = path.join(app.getPath('userData'), 'window-state.json')

interface WindowState {
  x:          number
  y:          number
  width:      number
  height:     number
  maximized:  boolean
}

const DEFAULT: WindowState = { x: 100, y: 100, width: 1200, height: 800, maximized: false }

export function loadWindowState(): WindowState {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const s = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8')) as WindowState
      // Prüfen ob Fenster auf einem sichtbaren Display liegt
      const displays = screen.getAllDisplays()
      const visible  = displays.some(d =>
        s.x >= d.bounds.x && s.y >= d.bounds.y &&
        s.x < d.bounds.x + d.bounds.width &&
        s.y < d.bounds.y + d.bounds.height
      )
      if (visible) return s
    }
  } catch {}
  return DEFAULT
}

export function saveWindowState(win: BrowserWindow): void {
  try {
    const maximized = win.isMaximized()
    const bounds    = maximized ? win.getNormalBounds() : win.getBounds()
    const state: WindowState = { ...bounds, maximized }
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
  } catch {}
}

export function applyWindowState(win: BrowserWindow, state: WindowState): void {
  win.setPosition(state.x, state.y)
  win.setSize(state.width, state.height)
  if (state.maximized) win.maximize()
}
```

### src/main/index.ts — WindowState einbauen

```typescript
import { loadWindowState, saveWindowState, applyWindowState } from './windowState'

// In createWindow(), BrowserWindow Options anpassen:
const savedState = loadWindowState()

const win = new BrowserWindow({
  x:               savedState.x,
  y:               savedState.y,
  width:           savedState.width,
  height:          savedState.height,
  minWidth:        800,
  minHeight:       600,
  show:            false,
  frame:           isMac,
  titleBarStyle:   isMac ? 'hiddenInset' : 'default',
  backgroundColor: '#111b21',
  webPreferences: {
    preload:          path.join(__dirname, '../preload/index.js'),
    contextIsolation: true,
    sandbox:          false,
  },
})

// Zustand beim Schließen/Resize speichern:
win.on('close',     () => saveWindowState(win))
win.on('resize',    () => { handleResize(win); saveWindowState(win) })
win.on('move',      () => saveWindowState(win))
win.on('maximize',  () => { win.webContents.send('window:maximizeChange', true);  saveWindowState(win) })
win.on('unmaximize',() => { win.webContents.send('window:maximizeChange', false); saveWindowState(win) })

// Maximiert starten wenn so verlassen:
win.once('ready-to-show', () => {
  if (savedState.maximized) win.maximize()
  win.show()
})
```

---

## TEIL 4 — Account-Status Indicator

### src/main/sessionManager.ts — Status tracking ergänzen

Status-Map hinzufügen (nach den bestehenden Maps):
```typescript
// Account Login-Status
type AccountStatus = 'loading' | 'connected' | 'qr_needed' | 'disconnected'
const statusMap = new Map<string, AccountStatus>()

export function getAccountStatus(id: string): AccountStatus {
  return statusMap.get(id) ?? 'loading'
}
```

In `createView()`, nach `view.webContents.loadURL(account.url)`:
```typescript
// Status: loading beim Start
statusMap.set(account.id, 'loading')
if (!win.webContents.isDestroyed()) {
  win.webContents.send('account:status', { id: account.id, status: 'loading' })
}

// Status: connected wenn Seite fertig geladen und eingeloggt
view.webContents.on('did-finish-load', () => {
  // URL-Check: WhatsApp leitet zu /qr wenn nicht eingeloggt
  const url = view.webContents.getURL()
  let status: AccountStatus = 'connected'
  if (url.includes('/qr') || url.includes('qr-code') || url === account.url + '/') {
    status = 'qr_needed'
  }
  statusMap.set(account.id, status)
  if (!win.webContents.isDestroyed()) {
    win.webContents.send('account:status', { id: account.id, status })
  }
})

// Status: disconnected bei Fehler
view.webContents.on('did-fail-load', () => {
  statusMap.set(account.id, 'disconnected')
  if (!win.webContents.isDestroyed()) {
    win.webContents.send('account:status', { id: account.id, status: 'disconnected' })
  }
})
```

### src/preload/index.ts — Status-Listener ergänzen

```typescript
onStatusUpdate: (cb: (data: { id: string; status: string }) => void) => {
  const handler = (_: unknown, data: { id: string; status: string }) => cb(data)
  ipcRenderer.on('account:status', handler)
  return () => ipcRenderer.removeListener('account:status', handler)
},
```

### src/renderer/src/store/accountStore.ts — Status ergänzen

```typescript
interface AccountStore {
  // ... bestehende Felder ...
  statuses: Record<string, string>
  setStatus: (id: string, status: string) => void
}

// In create():
statuses:  {},
setStatus: (id, status) =>
  set(s => ({ statuses: { ...s.statuses, [id]: status } })),
```

### src/renderer/src/App.tsx — Status-Updates empfangen

In `useEffect` ergänzen:
```typescript
const cleanStatus = window.electronAPI.onStatusUpdate(({ id, status }) => {
  setStatus(id, status)
})
return () => { cleanBadge(); cleanTray(); cleanStatus() }
```

`setStatus` aus Store importieren:
```typescript
const { setAccounts, setActiveId, setBadge, setStatus } = useAccountStore()
```

### src/renderer/src/components/AccountItem.tsx — Status-Dot anzeigen

Props ergänzen:
```typescript
interface Props {
  // ... bestehende ...
  status?: string
}
```

Status-Dot unter dem Avatar:
```typescript
// Status-Farbe bestimmen
const statusColor = {
  'connected':    '#25d366',
  'qr_needed':    '#f59e0b',
  'disconnected': '#ef4444',
  'loading':      '#6b7280',
}[status ?? 'loading'] ?? '#6b7280'

// Im JSX, nach dem Avatar-Div:
{status && status !== 'loading' && (
  <div style={{
    position: 'absolute', bottom: '0px', right: '6px',
    width: '10px', height: '10px',
    borderRadius: '50%',
    background: statusColor,
    border: '2px solid #111b21',
  }}
    title={
      status === 'connected'    ? 'Verbunden' :
      status === 'qr_needed'    ? 'QR-Code scannen' :
      status === 'disconnected' ? 'Getrennt' : ''
    }
  />
)}
```

### src/renderer/src/components/Sidebar.tsx — Status weitergeben

```typescript
const { accounts, activeId, badges, statuses, ... } = useAccountStore()

// In AccountItem:
<AccountItem
  key={account.id}
  {...account}
  isActive={activeId === account.id}
  badge={badges[account.id] ?? 0}
  status={statuses[account.id]}
  onClick={() => handleSwitch(account.id)}
  onRemove={() => handleRemove(account.id)}
  onEdit={() => setEditAccount(account)}
/>
```

---

## TEIL 5 — Settings Panel (Auto-Start Toggle)

### src/renderer/src/components/SettingsPanel.tsx — NEU ERSTELLEN

```typescript
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
          {/* Toggle Switch */}
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
            Tastenkürzel
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
```

### src/renderer/src/components/Sidebar.tsx — Settings-Button + Panel

Settings-Button am unteren Ende der Sidebar (vor dem + Button):
```typescript
import { SettingsPanel } from './SettingsPanel'

// State:
const [showSettings, setShowSettings] = useState(false)

// In der Sidebar, vor dem + Button:
<div
  onClick={() => setShowSettings(true)}
  style={{
    width: '44px', height: '44px', borderRadius: '50%',
    background: '#2a3942',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', fontSize: '18px', color: '#8696a0',
    marginBottom: '8px', transition: 'background 0.2s',
    WebkitAppRegion: 'no-drag',
  } as React.CSSProperties}
  title="Einstellungen"
>
  ⚙️
</div>

// Nach AddAccountModal und EditAccountModal:
{showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
```

---

## TEIL 6 — Smoke Test

```bash
npm run typecheck
```

0 Fehler erwartet. Bei Fehlern: fixen.

```bash
npm run dev
```

Prüfen:
- [ ] Ctrl+1 wechselt zu erstem Account
- [ ] Status-Dot erscheint unter Avatar (grün = verbunden, gelb = QR nötig)
- [ ] Zahnrad-Icon öffnet Settings Panel
- [ ] Auto-Start Toggle funktioniert
- [ ] Keyboard Shortcuts werden im Settings Panel angezeigt
- [ ] App-Fenster öffnet beim Neustart an gleicher Position + Größe
- [ ] Ctrl+W minimiert in Tray

---

## TEIL 7 — Production Build

```bash
npm run build
```

Prüfen: dist-electron/ und dist/ vorhanden, 0 Fehler.

```bash
npm run build:win
```

Erwartetes Ergebnis in release/:
  WhatsApp-MultiBox-Setup-1.0.0.exe   (Installer)
  WhatsApp-MultiBox-Portable-1.0.0.exe (Portable)

Verify:
```bash
node -e "const fs=require('fs'); ['release/WhatsApp-MultiBox-Setup-1.0.0.exe','release/WhatsApp-MultiBox-Portable-1.0.0.exe'].forEach(f => { if(!fs.existsSync(f)) { console.error('FEHLER: '+f+' fehlt'); process.exit(1) } const s=fs.statSync(f).size; console.log('OK: '+f+' ('+Math.round(s/1024/1024)+'MB)') })"
```

Beide Dateien müssen > 50 MB sein.

---

## Git Commit

```bash
git add -A
git commit -m "feat: auto-start + keyboard shortcuts + status indicator + window state + production build (PROMPT-08)"
```

## PROGRESS.md updaten

```markdown
- [x] PROMPT-08: Auto-Start + Shortcuts + Status + Window State + Production Build -> DONE

## Build Output
release/WhatsApp-MultiBox-Setup-1.0.0.exe
release/WhatsApp-MultiBox-Portable-1.0.0.exe
```

## Abschluss

```powershell
[System.Media.SystemSounds]::Beep.Play()
Add-Type -AssemblyName PresentationFramework
[System.Windows.MessageBox]::Show(
  "Production Build fertig!`n`nInstaller:`n  release\WhatsApp-MultiBox-Setup-1.0.0.exe`n`nPortable:`n  release\WhatsApp-MultiBox-Portable-1.0.0.exe",
  'MrT - PRODUKTION FERTIG',
  'OK',
  'Information'
)
```
