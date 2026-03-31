# PROGRESS - whatsapp-multibox

## Letzter Schritt
2026-03-31 - PROMPT-05 Build abgeschlossen. Alle Prompts fertig.

## Status
| Feature | Datei | Status | Datum |
|---------|-------|--------|-------|
| Scaffold | PROMPT-01 | DONE | 2026-03-31 |
| Sessions | PROMPT-02 | DONE | 2026-03-31 |
| UI | PROMPT-03 | DONE | 2026-03-31 |
| Tray | PROMPT-04 | DONE | 2026-03-31 |
| Build | PROMPT-05 | DONE | 2026-03-31 |

## Build Output
| Datei | Plattform | Typ |
|-------|-----------|-----|
| WhatsApp-MultiBox-Setup-1.0.0.exe | Windows | Installer |
| WhatsApp-MultiBox-Portable-1.0.0.exe | Windows | Portable |
| WhatsApp-MultiBox-1.0.0-x64.dmg | Mac Intel | auf Mac bauen |
| WhatsApp-MultiBox-1.0.0-arm64.dmg | Mac Apple Silicon | auf Mac bauen |

## App-Verhalten
- Kein localhost. Kein Docker. Doppelklick -> App startet eigenstaendig.
- Sessions bleiben nach Neustart eingeloggt (persist: Partitions)
- Windows: Schliessen -> Tray (nicht beenden). Tray-Rechtsklick -> Beenden.
- Mac: Standard Mac-Verhalten mit Dock-Badge.

## Log
2026-03-31 - Scaffold erstellt.
2026-03-31 - PROMPT-01 fertig: package.json, tsconfigs, vite.config, electron-builder.yml, src-Struktur, npm install, typecheck gruen.
2026-03-31 - PROMPT-02 fertig: sessionManager, ipcHandlers, main/index.ts, preload.
2026-03-31 - PROMPT-03 fertig: Sidebar, AccountItem, AddAccountModal, App, accountStore, main.tsx.
2026-03-31 - PROMPT-04 fertig: trayManager vollstaendig, index.ts finalisiert.
2026-03-31 - PROMPT-05 fertig: Icons generiert (sharp+png2icons), electron-builder output-Pfad fix (out/), Windows Build erfolgreich (Setup+Portable).
