# PROMPT-10 — GitHub Setup + Actions + Release
# Messenger MultiBox
# Arbeite autonom. Stoppe NUR bei Fehler.

## Kontext
Lies: docs/PROGRESS.md
Voraussetzung: PROMPT-09 abgeschlossen, App läuft stabil.

## Ziel
1. GitHub Actions Workflow: automatischer Windows + Mac Build bei jedem Tag-Push
2. README.md für GitHub (professionell, mit Screenshots-Platzhalter, Download-Button)
3. package.json auf finale Version bringen
4. Alle Dateien committen und für GitHub-Upload vorbereiten

---

## TEIL 1 — package.json finalisieren

### package.json — diese Felder ergänzen/anpassen:

```json
{
  "name": "messenger-multibox",
  "version": "1.0.0",
  "description": "Multiple WhatsApp, Telegram, Signal and more — in one desktop app. Free & Open Source.",
  "author": {
    "name": "AIOffice",
    "email": "office@aioffice.at",
    "url": "https://aioffice.at"
  },
  "homepage": "https://github.com/DEIN_GITHUB_USERNAME/messenger-multibox",
  "repository": {
    "type": "git",
    "url": "https://github.com/DEIN_GITHUB_USERNAME/messenger-multibox.git"
  },
  "license": "MIT",
  "keywords": [
    "whatsapp", "messenger", "telegram", "signal", "desktop",
    "electron", "multi-account", "productivity"
  ]
}
```

Hinweis: DEIN_GITHUB_USERNAME ist ein Platzhalter — Mutlu trägt seinen
GitHub-Username manuell ein bevor er pusht.

---

## TEIL 2 — LICENSE Datei erstellen

Erstelle `LICENSE` im Projektroot:

```
MIT License

Copyright (c) 2026 AIOffice (https://aioffice.at)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## TEIL 3 — README.md erstellen

Erstelle `README.md` im Projektroot:

```markdown
<div align="center">

# Messenger MultiBox

**Multiple WhatsApp accounts, Telegram, Signal, Discord and more — all in one desktop app.**

Free, Open Source, no account needed.

