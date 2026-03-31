import React, { useState } from 'react'
import { AccountItem }     from './AccountItem'
import { AddAccountModal } from './AddAccountModal'
import { useAccountStore } from '../store/accountStore'

// Typen fuer window.electronAPI (vom Preload bereitgestellt)
declare global {
  interface Window {
    electronAPI: {
      addAccount:       (a: { id: string; name: string; color: string }) => Promise<{ success: boolean }>
      removeAccount:    (id: string) => Promise<{ success: boolean; switchTo?: string | null }>
      switchAccount:    (id: string) => Promise<{ success: boolean }>
      getAccounts:      () => Promise<Array<{ id: string; name: string; color: string; order: number }>>
      onBadgeUpdate:    (cb: (d: { id: string; count: number }) => void) => () => void
      onSwitchFromTray: (cb: (d: { id: string }) => void) => () => void
      minimizeWindow:   () => void
      closeWindow:      () => void
      platform:         string
    }
  }
}

export function Sidebar() {
  const { accounts, activeId, badges, setActiveId, addAccount, removeAccount, setBadge } =
    useAccountStore()
  const [showModal, setShowModal] = useState(false)
  const isMac = window.electronAPI?.platform === 'darwin'

  const handleSwitch = async (id: string) => {
    await window.electronAPI.switchAccount(id)
    setActiveId(id)
  }

  const handleAdd = async (name: string, color: string) => {
    const id     = `wa-${Date.now()}`
    const result = await window.electronAPI.addAccount({ id, name, color })
    if (result?.success) {
      addAccount({ id, name, color, order: accounts.length })
      setActiveId(id)
    }
  }

  const handleRemove = async (id: string) => {
    const result = await window.electronAPI.removeAccount(id)
    removeAccount(id)
    if (result?.switchTo) setActiveId(result.switchTo)
    else if (result?.switchTo === null) setActiveId(null)
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
          // Sidebar ist draggable (Fenster verschieben)
          WebkitAppRegion: 'drag',
        } as React.CSSProperties}
      >
        {/* Windows: eigene Window Controls (kein nativer Frame) */}
        {!isMac && (
          <div style={{
            display: 'flex', flexDirection: 'column', gap: '6px',
            marginBottom: '16px',
            WebkitAppRegion: 'no-drag',
          } as React.CSSProperties}>
            <div
              onClick={() => window.electronAPI.closeWindow()}
              style={{
                width: '12px', height: '12px', borderRadius: '50%',
                background: '#ff5f57', cursor: 'pointer',
              }}
              title="Schliessen"
            />
            <div
              onClick={() => window.electronAPI.minimizeWindow()}
              style={{
                width: '12px', height: '12px', borderRadius: '50%',
                background: '#ffbd2e', cursor: 'pointer',
              }}
              title="Minimieren"
            />
          </div>
        )}

        {/* Mac: Spacer damit Traffic Lights (hiddenInset) genug Platz haben */}
        {isMac && <div style={{ height: '32px' }} />}

        {/* Account Liste */}
        <div style={{
          flex: 1, width: '100%',
          overflowY: 'auto', padding: '0 4px',
          WebkitAppRegion: 'no-drag',
        } as React.CSSProperties}>
          {[...accounts]
            .sort((a, b) => a.order - b.order)
            .map((account) => (
              <AccountItem
                key={account.id}
                {...account}
                isActive={activeId === account.id}
                badge={badges[account.id] ?? 0}
                onClick={() => handleSwitch(account.id)}
                onRemove={() => handleRemove(account.id)}
              />
            ))}
        </div>

        {/* Account hinzufuegen */}
        <div
          onClick={() => setShowModal(true)}
          style={{
            width: '44px', height: '44px', borderRadius: '50%',
            background: '#2a3942',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: '24px', color: '#8696a0',
            marginTop: '8px', transition: 'background 0.2s',
            WebkitAppRegion: 'no-drag',
          } as React.CSSProperties}
          title="WhatsApp Account hinzufuegen"
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
    </>
  )
}
