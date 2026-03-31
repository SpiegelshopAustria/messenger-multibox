import React, { useState } from 'react'
import { AccountItem }      from './AccountItem'
import { AddAccountModal }  from './AddAccountModal'
import { EditAccountModal } from './EditAccountModal'
import { SettingsPanel }    from './SettingsPanel'
import { useAccountStore, type Account } from '../store/accountStore'

// Typen fuer window.electronAPI (vom Preload bereitgestellt)
declare global {
  interface Window {
    electronAPI: {
      addAccount:       (a: { id: string; name: string; color: string; serviceId: string; url: string }) => Promise<{ success: boolean }>
      removeAccount:    (id: string) => Promise<{ success: boolean; switchTo?: string | null }>
      switchAccount:    (id: string) => Promise<{ success: boolean }>
      updateAccount:    (id: string, changes: Record<string, unknown>) => Promise<{ success: boolean }>
      getAccounts:      () => Promise<Array<{ id: string; name: string; color: string; order: number; serviceId: string; url: string; emoji?: string; customImage?: string }>>
      getServices:      () => Promise<Array<{ id: string; name: string; url: string; color: string; emoji: string }>>
      onBadgeUpdate:    (cb: (d: { id: string; count: number }) => void) => () => void
      onSwitchFromTray: (cb: (d: { id: string }) => void) => () => void
      onStatusUpdate:   (cb: (d: { id: string; status: string }) => void) => () => void
      minimizeWindow:   () => void
      maximizeWindow:   () => void
      closeWindow:      () => void
      isMaximized:      () => Promise<boolean>
      onMaximizeChange: (cb: (maximized: boolean) => void) => () => void
      getAutoStart:     () => Promise<boolean>
      setAutoStart:     (enable: boolean) => Promise<{ success: boolean; enabled: boolean }>
      reorderAccounts:   (orderedIds: string[]) => Promise<{ success: boolean }>
      setAccountImage:   (id: string, imageBase64: string) => Promise<{ success: boolean }>
      removeAccountImage:(id: string) => Promise<{ success: boolean }>
      modalOpen:        () => void
      modalClose:       () => void
      platform:         string
    }
  }
}

export function Sidebar() {
  const { accounts, activeId, badges, statuses, setActiveId, addAccount, removeAccount, updateAccount, reorderAccounts } =
    useAccountStore()
  const [showModal, setShowModal] = useState(false)
  const [editAccount, setEditAccount] = useState<Account | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const isMac = window.electronAPI?.platform === 'darwin'

  const handleSwitch = async (id: string) => {
    await window.electronAPI.switchAccount(id)
    setActiveId(id)
  }

  const handleAdd = async (name: string, color: string, serviceId: string, url: string) => {
    const id     = `${serviceId}-${Date.now()}`
    const result = await window.electronAPI.addAccount({ id, name, color, serviceId, url })
    if (result?.success) {
      addAccount({ id, name, color, order: accounts.length, serviceId, url })
      setActiveId(id)
    }
  }

  const handleRemove = async (id: string) => {
    const result = await window.electronAPI.removeAccount(id)
    removeAccount(id)
    if (result?.switchTo) setActiveId(result.switchTo)
    else if (result?.switchTo === null) setActiveId(null)
  }

  const handleEdit = async (
    id: string,
    name: string,
    color: string,
    emoji: string,
    customImage?: string
  ) => {
    const changes: Partial<Account> = { name, color, emoji, customImage }
    await window.electronAPI.updateAccount(id, changes)

    if (customImage !== undefined) {
      await window.electronAPI.setAccountImage(id, customImage)
    }

    updateAccount(id, changes)
  }

  const handleDragStart = (index: number) => {
    setDragIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDrop = async (index: number) => {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null)
      setDragOverIndex(null)
      return
    }
    reorderAccounts(dragIndex, index)

    const sorted = [...accounts].sort((a, b) => a.order - b.order)
    const [moved] = sorted.splice(dragIndex, 1)
    sorted.splice(index, 0, moved)
    await window.electronAPI.reorderAccounts(sorted.map(a => a.id))

    setDragIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDragIndex(null)
    setDragOverIndex(null)
  }

  return (
    <>
      <div
        style={{
          width: '72px', height: '100vh',
          background: '#111b21',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '12px 0',
          borderRight: '1px solid #1f2c34',
          position: 'fixed', left: 0, top: 0, zIndex: 100,
          WebkitAppRegion: 'drag',
        } as React.CSSProperties}
      >
        {isMac && <div style={{ height: '32px' }} />}
        {!isMac && <div style={{ height: '8px' }} />}

        {/* Account Liste */}
        <div style={{
          flex: 1, width: '100%',
          overflowY: 'auto', padding: '0 4px',
          WebkitAppRegion: 'no-drag',
        } as React.CSSProperties}>
          {[...accounts]
            .sort((a, b) => a.order - b.order)
            .map((account, index) => (
              <div
                key={account.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={e => handleDragOver(e, index)}
                onDrop={() => handleDrop(index)}
                onDragEnd={handleDragEnd}
                style={{
                  opacity: dragIndex === index ? 0.4 : 1,
                  transform: dragOverIndex === index && dragIndex !== index
                    ? 'translateY(4px) scale(1.05)'
                    : 'none',
                  transition: 'opacity 0.15s, transform 0.15s',
                  cursor: 'grab',
                }}
              >
                <AccountItem
                  {...account}
                  isActive={activeId === account.id}
                  badge={badges[account.id] ?? 0}
                  status={statuses[account.id]}
                  onClick={() => handleSwitch(account.id)}
                  onRemove={() => handleRemove(account.id)}
                  onEdit={() => setEditAccount(account)}
                />
              </div>
            ))}
        </div>

        {/* Settings */}
        <div
          onClick={() => setShowSettings(true)}
          style={{
            width: '44px', height: '44px', borderRadius: '50%',
            background: '#2a3942',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: '18px', color: '#8696a0',
            marginBottom: '8px', transition: 'background 0.2s',
            WebkitAppRegion: 'no-drag',
          } as React.CSSProperties}
          title="Einstellungen"
        >
          {'\u2699\uFE0F'}
        </div>

        {/* Account hinzufuegen */}
        <div
          onClick={() => setShowModal(true)}
          style={{
            width: '44px', height: '44px', borderRadius: '50%',
            background: '#2a3942',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: '24px', color: '#8696a0',
            marginTop: '0px', transition: 'background 0.2s',
            WebkitAppRegion: 'no-drag',
          } as React.CSSProperties}
          title="Account hinzufuegen"
        >
          +
        </div>
      </div>

      {showModal && (
        <AddAccountModal
          onAdd={handleAdd}
          onClose={() => setShowModal(false)}
        />
      )}

      {editAccount && (
        <EditAccountModal
          account={editAccount}
          onSave={handleEdit}
          onClose={() => setEditAccount(null)}
        />
      )}

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </>
  )
}
