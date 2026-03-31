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

  getServices: () => ipcRenderer.invoke('services:list'),

  minimizeWindow:  () => ipcRenderer.send('window:minimize'),
  maximizeWindow:  () => ipcRenderer.send('window:maximize'),
  closeWindow:     () => ipcRenderer.send('window:close'),
  isMaximized:     () => ipcRenderer.invoke('window:isMaximized'),
  onMaximizeChange: (cb: (maximized: boolean) => void) => {
    const handler = (_: unknown, val: boolean) => cb(val)
    ipcRenderer.on('window:maximizeChange', handler)
    return () => ipcRenderer.removeListener('window:maximizeChange', handler)
  },
  platform:       process.platform,
})
