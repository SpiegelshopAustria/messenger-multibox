# PROMPT-02 — Session Manager + Main Process
# WhatsApp MultiBox
# Arbeite autonom. Stoppe NUR bei Fehler.

## Kontext
Lies: `docs/SPEC.md`, `docs/PROGRESS.md`
Voraussetzung: PROMPT-01 ✅

## Ziel
Electron Main Process + isolierte BrowserView-Sessions pro Account.
Jeder Account = eigene Partition = eigene Cookies/Storage.

---

## src/preload/index.ts — VOLLSTÄNDIG ERSETZEN

```typescript
import { contextBridge, ipcRenderer } from 'electron'

export type Account = {
  id: string
  name: string
  color: string
  order: number
}

contextBridge.exposeInMainWorld('electronAPI', {
  addAccount:    (a: Omit<Account, 'order'>) => ipcRenderer.invoke('account:add', a),
  removeAccount: (id: string)                 => ipcRenderer.invoke('account:remove', { id }),
  switchAccount: (id: string)                 => ipcRenderer.invoke('account:switch', { id }),
  getAccounts:   ()                           => ipcRenderer.invoke('account:list'),

  onBadgeUpdate: (cb: (data: { id: string; count: number }) => void) => {
    const handler = (_: unknown, data: { id: string; count: number }) => cb(data)
    ipcRenderer.on('account:badge', handler)
    return () => ipcRenderer.removeListener('account:badge', handler)
  },

  onSwitchFromTray: (cb: (data: { id: string }) => void) => {
    const handler = (_: unknown, data: { id: string }) => cb(data)
    ipcRenderer.on('account:switch-from-tray', handler)
    return () => ipcRenderer.removeListener('account:switch-from-tray', handler)
  },

  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  closeWindow:    () => ipcRenderer.send('window:close'),
  platform:       process.platform,
})
```

---

## src/main/sessionManager.ts — VOLLSTÄNDIG ERSETZEN

```typescript
import { app, BrowserWindow, session, WebContentsView } from 'electron'
import * as fs   from 'fs'
import * as path from 'path'

const WA_URL        = 'https://web.whatsapp.com'
const CHROME_UA     = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const ACCOUNTS_FILE = path.join(app.getPath('userData'), 'accounts.json')
const SIDEBAR_WIDTH = 72

export interface Account {
  id: string
  name: string
  color: string
  order: number
}

const views = new Map<string, WebContentsView>()
let activeAccountId: string | null = null
let mainWindow:      BrowserWindow | null = null

// ── Badge Callback ─────────────────────────────────────────────
// Ermöglicht index.ts den Tray über Badge-Updates zu informieren,
// ohne zirkuläre Imports zwischen sessionManager ↔ trayManager.
type BadgeCb = (id: string, count: number, win: BrowserWindow) => void
let _badgeCb: BadgeCb | null = null

export function setBadgeCallback(cb: BadgeCb): void {
  _badgeCb = cb
}

// ── Persistenz ────────────────────────────────────────────────

export function loadAccounts(): Account[] {
  try {
    if (fs.existsSync(ACCOUNTS_FILE)) {
      return JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf-8')) as Account[]
    }
  } catch (e) {
    console.error('[sessionManager] loadAccounts:', e)
  }
  return []
}

export function saveAccounts(accounts: Account[]): void {
  try {
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2), 'utf-8')
  } catch (e) {
    console.error('[sessionManager] saveAccounts:', e)
  }
}

// ── View Bounds ───────────────────────────────────────────────

function getViewBounds(win: BrowserWindow) {
  const [width, height] = win.getContentSize()
  return { x: SIDEBAR_WIDTH, y: 0, width: Math.max(1, width - SIDEBAR_WIDTH), height: Math.max(1, height) }
}

// ── View erstellen ────────────────────────────────────────────

export function createView(win: BrowserWindow, account: Account): WebContentsView {
  const partition = `persist:wa-${account.id}`
  const ses       = session.fromPartition(partition)

  ses.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] = CHROME_UA
    callback({ requestHeaders: details.requestHeaders })
  })

  const view = new WebContentsView({
    webPreferences: {
      partition,
      contextIsolation: true,
      sandbox:          true,
      spellcheck:       false,
    },
  })

  view.webContents.loadURL(WA_URL)
  view.webContents.setUserAgent(CHROME_UA)

  // Badge via Titel-Parsing: WA setzt "(3) WhatsApp" bei ungelesenen
  view.webContents.on('page-title-updated', (_event, title) => {
    const match = title.match(/^\((\d+)\)/)
    const count = match ? parseInt(match[1], 10) : 0
    // Renderer informieren
    if (!win.webContents.isDestroyed()) {
      win.webContents.send('account:badge', { id: account.id, count })
    }
    // Tray informieren (via Callback, kein zirkulärer Import)
    _badgeCb?.(account.id, count, win)
  })

  views.set(account.id, view)
  return view
}

// ── View anzeigen ─────────────────────────────────────────────

export function showAccount(win: BrowserWindow, id: string): void {
  for (const [viewId, view] of views.entries()) {
    if (viewId !== id) {
      try { win.contentView.removeChildView(view) } catch {}
    }
  }
  const view = views.get(id)
  if (!view) return
  win.contentView.addChildView(view)
  view.setBounds(getViewBounds(win))
  activeAccountId = id
}

// ── View entfernen ────────────────────────────────────────────

export function removeView(id: string): void {
  const view = views.get(id)
  if (!view) return
  if (mainWindow) {
    try { mainWindow.contentView.removeChildView(view) } catch {}
  }
  // Safety: nur schließen wenn noch nicht zerstört
  if (!view.webContents.isDestroyed()) {
    view.webContents.close()
  }
  views.delete(id)
}

// ── Resize ────────────────────────────────────────────────────

export function handleResize(win: BrowserWindow): void {
  if (!activeAccountId) return
  const view = views.get(activeAccountId)
  if (view && !view.webContents.isDestroyed()) {
    view.setBounds(getViewBounds(win))
  }
}

export function setMainWindow(win: BrowserWindow): void {
  mainWindow = win
}

export function getActiveAccountId(): string | null {
  return activeAccountId
}
```

