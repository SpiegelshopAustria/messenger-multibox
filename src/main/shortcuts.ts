import { globalShortcut, BrowserWindow } from 'electron'
import { loadAccounts, showAccount }      from './sessionManager'

export function registerShortcuts(win: BrowserWindow): void {
  const accounts = loadAccounts()
  const modifier = process.platform === 'darwin' ? 'Cmd' : 'Ctrl'

  // Ctrl+1 bis Ctrl+9 — Account wechseln
  for (let i = 1; i <= 9; i++) {
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

  // Ctrl+W — App in Tray minimieren
  globalShortcut.register(`${modifier}+W`, () => {
    if (!win.isDestroyed()) win.hide()
  })

  // Ctrl+Shift+M — App Toggle
  globalShortcut.register(`${modifier}+Shift+M`, () => {
    if (win.isDestroyed()) return
    if (win.isVisible()) win.hide()
    else { win.show(); win.focus() }
  })
}

export function unregisterShortcuts(): void {
  globalShortcut.unregisterAll()
}
