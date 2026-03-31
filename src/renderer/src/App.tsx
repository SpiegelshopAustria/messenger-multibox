import React, { useEffect } from 'react'
import { Sidebar }         from './components/Sidebar'
import { useAccountStore } from './store/accountStore'

export function App() {
  const { setAccounts, setActiveId, setBadge } = useAccountStore()

  useEffect(() => {
    // Gespeicherte Accounts laden
    window.electronAPI.getAccounts().then((accounts) => {
      if (accounts?.length) {
        setAccounts(accounts)
        setActiveId(accounts[0].id)
      }
    })

    // Badge-Updates vom Main Process empfangen
    const cleanBadge = window.electronAPI.onBadgeUpdate(({ id, count }) => {
      setBadge(id, count)
    })

    // Tray-Account-Switch empfangen
    const cleanTray = window.electronAPI.onSwitchFromTray(({ id }) => {
      window.electronAPI.switchAccount(id)
      setActiveId(id)
    })

    return () => { cleanBadge(); cleanTray() }
  }, [])

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      {/* WebView-Bereich — wird von Electron Main per BrowserView befuellt */}
      <div style={{ marginLeft: '72px', flex: 1, background: '#222e35' }} />
    </div>
  )
}
