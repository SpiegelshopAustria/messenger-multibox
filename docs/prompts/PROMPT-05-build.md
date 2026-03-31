# PROMPT-05 — Icons + Build (Windows + Mac)
# WhatsApp MultiBox
# Arbeite autonom. Stoppe NUR bei Fehler.

## Kontext
Lies: `docs/SPEC.md`, `docs/PROGRESS.md`
Voraussetzung: PROMPT-04 ✅

## Ziel
Icons generieren. Windows Installer + Portable bauen.
Mac DMG Konfiguration validieren.
Kein localhost. Kein Docker. Eigenständige .exe — Doppelklick → App startet.

---

## Schritt 1 — Icon-Generator erstellen

Erstelle `generate-icons.js` im Projektroot:

```javascript
/**
 * WhatsApp MultiBox — Icon Generator
 * Output: resources/icon.png  (512x512, Windows + Mac Quelle)
 *         resources/icon.icns (Mac DMG, aus PNG generiert)
 *
 * Methoden (automatischer Fallback):
 *   A) sharp      — schnell, qualitativ hochwertig
 *   B) jimp       — reines JavaScript, kein native Code
 *   C) Minimal    — 1x1 Placeholder (Build funktioniert trotzdem)
 */

const fs   = require('fs')
const path = require('path')

const RESOURCES = path.join(__dirname, 'resources')
const PNG_OUT   = path.join(RESOURCES, 'icon.png')
const ICNS_OUT  = path.join(RESOURCES, 'icon.icns')

if (!fs.existsSync(RESOURCES)) fs.mkdirSync(RESOURCES, { recursive: true })

// SVG-Vorlage: grünes abgerundetes Icon mit "W"
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <rect width="512" height="512" rx="80" ry="80" fill="#25d366"/>
  <text x="256" y="360" font-size="300" font-family="Arial,Helvetica,sans-serif"
        font-weight="bold" text-anchor="middle" fill="white">W</text>
</svg>`

async function generatePng() {
  // Versuch A: sharp (beste Qualität)
  try {
    const sharp = require('sharp')
    await sharp(Buffer.from(SVG)).resize(512, 512).png().toFile(PNG_OUT)
    console.log('✅ icon.png erstellt (sharp)')
    return true
  } catch {}

  // Versuch B: jimp
  try {
    const Jimp = require('jimp')
    const img  = new Jimp(512, 512, 0x25d366ff)
    const font = await Jimp.loadFont(Jimp.FONT_SANS_128_WHITE)
    img.print(font, 140, 190, 'W')
    await img.writeAsync(PNG_OUT)
    console.log('✅ icon.png erstellt (jimp)')
    return true
  } catch {}

  // Versuch C: minimales PNG (1x1, grün)
  // electron-builder skaliert automatisch für Windows
  const minPng = Buffer.from(
    '89504e470d0a1a0a0000000d49484452000000010000000108' +
    '0200000090wc3d0000000c49444154789c6260f87f00000002' +
    '0001e221bc330000000049454e44ae426082', 'hex'
  )
  // Echter minimaler grüner 1x1 PNG (korrekte Bytes):
  const greenPng = Buffer.from([
    0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a, // PNG header
    0x00,0x00,0x00,0x0d,0x49,0x48,0x44,0x52, // IHDR chunk
    0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x01, // 1x1
    0x08,0x02,0x00,0x00,0x00,0x90,0x77,0x53, // 8bit RGB
    0xde,0x00,0x00,0x00,0x0c,0x49,0x44,0x41, // IDAT
    0x54,0x08,0xd7,0x63,0xa8,0xf4,0x6c,0x00, // compressed green pixel
    0x00,0x01,0x08,0x00,0x03,0xc8,0x48,0x4b, // CRC
    0x00,0x00,0x00,0x00,0x49,0x45,0x4e,0x44, // IEND
    0xae,0x42,0x60,0x82
  ])
  fs.writeFileSync(PNG_OUT, greenPng)
  console.log('⚠️  Minimales Placeholder-PNG erstellt (1x1 grün)')
  console.log('   Empfehlung: eigenes 512x512 icon.png in resources/ ablegen')
  return false
}

async function generateIcns() {
  if (!fs.existsSync(PNG_OUT)) {
    console.log('⚠️  icon.png fehlt — ICNS übersprungen')
    return
  }

  // Versuch: png2icons
  try {
    const png2icons = require('png2icons')
    const input     = fs.readFileSync(PNG_OUT)
    const icns      = png2icons.createICNS(input, png2icons.BILINEAR, 0)
    if (icns) {
      fs.writeFileSync(ICNS_OUT, icns)
      console.log('✅ icon.icns erstellt (png2icons)')
      return
    }
  } catch {}

  // Fallback: electron-builder kann PNG für Mac verwenden
  // Setze in electron-builder.yml dann: mac.icon: resources/icon.png
  console.log('⚠️  ICNS konnte nicht generiert werden.')
  console.log('   Mac-Build läuft trotzdem — electron-builder nutzt icon.png als Fallback.')
  console.log('   Für professionelles Mac-Icon: icon.icns manuell erstellen.')
}

