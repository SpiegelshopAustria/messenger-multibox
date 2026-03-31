import React, { useState, useEffect } from 'react'

export function TitleBar() {
  const [maximized, setMaximized] = useState(false)
  const isMac = window.electronAPI?.platform === 'darwin'

  useEffect(() => {
    window.electronAPI.isMaximized().then(setMaximized)
    const cleanup = window.electronAPI.onMaximizeChange(setMaximized)
    return cleanup
  }, [])

  if (isMac) return null // Mac hat native Traffic Lights

  return (
    <div style={{
      position: 'fixed', top: 0, left: '72px',
      right: 0, height: '32px',
      background: '#111b21',
      display: 'flex', alignItems: 'center',
      justifyContent: 'flex-end',
      paddingRight: '8px',
      zIndex: 200,
      WebkitAppRegion: 'drag',
    } as React.CSSProperties}>

      {/* App Titel */}
      <span style={{
        position: 'absolute', left: '50%', transform: 'translateX(-50%)',
        color: '#8696a0', fontSize: '12px', pointerEvents: 'none',
        userSelect: 'none',
      }}>
        Messenger MultiBox
      </span>

      {/* Window Controls */}
      <div style={{
        display: 'flex', gap: '0px',
        WebkitAppRegion: 'no-drag',
      } as React.CSSProperties}>

        {/* Minimize */}
        <button
          onClick={() => window.electronAPI.minimizeWindow()}
          style={btnStyle()}
          title="Minimieren"
        >
          &#x2500;
        </button>

        {/* Maximize / Restore */}
        <button
          onClick={() => window.electronAPI.maximizeWindow()}
          style={btnStyle()}
          title={maximized ? 'Verkleinern' : 'Maximieren'}
        >
          {maximized ? '\u274F' : '\u25A1'}
        </button>

        {/* Close */}
        <button
          onClick={() => window.electronAPI.closeWindow()}
          style={btnStyle()}
          title="Schliessen"
        >
          {'\u2715'}
        </button>
      </div>
    </div>
  )
}

function btnStyle(): React.CSSProperties {
  return {
    width: '46px', height: '32px',
    background: 'transparent', border: 'none',
    color: '#8696a0', cursor: 'pointer',
    fontSize: '12px', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.15s, color 0.15s',
  }
}
