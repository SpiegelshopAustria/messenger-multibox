import React, { useEffect } from 'react'
import { Sidebar }         from './components/Sidebar'
import { TitleBar }        from './components/TitleBar'
import { useAccountStore } from './store/accountStore'

export function App() {
  const { setAccounts, setActiveId, setBadge, setStatus } = useAccountStore()
  const isMac = window.electronAPI?.platform === 'darwin'

  useEffect(() => {
    window.electronAPI.getAccounts().then((accounts) => {
      if (accounts?.length) {
        setAccounts(accounts)
        setActiveId(accounts[0].id)
      }
    })
    const cleanBadge = window.electronAPI.onBadgeUpdate(({ id, count }) => setBadge(id, count))
    const cleanTray  = window.electronAPI.onSwitchFromTray(({ id }) => {
      window.electronAPI.switchAccount(id)
      setActiveId(id)
    })
    const cleanStatus = window.electronAPI.onStatusUpdate(({ id, status }) => {
      setStatus(id, status)
    })
    return () => { cleanBadge(); cleanTray(); cleanStatus() }
  }, [])

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <TitleBar />
      {/* WebView Bereich - TitleBar-Hoehe beruecksichtigen */}
      <div style={{
        marginLeft: '72px',
        marginTop: isMac ? '0' : '32px',
        flex: 1,
        background: '#222e35',
      }} />
    </div>
  )
}
