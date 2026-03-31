import { app }   from 'electron'
import * as path from 'path'

export function getAutoStartStatus(): boolean {
  const settings = app.getLoginItemSettings()
  return settings.openAtLogin
}

export function setAutoStart(enable: boolean): void {
  if (process.platform === 'linux') return

  const exePath = process.execPath

  app.setLoginItemSettings({
    openAtLogin: enable,
    openAsHidden: process.platform === 'darwin' ? enable : false,
    path: exePath,
    args: process.platform === 'win32'
      ? ['--processStart', `"${path.basename(exePath)}"`, '--process-start-args', '"--hidden"']
      : [],
  })
}
