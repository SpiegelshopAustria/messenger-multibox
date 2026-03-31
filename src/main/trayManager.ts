import { app, Menu, nativeImage, Tray, BrowserWindow } from 'electron'
import * as fs   from 'fs'
import * as path from 'path'
import { loadAccounts } from './sessionManager'

let tray: Tray | null = null

// Badge-Map: Account-ID -> ungelesene Nachrichten
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
      label: 'Oeffnen',
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

  // Linksklick -> Fenster anzeigen (Windows/Linux)
  tray.on('click', () => {
    if (win.isDestroyed()) return
    if (win.isVisible()) win.focus()
    else win.show()
  })

  // Rechtsklick -> Menu mit aktuellem Badge-Stand
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
