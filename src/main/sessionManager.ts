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
  serviceId: string
  url: string
  emoji?: string
}

const views = new Map<string, WebContentsView>()
let activeAccountId: string | null = null
let mainWindow:      BrowserWindow | null = null

// -- Badge Callback --
// Ermoeglicht index.ts den Tray ueber Badge-Updates zu informieren,
// ohne zirkulaere Imports zwischen sessionManager <-> trayManager.
type BadgeCb = (id: string, count: number, win: BrowserWindow) => void
let _badgeCb: BadgeCb | null = null

export function setBadgeCallback(cb: BadgeCb): void {
  _badgeCb = cb
}

// -- Persistenz --

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

// -- View Bounds --

function getViewBounds(win: BrowserWindow) {
  const [width, height] = win.getContentSize()
  const isMac    = process.platform === 'darwin'
  const topOffset = isMac ? 0 : 32  // TitleBar-Hoehe auf Windows
  return {
    x:      SIDEBAR_WIDTH,
    y:      topOffset,
    width:  Math.max(1, width - SIDEBAR_WIDTH),
    height: Math.max(1, height - topOffset),
  }
}

// -- View erstellen --

export function createView(win: BrowserWindow, account: Account): WebContentsView {
  const partition = `persist:wa-${account.id}`
  const ses       = session.fromPartition(partition)

  const view = new WebContentsView({
    webPreferences: {
      partition,
      contextIsolation: true,
      sandbox:          true,
      spellcheck:       false,
    },
  })

  view.webContents.loadURL(account.url)

  // User-Agent nur fuer WhatsApp setzen (andere Services brauchen das nicht)
  if (account.serviceId.startsWith('whatsapp')) {
    view.webContents.setUserAgent(CHROME_UA)
    ses.webRequest.onBeforeSendHeaders((details, callback) => {
      details.requestHeaders['User-Agent'] = CHROME_UA
      callback({ requestHeaders: details.requestHeaders })
    })
  }

  // Badge via Titel-Parsing: WA setzt "(3) WhatsApp" bei ungelesenen
  view.webContents.on('page-title-updated', (_event, title) => {
    const match = title.match(/^\((\d+)\)/)
    const count = match ? parseInt(match[1], 10) : 0
    // Renderer informieren
    if (!win.webContents.isDestroyed()) {
      win.webContents.send('account:badge', { id: account.id, count })
    }
    // Tray informieren (via Callback, kein zirkulaerer Import)
    _badgeCb?.(account.id, count, win)
  })

  views.set(account.id, view)
  return view
}

// -- View anzeigen --

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

// -- View entfernen --

export function removeView(id: string): void {
  const view = views.get(id)
  if (!view) return
  if (mainWindow) {
    try { mainWindow.contentView.removeChildView(view) } catch {}
  }
  // Safety: nur schliessen wenn noch nicht zerstoert
  if (!view.webContents.isDestroyed()) {
    view.webContents.close()
  }
  views.delete(id)
}

// -- Resize --

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
