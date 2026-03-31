import { contextBridge, ipcRenderer } from 'electron'

export type Account = {
  id: string
  name: string
  color: string
  order: number
  serviceId: string
  url: string
  emoji?: string
  customImage?: string
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

  updateAccount: (id: string, changes: Record<string, unknown>) =>
    ipcRenderer.invoke('account:update', { id, changes }),
  getServices: () => ipcRenderer.invoke('services:list'),
  getAutoStart: () => ipcRenderer.invoke('autostart:get'),
  setAutoStart: (enable: boolean) => ipcRenderer.invoke('autostart:set', { enable }),

  onStatusUpdate: (cb: (data: { id: string; status: string }) => void) => {
    const handler = (_: unknown, data: { id: string; status: string }) => cb(data)
    ipcRenderer.on('account:status', handler)
    return () => ipcRenderer.removeListener('account:status', handler)
  },

  minimizeWindow:  () => ipcRenderer.send('window:minimize'),
  maximizeWindow:  () => ipcRenderer.send('window:maximize'),
  closeWindow:     () => ipcRenderer.send('window:close'),
  isMaximized:     () => ipcRenderer.invoke('window:isMaximized'),
  onMaximizeChange: (cb: (maximized: boolean) => void) => {
    const handler = (_: unknown, val: boolean) => cb(val)
    ipcRenderer.on('window:maximizeChange', handler)
    return () => ipcRenderer.removeListener('window:maximizeChange', handler)
  },
  reorderAccounts: (orderedIds: string[]) =>
    ipcRenderer.invoke('account:reorder', { orderedIds }),
  setAccountImage: (id: string, imageBase64: string) =>
    ipcRenderer.invoke('account:setImage', { id, imageBase64 }),
  removeAccountImage: (id: string) =>
    ipcRenderer.invoke('account:removeImage', { id }),
  modalOpen:  () => ipcRenderer.send('modal:open'),
  modalClose: () => ipcRenderer.send('modal:close'),
  platform:       process.platform,
})
