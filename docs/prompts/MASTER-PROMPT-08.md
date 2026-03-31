# MASTER PROMPT - WhatsApp MultiBox PROMPT-08 Production
# Arbeite autonom. Stoppe NUR bei Fehler.

## Pflicht vor dem Start
Lies: docs/CLAUDE.md -> docs/PROGRESS.md -> docs/OPEN-ISSUES.md

## Projekt
Name:  whatsapp-multibox
Pfad:  C:\Users\offic\projekte\whatsapp-multibox
Stack: Electron 33 + Vite 5 + React 19 + TypeScript

## Aufgabe
Fuehre aus: docs/prompts/PROMPT-08-production-features.md

Reihenfolge:
1. Teil 1 - Auto-Start (autoStart.ts + IPC + Preload)
2. Teil 2 - Keyboard Shortcuts (shortcuts.ts + index.ts)
3. Teil 3 - Fensterposition (windowState.ts + index.ts)
4. Teil 4 - Status Indicator (sessionManager + preload + store + AccountItem + Sidebar)
5. Teil 5 - Settings Panel (SettingsPanel.tsx + Sidebar Zahnrad)
6. Teil 6 - Smoke Test (typecheck + dev)
7. Teil 7 - Production Build (build:win)

Jeder Teil vollstaendig abschliessen bevor der naechste startet.
Am Ende: zwei .exe Dateien in release/ vorhanden und > 50MB.

## START
Lies PROGRESS.md, dann starte PROMPT-08.