---

## src/main/ipcHandlers.ts — VOLLSTÄNDIG ERSETZEN

```typescript
import { ipcMain, BrowserWindow } from 'electron'
import {
  Account,
  loadAccounts,
  saveAccounts,
  createView,
  showAccount,
  removeView,
} from './sessionManager'

// Guard: verhindert doppelte Handler-Registrierung
// (relevant auf Mac wenn createWindow() mehrfach aufgerufen wird)
let _registered = false

export function registerIpcHandlers(win: BrowserWindow): void {
  if (_registered) return
  _registered = true

  ipcMain.handle('account:list', () => loadAccounts())

  ipcMain.handle('account:add', (_event, account: Omit<Account, 'order'>) => {
    const accounts = loadAccounts()
    if (accounts.find(a => a.id === account.id)) {
      return { success: false, error: 'already exists' }
    }
    const full: Account = { ...account, order: accounts.length }
    accounts.push(full)
    saveAccounts(accounts)
    createView(win, full)
    if (accounts.length === 1) showAccount(win, full.id)
    return { success: true }
  })

  ipcMain.handle('account:remove', (_event, { id }: { id: string }) => {
    let accounts = loadAccounts()
    accounts     = accounts.filter(a => a.id !== id)
    accounts     = accounts.map((a, i) => ({ ...a, order: i }))
    saveAccounts(accounts)
    removeView(id)
    if (accounts.length > 0) {
      showAccount(win, accounts[0].id)
      return { success: true, switchTo: accounts[0].id }
    }
    return { success: true, switchTo: null }
  })

  ipcMain.handle('account:switch', (_event, { id }: { id: string }) => {
    showAccount(win, id)
    return { success: true }
  })

  ipcMain.on('window:minimize', () => { if (!win.isDestroyed()) win.minimize() })
  ipcMain.on('window:close',    () => { if (!win.isDestroyed()) win.close() })
}
```

---

## src/main/index.ts — VOLLSTÄNDIG ERSETZEN

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
import { registerIpcHandlers }          from './ipcHandlers'
import { createTray, destroyTray, updateTrayBadge } from './trayManager'

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
    show:            false,          // kein weißer Flash beim Start
    frame:           isMac,          // Mac: nativer Frame mit Traffic Lights
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

  // Badge-Updates an Tray weiterleiten (via Callback, kein zirkulärer Import)
  setBadgeCallback((id, count, w) => updateTrayBadge(id, count, w))

  // Renderer laden
  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  // Erst anzeigen wenn Renderer bereit → kein weißer Flash
  win.once('ready-to-show', () => win.show())

  // Accounts wiederherstellen sobald Renderer geladen
  win.webContents.once('did-finish-load', () => {
    const accounts = loadAccounts()
    for (const account of accounts) createView(win, account)
    if (accounts.length > 0) showAccount(win, accounts[0].id)
  })

  win.on('resize', () => handleResize(win))

  // Windows: minimize to tray statt schließen
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

  // Mac: Fenster wiederherstellen wenn Dock-Icon geklickt
  app.on('activate', () => {
    const windows = BrowserWindow.getAllWindows()
    if (windows.length === 0) createWindow()
    else windows[0].show()
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

0 Fehler in beiden tsconfigs erwartet. Bei Fehlern: fixen, retry.

---

## Git Commit

```bash
git add -A
git commit -m "feat: session manager + IPC handlers + main process (PROMPT-02)"
```

---

## PROGRESS.md updaten

`PROMPT-02: Session Manager + Main Process` → ✅

---

## Abschluss

```powershell
[System.Media.SystemSounds]::Beep.Play()
Add-Type -AssemblyName PresentationFramework
[System.Windows.MessageBox]::Show('PROMPT-02 fertig — Session Manager ✅', 'MrT', 'OK', 'Information')
```
