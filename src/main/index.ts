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
    show:            false,
    ...(isMac ? {
      frame:         true,
      titleBarStyle: 'hiddenInset',
    } : {
      frame:         false,
    }),
    resizable:       true,
    backgroundColor: '#111b21',
    webPreferences: {
      preload:          path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox:          false,
    },
  })

  setMainWindow(win)
  registerIpcHandlers(win)

  // Badge-Callback: sessionManager -> trayManager (kein zirkulaerer Import)
  setBadgeCallback((id, count, w) => updateTrayBadge(id, count, w))

  // Renderer laden
  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  // Fenster erst anzeigen wenn Renderer bereit -> kein Flash
  win.once('ready-to-show', () => win.show())

  // Accounts wiederherstellen sobald Renderer geladen
  win.webContents.once('did-finish-load', () => {
    const accounts = loadAccounts()
    for (const account of accounts) createView(win, account)
    if (accounts.length > 0) showAccount(win, accounts[0].id)
  })

  win.on('resize', () => handleResize(win))
  win.on('maximize',   () => win.webContents.send('window:maximizeChange', true))
  win.on('unmaximize', () => win.webContents.send('window:maximizeChange', false))

  // Windows: Schliessen -> in Tray minimieren (nicht beenden)
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
