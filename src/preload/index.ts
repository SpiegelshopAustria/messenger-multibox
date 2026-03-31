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
