# PROMPT-01 — Project Scaffold
# WhatsApp MultiBox
# Arbeite autonom. Stoppe NUR bei Fehler.

## Kontext
Lies zuerst: `docs/SPEC.md`, `docs/PROGRESS.md`, `docs/OPEN-ISSUES.md`

## Ziel
Electron + Vite + React + TypeScript Projektstruktur aufbauen.
Alle Abhängigkeiten installieren. TypeScript-Check muss grün sein.

---

## Schritt 1 — Verzeichnis

```bash
mkdir whatsapp-multibox
cd whatsapp-multibox
```

---

## Schritt 2 — package.json

```json
{
  "name": "whatsapp-multibox",
  "version": "1.0.0",
  "description": "Multiple WhatsApp accounts in one desktop app",
  "main": "dist-electron/main/index.js",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "build:win": "npm run build && electron-builder --win --x64",
    "build:mac": "npm run build && electron-builder --mac",
    "build:all": "npm run build && electron-builder --win --x64 && electron-builder --mac",
    "preview": "electron-vite preview",
    "typecheck": "tsc -p tsconfig.node.json --noEmit && tsc -p tsconfig.web.json --noEmit"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "electron": "^33.0.0",
    "electron-builder": "^25.0.0",
    "electron-vite": "^2.3.0",
    "typescript": "^5.6.0",
    "vite": "^5.4.0"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zustand": "^5.0.0"
  }
}
```

**FIX erklärt:** `typecheck` läuft jetzt pro tsconfig separat.
`tsc --noEmit` allein auf einem Root-tsconfig mit `references` prüft nicht
beide Sub-Projekte korrekt. Die per-tsconfig Variante ist zuverlässig.

---

## Schritt 3 — electron-builder.yml

```yaml
appId: at.aioffice.whatsapp-multibox
productName: WhatsApp MultiBox
copyright: Copyright © 2026

directories:
  output: release
  buildResources: resources

# ── Windows ──────────────────────────────────────────────────
win:
  target:
    - target: nsis
      arch: [x64]
    - target: portable
      arch: [x64]
  icon: resources/icon.png
  requestedExecutionLevel: asInvoker

nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true
  createStartMenuShortcut: true
  shortcutName: WhatsApp MultiBox
  artifactName: WhatsApp-MultiBox-Setup-${version}.exe

portable:
  artifactName: WhatsApp-MultiBox-Portable-${version}.exe

# ── Mac ───────────────────────────────────────────────────────
mac:
  target:
    - target: dmg
      arch: [x64, arm64]
  icon: resources/icon.icns
  category: public.app-category.productivity
  darkModeSupport: true
  hardenedRuntime: false
  gatekeeperAssess: false

dmg:
  artifactName: WhatsApp-MultiBox-${version}-${arch}.dmg
  window:
    width: 540
    height: 380
  contents:
    - x: 130
      y: 220
    - x: 410
      y: 220
      type: link
      path: /Applications

# ── Gemeinsam ─────────────────────────────────────────────────
files:
  - dist-electron/**/*
  - dist/**/*
  - resources/**/*
  - "!**/*.map"
  - "!**/node_modules/.cache"

extraResources:
  - from: resources/
    to: resources/
    filter: ["**/*"]

publish: null
```

---

## Schritt 4 — vite.config.ts

```typescript
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    plugins: [react()]
  }
})
```

---

## Schritt 5 — tsconfig.json

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.node.json" },
    { "path": "./tsconfig.web.json" }
  ]
}
```

---

## Schritt 6 — tsconfig.node.json

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2022",
    "lib": ["ES2022"],
    "types": ["electron-vite/node"],
    "strict": true,
    "skipLibCheck": true,
    "noEmit": false,
    "outDir": "dist-electron"
  },
  "include": ["src/main/**/*", "src/preload/**/*", "vite.config.ts"]
}
```

---

## Schritt 7 — tsconfig.web.json

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": {
      "@renderer/*": ["src/renderer/src/*"]
    }
  },
  "include": ["src/renderer/**/*"]
}
```

---

## Schritt 8 — Verzeichnisstruktur

```bash
mkdir -p src/main
mkdir -p src/preload
mkdir -p src/renderer/src/components
mkdir -p src/renderer/src/store
mkdir -p resources
mkdir -p docs/prompts
```

---

## Schritt 9 — Placeholder-Dateien

Erstelle mit `// PLACEHOLDER` als Inhalt:
- `src/main/index.ts`
- `src/main/sessionManager.ts`
- `src/main/trayManager.ts`
- `src/main/ipcHandlers.ts`
- `src/preload/index.ts`
- `src/renderer/src/App.tsx`
- `src/renderer/src/main.tsx`
- `src/renderer/src/store/accountStore.ts`

---

## Schritt 10 — src/renderer/index.html

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>WhatsApp MultiBox</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        background: #111b21;
        color: #e9edef;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        overflow: hidden;
        user-select: none;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## Schritt 11 — .gitignore

```
node_modules/
dist/
dist-electron/
release/
.env
*.log
```

---

## Schritt 12 — npm install

```bash
npm install
```

Bei Peer-Dependency-Warnung: `npm install --legacy-peer-deps`

---

## Schritt 13 — Smoke Test

```bash
npm run typecheck
```

Erwartet: 0 Fehler in beiden tsconfigs.
Bei Fehlern: analysieren, fixen, retry.

---

## Schritt 14 — Git

```bash
git init
git add -A
git commit -m "feat: initial scaffold (PROMPT-01)"
```

---

## PROGRESS.md updaten

`PROMPT-01: Project Scaffold` → ✅

---

## Abschluss

```powershell
[System.Media.SystemSounds]::Beep.Play()
Add-Type -AssemblyName PresentationFramework
[System.Windows.MessageBox]::Show('PROMPT-01 fertig — Scaffold ✅', 'MrT', 'OK', 'Information')
```
