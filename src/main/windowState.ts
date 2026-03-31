import { app, BrowserWindow, screen } from 'electron'
import * as fs   from 'fs'
import * as path from 'path'

const STATE_FILE = path.join(app.getPath('userData'), 'window-state.json')

interface WindowState {
  x:          number
  y:          number
  width:      number
  height:     number
  maximized:  boolean
}

const DEFAULT: WindowState = { x: 100, y: 100, width: 1200, height: 800, maximized: false }

export function loadWindowState(): WindowState {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const s = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8')) as WindowState
      const displays = screen.getAllDisplays()
      const visible  = displays.some(d =>
        s.x >= d.bounds.x && s.y >= d.bounds.y &&
        s.x < d.bounds.x + d.bounds.width &&
        s.y < d.bounds.y + d.bounds.height
      )
      if (visible) return s
    }
  } catch {}
  return DEFAULT
}

export function saveWindowState(win: BrowserWindow): void {
  try {
    const maximized = win.isMaximized()
    const bounds    = maximized ? win.getNormalBounds() : win.getBounds()
    const state: WindowState = { ...bounds, maximized }
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
  } catch {}
}