[![Download Windows](https://img.shields.io/badge/Download-Windows%20.exe-0078d4?style=for-the-badge&logo=windows)](https://github.com/DEIN_GITHUB_USERNAME/messenger-multibox/releases/latest)
[![Download Mac](https://img.shields.io/badge/Download-Mac%20.dmg-000000?style=for-the-badge&logo=apple)](https://github.com/DEIN_GITHUB_USERNAME/messenger-multibox/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

</div>

---

## Features

- **Multiple accounts** — Run 2, 3, 5 WhatsApp accounts simultaneously
- **8 Messengers** — WhatsApp, WhatsApp Business, Telegram, Signal, Messenger, Discord, Slack, Teams
- **Persistent sessions** — Stay logged in after restart, no QR scan every time
- **Status indicator** — See at a glance which accounts are connected
- **Keyboard shortcuts** — Switch accounts with Ctrl+1 to Ctrl+9
- **Auto-start** — Launch with Windows/Mac automatically
- **System tray** — Minimizes to tray, always accessible
- **No subscription** — Free forever, open source

---

## Download

| Platform | File | Notes |
|----------|------|-------|
| Windows | `Messenger-MultiBox-Setup-x.x.x.exe` | Installer, creates Start Menu + Desktop shortcut |
| Windows | `Messenger-MultiBox-Portable-x.x.x.exe` | No installation needed, run directly |
| Mac Intel | `Messenger-MultiBox-x.x.x-x64.dmg` | For Intel Macs |
| Mac Apple Silicon | `Messenger-MultiBox-x.x.x-arm64.dmg` | For M1/M2/M3 Macs |

[**→ Download latest release**](https://github.com/DEIN_GITHUB_USERNAME/messenger-multibox/releases/latest)

---

## Supported Messengers

| Messenger | Status |
|-----------|--------|
| WhatsApp | ✅ |
| WhatsApp Business | ✅ |
| Telegram | ✅ |
| Signal | ✅ |
| Facebook Messenger | ✅ |
| Discord | ✅ |
| Slack | ✅ |
| Microsoft Teams | ✅ |

---

## How it works

Each account runs in its own isolated browser session (separate cookies, storage, cache).
WhatsApp sees N different browsers — no cross-contamination between accounts.
Everything runs locally — no servers, no data collection, no tracking.

---

## Built with

- [Electron](https://electronjs.org) — Desktop app framework
- [React](https://react.dev) — UI
- [TypeScript](https://typescriptlang.org) — Type safety
- [Vite](https://vitejs.dev) — Build tool

---

## Made by

**AIOffice** — Tools for professionals.
[aioffice.at](https://aioffice.at)

---

## License

MIT — free to use, modify, distribute.
```

---

## TEIL 4 — .gitignore finalisieren

Stelle sicher dass `.gitignore` diese Einträge enthält
(ergänzen falls fehlend, nicht ersetzen):

```
node_modules/
dist/
dist-electron/
out/
release/
.env
*.log
.DS_Store
Thumbs.db
```

---

## TEIL 5 — GitHub Actions Workflow

Erstelle `.github/workflows/release.yml`:

```yaml
name: Build & Release

on:
  push:
    tags:
      - 'v*'  # Trigger bei Tags wie v1.0.0, v1.1.0 etc.

jobs:

  # ── Windows Build ─────────────────────────────────────────────
  build-windows:
    runs-on: windows-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build Windows
        run: npm run build:win
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Upload Windows artifacts
        uses: actions/upload-artifact@v4
        with:
          name: windows-release
          path: |
            release/*.exe
          retention-days: 5

  # ── Mac Build ─────────────────────────────────────────────────
  build-mac:
    runs-on: macos-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build Mac
        run: npm run build:mac
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Upload Mac artifacts
        uses: actions/upload-artifact@v4
        with:
          name: mac-release
          path: |
            release/*.dmg
          retention-days: 5

  # ── GitHub Release erstellen ──────────────────────────────────
  create-release:
    needs: [build-windows, build-mac]
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Download Windows artifacts
        uses: actions/download-artifact@v4
        with:
          name: windows-release
          path: ./artifacts

      - name: Download Mac artifacts
        uses: actions/download-artifact@v4
        with:
          name: mac-release
          path: ./artifacts

      - name: List artifacts
        run: ls -la ./artifacts/

      - name: Create Release
        uses: softprops/action-gh-release@v2
        with:
          name: "Messenger MultiBox ${{ github.ref_name }}"
          body: |
            ## Messenger MultiBox ${{ github.ref_name }}

            Multiple WhatsApp, Telegram, Signal and more — in one desktop app.

            ### Downloads
            | Platform | File |
            |----------|------|
            | Windows Installer | `*-Setup-*.exe` |
            | Windows Portable | `*-Portable-*.exe` |
            | Mac Intel | `*-x64.dmg` |
            | Mac Apple Silicon | `*-arm64.dmg` |

            ### What's new
            See [CHANGELOG](https://github.com/${{ github.repository }}/commits/main)

            ---
            Free & Open Source — [aioffice.at](https://aioffice.at)
          draft: false
          prerelease: false
          files: ./artifacts/*
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## TEIL 6 — electron-builder.yml: publish konfigurieren

In `electron-builder.yml` den `publish` Eintrag anpassen:

```yaml
publish:
  provider: github
  releaseType: release
```

---

## TEIL 7 — Alles committen

```bash
cd C:\Users\offic\projekte\whatsapp-multibox

git add -A
git status
git commit -m "feat: github actions release workflow + readme + license (PROMPT-10)"
```

---

## TEIL 8 — Anleitung für manuellen GitHub Upload ausgeben

MrT gibt folgende Anleitung aus (NICHT selbst ausführen —
GitHub-Login braucht Mutlus Credentials):

```
======================================================
MANUELLE SCHRITTE FUER MUTLU (einmalig):
======================================================

1. GitHub Repo erstellen:
   - Gehe zu https://github.com/new
   - Repository name: messenger-multibox
   - Description: Multiple messengers in one desktop app
   - Public (fuer kostenlose GitHub Actions)
   - README: NICHT erstellen (haben wir bereits)
   - Klick: Create repository

2. GitHub Username in diesen Dateien eintragen:
   - package.json: DEIN_GITHUB_USERNAME ersetzen
   - README.md: DEIN_GITHUB_USERNAME ersetzen (3x)
   - Dann: git add -A && git commit -m "fix: github username"

3. Remote hinzufuegen und pushen:
   git remote add origin https://github.com/DEIN_USERNAME/messenger-multibox.git
   git branch -M main
   git push -u origin main

4. Ersten Release erstellen (loest GitHub Actions aus):
   git tag v1.0.0
   git push origin v1.0.0

5. GitHub Actions beobachten:
   https://github.com/DEIN_USERNAME/messenger-multibox/actions
   
   Nach ca. 10-15 Minuten erscheint der Release unter:
   https://github.com/DEIN_USERNAME/messenger-multibox/releases

6. Release enthaelt dann:
   - Windows Installer .exe
   - Windows Portable .exe  
   - Mac Intel .dmg
   - Mac Apple Silicon .dmg

======================================================
```

---

## TEIL 9 — PROGRESS.md updaten

```markdown
- [x] PROMPT-10: GitHub Actions + README + License + Release Workflow -> DONE

## GitHub
Repo: https://github.com/DEIN_USERNAME/messenger-multibox
Release: https://github.com/DEIN_USERNAME/messenger-multibox/releases

## Naechste Schritte fuer Mutlu
1. GitHub Repo erstellen (github.com/new)
2. Username in package.json + README eintragen
3. git remote add origin + git push
4. git tag v1.0.0 + git push origin v1.0.0
5. GitHub Actions baut automatisch Windows + Mac
```

---

## Git Commit

```bash
git add -A
git commit -m "docs: finalize for github release (PROMPT-10)"
```

## Abschluss

```powershell
[System.Media.SystemSounds]::Beep.Play()
Add-Type -AssemblyName PresentationFramework
[System.Windows.MessageBox]::Show(
  "PROMPT-10 fertig!`n`nNaechste Schritte:`n1. GitHub Repo erstellen: github.com/new`n2. Username in package.json + README eintragen`n3. git remote add origin + git push`n4. git tag v1.0.0 + git push origin v1.0.0`n5. GitHub Actions baut Windows .exe + Mac .dmg automatisch",
  'MrT - GitHub Release bereit',
  'OK',
  'Information'
)
```
