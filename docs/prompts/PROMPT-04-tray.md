# PROMPT-04 — Tray Icon + Window Management
# WhatsApp MultiBox
# Arbeite autonom. Stoppe NUR bei Fehler.

## Kontext
Lies: `docs/SPEC.md`, `docs/PROGRESS.md`
Voraussetzung: PROMPT-03 ✅

## Ziel
System Tray mit Menü + Badge. Mac Dock Badge.
Windows: App versteckt sich in Tray statt zu schließen.

---

## src/main/trayManager.ts — VOLLSTÄNDIG ERSETZEN

```typescript
import { app, Menu, nativeImage, Tray, BrowserWindow } from 'electron'
import * as fs   from 'fs'
import * as path from 'path'
import { loadAccounts } from './sessionManager'

let tray: Tray | null = null

// Badge-Map: Account-ID → ungelesene Nachrichten
const badges = new Map<string, number>()

function getTotalBadge(): number {
  return Array.from(badges.values()).reduce((a, b) => a + b, 0)
}

// Icon-Pfad mit Fallback-Kette (dev + prod)
function getIconPath(): string {
  const candidates = [
    path.join(process.resourcesPath ?? '', 'resources', 'icon.png'),
    path.join(app.getAppPath(),            'resources', 'icon.png'),
    path.join(__dirname, '../../resources', 'icon.png'),
  ]
  for (const p of candidates) {
    try { if (fs.existsSync(p)) return p } catch {}
  }
  return ''
}

function buildMenu(win: BrowserWindow): Menu {
  const accounts = loadAccounts()
  const total    = getTotalBadge()

  return Menu.buildFromTemplate([
    {
      label:   total > 0 ? `WhatsApp MultiBox — ${total} ungelesen` : 'WhatsApp MultiBox',
      enabled: false,
    },
    { type: 'separator' },
    ...accounts.map((a) => ({
      label: badges.get(a.id) ? `${a.name}  (${badges.get(a.id)})` : a.name,
      click: () => {
        if (!win.isDestroyed()) {
          win.show()
          win.webContents.send('account:switch-from-tray', { id: a.id })
        }
      },
    })),
    { type: 'separator' as const },
    {
      label: 'Öffnen',
      click: () => { if (!win.isDestroyed()) { win.show(); win.focus() } },
    },
    {
      label: 'Beenden',
      click: () => app.quit(),
    },
  ])
}

export function createTray(win: BrowserWindow): void {
  const iconPath = getIconPath()
  let icon: Electron.NativeImage

  if (iconPath) {
    icon = nativeImage.createFromPath(iconPath)
    icon = process.platform === 'darwin'
      ? icon.resize({ width: 22, height: 22 })
      : icon.resize({ width: 16, height: 16 })
  } else {
    icon = nativeImage.createEmpty()
  }

  tray = new Tray(icon)
  tray.setToolTip('WhatsApp MultiBox')
  tray.setContextMenu(buildMenu(win))

  // Linksklick → Fenster anzeigen (Windows/Linux)
  tray.on('click', () => {
    if (win.isDestroyed()) return
    if (win.isVisible()) win.focus()
    else win.show()
  })

  // Rechtsklick → Menü mit aktuellem Badge-Stand
  tray.on('right-click', () => {
    tray?.setContextMenu(buildMenu(win))
    tray?.popUpContextMenu()
  })

  // Mac: Dock-Icon setzen
  if (process.platform === 'darwin' && iconPath) {
    try {
      app.dock?.setIcon(nativeImage.createFromPath(iconPath))
    } catch {}
  }
}

export function updateTrayBadge(id: string, count: number, win: BrowserWindow): void {
  badges.set(id, count)
  const total = getTotalBadge()

  if (tray && !tray.isDestroyed()) {
    tray.setToolTip(
      total > 0
        ? `WhatsApp MultiBox — ${total} ungelesene Nachrichten`
        : 'WhatsApp MultiBox'
    )
    tray.setContextMenu(buildMenu(win))
  }

  // Mac Dock Badge
  if (process.platform === 'darwin') {
    app.dock?.setBadge(total > 0 ? String(total) : '')
  }
}

export function destroyTray(): void {
  if (tray && !tray.isDestroyed()) tray.destroy()
  tray = null
}
```

---

## src/main/index.ts — VOLLSTÄNDIG ERSETZEN

**Hinweis: Vollständige Datei — kein partielles Patchen.**
Diese Version enthält alle Fixes aus PROMPT-02 plus Tray-Integration.

```typescript
import { app, BrowserWindow, nativeTheme } from 'electron'
import * as path from 'path'
import {
  loadAccounts,
  createView,
  showAccount,
  handleResize,
  setMainWindow,
  setBadgeCallback,
} from './sessionManager'
import { registerIpcHandlers }                       from './ipcHandlers'
import { createTray, destroyTray, updateTrayBadge }  from './trayManager'

nativeTheme.themeSource = 'dark'

let isQuitting = false
app.on('before-quit', () => { isQuitting = true })

function createWindow(): BrowserWindow {
  const isMac = process.platform === 'darwin'

  const win = new BrowserWindow({
    width:           1200,
    height:          800,
    minWidth:        800,
    minHeight:       600,
    show:            false,       // kein weißer Flash beim Start
    frame:           isMac,       // Mac: nativ mit Traffic Lights
    titleBarStyle:   isMac ? 'hiddenInset' : 'default',
    backgroundColor: '#111b21',
    webPreferences: {
      preload:          path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox:          false,
    },
  })

  setMainWindow(win)
  registerIpcHandlers(win)

  // Badge-Callback: sessionManager → trayManager (kein zirkulärer Import)
  setBadgeCallback((id, count, w) => updateTrayBadge(id, count, w))

  // Renderer laden
  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  // Fenster erst anzeigen wenn Renderer bereit → kein Flash
  win.once('ready-to-show', () => win.show())

  // Accounts wiederherstellen sobald Renderer geladen
  win.webContents.once('did-finish-load', () => {
    const accounts = loadAccounts()
    for (const account of accounts) createView(win, account)
    if (accounts.length > 0) showAccount(win, accounts[0].id)
  })

  win.on('resize', () => handleResize(win))

  // Windows: Schließen → in Tray minimieren (nicht beenden)
  win.on('close', (event) => {
    if (!isQuitting && process.platform === 'win32') {
      event.preventDefault()
      win.hide()
    }
  })

  return win
}

app.whenReady().then(() => {
  const win = createWindow()
  createTray(win)

  // Mac: Fenster bei Dock-Klick wiederherstellen
  app.on('activate', () => {
    const wins = BrowserWindow.getAllWindows()
    if (wins.length === 0) createWindow()
    else wins[0].show()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    destroyTray()
    app.quit()
  }
})

app.on('will-quit', () => destroyTray())
```

---

## Smoke Test

```bash
npm run typecheck
```

0 Fehler. Bei Fehlern: fixen, retry.

---

## Git Commit

```bash
git add -A
git commit -m "feat: tray + mac dock badge + complete index.ts (PROMPT-04)"
```

---

## PROGRESS.md updaten

`PROMPT-04: Tray Icon + Window Management` → ✅

---

## Abschluss

```powershell
[System.Media.SystemSounds]::Beep.Play()
Add-Type -AssemblyName PresentationFramework
[System.Windows.MessageBox]::Show('PROMPT-04 fertig — Tray ✅', 'MrT', 'OK', 'Information')
```
