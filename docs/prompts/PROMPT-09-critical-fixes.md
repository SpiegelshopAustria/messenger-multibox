# PROMPT-09 — Critical Fixes
# 1. Single Instance Lock (kein Cache-Konflikt bei 2. Start)
# 2. Modal-over-WebView Fix (Kontextmenü, +, Settings sichtbar)
# Arbeite autonom. Stoppe NUR bei Fehler.

## Kontext
Lies: docs/PROGRESS.md
Voraussetzung: PROMPT-08 abgeschlossen.

## Ziel
- Nur eine App-Instanz läuft gleichzeitig (zweiter Start fokussiert erste)
- Modals (Kontextmenü, AddAccount, EditAccount, Settings) sind sichtbar
  auch wenn ein WhatsApp-View aktiv ist

---

## TEIL 1 — Single Instance Lock

### src/main/index.ts — GANZ OBEN ergänzen (vor app.whenReady)

Füge direkt nach den Import-Statements ein:

```typescript
// ── Single Instance Lock ──────────────────────────────────────
// Verhindert mehrere App-Instanzen und Cache-Konflikte
const gotLock = app.requestSingleInstanceLock()

if (!gotLock) {
  // Zweite Instanz: sofort beenden
  app.quit()
  process.exit(0)
}

// Erste Instanz: auf zweiten Start-Versuch reagieren
app.on('second-instance', (_event, _argv, _cwd) => {
  // Fenster aus Tray holen und fokussieren
  const windows = BrowserWindow.getAllWindows()
  if (windows.length > 0) {
    const win = windows[0]
    if (win.isMinimized()) win.restore()
    if (!win.isVisible()) win.show()
    win.focus()
  }
})
// ─────────────────────────────────────────────────────────────
```

**Wichtig:** Dieser Block muss VOR `app.whenReady()` stehen.

---

## TEIL 2 — Modal-over-WebView Fix

### Erklärung des Problems
WebContentsView (der Browser-View für WhatsApp etc.) rendert in Electron
IMMER über dem React-Renderer, unabhängig vom CSS z-index.
Wenn ein Modal geöffnet wird, liegt der WhatsApp-View darüber.

### Lösung
IPC-Kanal: Renderer sagt Main "Modal öffnet/schließt sich"
→ Main versteckt den aktiven View (Bounds auf Null setzen)
→ Nach Schließen: View wieder einblenden

---

### src/main/sessionManager.ts — hideActiveView + showActiveView

Füge diese zwei Funktionen am Ende der Datei hinzu:

```typescript
// ── Modal Support: View temporär verstecken ───────────────────

export function hideActiveView(): void {
  if (!activeAccountId || !mainWindow) return
  const view = views.get(activeAccountId)
  if (view && !view.webContents.isDestroyed()) {
    // View auf 0-Größe setzen — unsichtbar aber noch im Speicher
    view.setBounds({ x: 0, y: 0, width: 0, height: 0 })
  }
}

export function showActiveView(): void {
  if (!activeAccountId || !mainWindow) return
  const view = views.get(activeAccountId)
  if (view && !view.webContents.isDestroyed()) {
    view.setBounds(getViewBounds(mainWindow))
  }
}
```

---

### src/main/ipcHandlers.ts — neue Handler registrieren

Imports ergänzen:
```typescript
import {
  Account,
  loadAccounts,
  saveAccounts,
  createView,
  showAccount,
  removeView,
  hideActiveView,
  showActiveView,
} from './sessionManager'
```

In `registerIpcHandlers()` hinzufügen:
```typescript
// Modal open/close → View verstecken/zeigen
ipcMain.on('modal:open',  () => hideActiveView())
ipcMain.on('modal:close', () => showActiveView())
```

---

### src/preload/index.ts — neue Exports

Im `contextBridge.exposeInMainWorld` Objekt hinzufügen:
```typescript
modalOpen:  () => ipcRenderer.send('modal:open'),
modalClose: () => ipcRenderer.send('modal:close'),
```

---

### src/renderer/src/hooks/useModal.ts — NEU ERSTELLEN

Erstelle Ordner `src/renderer/src/hooks/` falls nicht vorhanden.

```typescript
import { useEffect } from 'react'

/**
 * Hook für alle Modals.
 * Beim Mount: IPC modal:open → WebView versteckt.
 * Beim Unmount: IPC modal:close → WebView wieder sichtbar.
 */
export function useModal(): void {
  useEffect(() => {
    window.electronAPI.modalOpen()
    return () => {
      window.electronAPI.modalClose()
    }
  }, [])
}
```

---

### src/renderer/src/components/AddAccountModal.tsx — Hook einbauen

Import ergänzen:
```typescript
import { useModal } from '../hooks/useModal'
```

Im Funktionskörper von `AddAccountModal`, als erste Zeile:
```typescript
export function AddAccountModal({ onAdd, onClose }: Props) {
  useModal()   // ← NEU: versteckt WebView solange Modal offen
  // ... rest unverändert
```

---

### src/renderer/src/components/EditAccountModal.tsx — Hook einbauen

```typescript
import { useModal } from '../hooks/useModal'

export function EditAccountModal({ account, onSave, onClose }: Props) {
  useModal()   // ← NEU
  // ... rest unverändert
```

---

### src/renderer/src/components/SettingsPanel.tsx — Hook einbauen

```typescript
import { useModal } from '../hooks/useModal'

export function SettingsPanel({ onClose }: Props) {
  useModal()   // ← NEU
  // ... rest unverändert
```

---

### src/renderer/src/components/ContextMenu.tsx — Hook einbauen

```typescript
import { useModal } from '../hooks/useModal'

export function ContextMenu({ x, y, items, onClose }: Props) {
  useModal()   // ← NEU
  const ref = useRef<HTMLDivElement>(null)
  // ... rest unverändert
```

---

## TEIL 3 — Smoke Test

```bash
npm run typecheck
```

0 Fehler erwartet. Bei Fehlern: fixen.

```bash
npm run dev
```

Prüfen:
- [ ] App ein zweites Mal starten → erste Instanz kommt in den Vordergrund,
      zweite startet NICHT (kein Cache-Fehler)
- [ ] Rechtsklick auf Account → Kontextmenü erscheint ÜBER dem WhatsApp-View
- [ ] Klick auf + → AddAccount Modal erscheint über dem WhatsApp-View
- [ ] Klick auf Zahnrad → Settings erscheint über dem WhatsApp-View
- [ ] Modal schließen → WhatsApp-View erscheint sofort wieder
- [ ] Kein Flackern beim Öffnen/Schließen

---

## Git Commit

```bash
git add -A
git commit -m "fix: single instance lock + modal-over-webview fix (PROMPT-09)"
```

## PROGRESS.md updaten

PROMPT-09: Single Instance Lock + Modal Fix -> DONE

## Abschluss

```powershell
[System.Media.SystemSounds]::Beep.Play()
Add-Type -AssemblyName PresentationFramework
[System.Windows.MessageBox]::Show('PROMPT-09 fertig - Single Instance + Modal Fix!', 'MrT', 'OK', 'Information')
```
