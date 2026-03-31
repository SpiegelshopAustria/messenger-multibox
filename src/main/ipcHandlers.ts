import { ipcMain, BrowserWindow } from 'electron'
import {
  Account,
  loadAccounts,
  saveAccounts,
  createView,
  showAccount,
  removeView,
} from './sessionManager'
import { SERVICES } from './services'

// Guard: verhindert doppelte Handler-Registrierung
// (relevant auf Mac wenn createWindow() mehrfach aufgerufen wird)
let _registered = false

export function registerIpcHandlers(win: BrowserWindow): void {
  if (_registered) return
  _registered = true

  ipcMain.handle('account:list', () => loadAccounts())
  ipcMain.handle('services:list', () => SERVICES)

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
  ipcMain.on('window:maximize', () => {
    if (!win.isDestroyed()) {
      if (win.isMaximized()) win.unmaximize()
      else win.maximize()
    }
  })
  ipcMain.on('window:close', () => { if (!win.isDestroyed()) win.close() })
  ipcMain.handle('window:isMaximized', () => win.isMaximized())
}