async function main() {
  console.log('\n🎨 Icon Generator — WhatsApp MultiBox\n')
  const pngOk = await generatePng()
  if (pngOk) await generateIcns()
  console.log('\n📁 resources/')
  console.log('   icon.png: ', fs.existsSync(PNG_OUT)  ? '✅' : '❌')
  console.log('   icon.icns:', fs.existsSync(ICNS_OUT) ? '✅' : '⚠️  (PNG Fallback)')
  console.log('')
}

main().catch((e) => { console.error(e); process.exit(1) })
```

---

## Schritt 2 — Icon-Pakete installieren

```bash
npm install --save-dev png2icons 2>/dev/null || true
npm install --save-dev sharp     2>/dev/null || true
npm install --save-dev jimp      2>/dev/null || true
```

Es reicht wenn eines der drei Pakete installierbar ist.
Bei Fehler bei allen: Fallback-PNG wird erzeugt — Build funktioniert trotzdem.

---

## Schritt 3 — Icons generieren

```bash
node generate-icons.js
```

Prüfe Output:
- `resources/icon.png` muss existieren ✅
- `resources/icon.icns` ideal aber optional

Falls ICNS fehlt: In `electron-builder.yml` → `mac.icon: resources/icon.png` setzen.

---

## Schritt 4 — electron-builder.yml sicherstellen

Stelle sicher dass `electron-builder.yml` EXAKT so aussieht
(ersetzt die Version aus PROMPT-01 vollständig):

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

Falls `resources/icon.icns` nicht existiert:
→ `mac.icon: resources/icon.png` setzen (electron-builder konvertiert automatisch)

---

## Schritt 5 — TypeCheck

```bash
npm run typecheck
```

0 Fehler. Bei Fehlern: fixen, retry.

---

## Schritt 6 — JS Build

```bash
npm run build
```

Prüfe: `dist-electron/` und `dist/` wurden erstellt.

---

## Schritt 7 — Windows Installer bauen

```bash
npm run build:win
```

Erwartetes Ergebnis in `release/`:
- `WhatsApp-MultiBox-Setup-1.0.0.exe`    ← Installer (Desktop + Startmenü)
- `WhatsApp-MultiBox-Portable-1.0.0.exe` ← Portable, kein Installationsschritt nötig

Dateigröße: ~150–200 MB (Electron + Chromium ist groß — das ist normal).

---

## Schritt 8 — Mac Build Hinweis

Mac DMG muss auf einem Mac-Gerät gebaut werden (Apple Codesigning-Einschränkung):

```bash
# Auf Mac-Gerät ausführen:
npm run build:mac
```

Ergebnis:
- `release/WhatsApp-MultiBox-1.0.0-x64.dmg`    ← Intel Mac
- `release/WhatsApp-MultiBox-1.0.0-arm64.dmg`  ← Apple Silicon

Falls auf Windows: Windows-Build läuft, Mac-Build überspringen.
Folgende Zeile ausgeben:
```
ℹ️  Mac-Build: npm run build:mac auf Mac-Gerät ausführen.
```

---

## Schritt 9 — Verify

```bash
node -e "const fs=require('fs'); const f='release/WhatsApp-MultiBox-Setup-1.0.0.exe'; if(!fs.existsSync(f)){console.error('FEHLER: Installer nicht gefunden!');process.exit(1)} const s=fs.statSync(f).size; if(s<50*1024*1024){console.error('FEHLER: Installer zu klein ('+s+' bytes)');process.exit(1)} console.log('OK: '+f+' ('+Math.round(s/1024/1024)+'MB)')"
```

---

## Schritt 10 — PROGRESS.md final

```markdown
## Status
- ✅ PROMPT-01: Project Scaffold
- ✅ PROMPT-02: Session Manager + Main Process
- ✅ PROMPT-03: React UI (Sidebar + Accounts)
- ✅ PROMPT-04: Tray Icon + Window Management
- ✅ PROMPT-05: Icons + Build (Windows + Mac)

## Build Output
| Datei | Plattform | Typ |
|-------|-----------|-----|
| WhatsApp-MultiBox-Setup-1.0.0.exe | Windows | Installer |
| WhatsApp-MultiBox-Portable-1.0.0.exe | Windows | Portable |
| WhatsApp-MultiBox-1.0.0-x64.dmg | Mac Intel | auf Mac bauen |
| WhatsApp-MultiBox-1.0.0-arm64.dmg | Mac Apple Silicon | auf Mac bauen |

## App-Verhalten
- Kein localhost. Kein Docker. Doppelklick → App startet eigenständig.
- Sessions bleiben nach Neustart eingeloggt (persist: Partitions)
- Windows: Schließen → Tray (nicht beenden). Tray-Rechtsklick → Beenden.
- Mac: Standard Mac-Verhalten mit Dock-Badge.
```

---

## Git Commit

```bash
git add -A
git commit -m "feat: icon generator + windows build complete (PROMPT-05)"
```

---

## Abschluss

```powershell
[System.Media.SystemSounds]::Beep.Play()
Add-Type -AssemblyName PresentationFramework
[System.Windows.MessageBox]::Show(
  "✅ WhatsApp MultiBox BUILD COMPLETE!`n`nWindows Installer:`n  release\WhatsApp-MultiBox-Setup-1.0.0.exe`n`nPortable:`n  release\WhatsApp-MultiBox-Portable-1.0.0.exe`n`nMac (auf Mac-Gerät):`n  npm run build:mac",
  'MrT — Build fertig ✅',
  'OK',
  'Information'
)
```
