# MASTER PROMPT - Messenger MultiBox PROMPT-11
# Arbeite autonom. Stoppe NUR bei Fehler.

## Pflicht vor dem Start
Lies: docs/CLAUDE.md -> docs/PROGRESS.md -> docs/OPEN-ISSUES.md

## Projekt
Name:  messenger-multibox
Pfad:  C:\Users\offic\projekte\whatsapp-multibox
Stack: Electron 33 + Vite 5 + React 19 + TypeScript

## Aufgabe
Fuehre aus: docs/prompts/PROMPT-11-drag-drop-image-instagram.md

Reihenfolge strikt einhalten:
1. Teil 1  - Instagram in services.ts + UA-Fix in sessionManager
2. Teil 2  - Account Interface: customImage Feld + reorderAccounts
3. Teil 3  - IPC Handler: reorder + setImage + removeImage
4. Teil 4  - Preload: neue Exports
5. Teil 5  - imageUtils.ts erstellen (utils/ Ordner anlegen)
6. Teil 6  - EditAccountModal vollstaendig ersetzen (mit Image Upload)
7. Teil 7  - AccountItem: customImage in Avatar anzeigen
8. Teil 8  - Sidebar: Drag & Drop mit HTML5 Drag API
9. Teil 9  - Sidebar: handleEdit mit customImage Parameter
10. Teil 10 - Smoke Test: typecheck + dev

Wichtig:
- utils/ Ordner anlegen falls nicht vorhanden
- EditAccountModal vollstaendig ersetzen (nicht patchen)
- Drag & Drop braucht KEINE externe Library - nur HTML5 Drag API

## START
Lies PROGRESS.md, dann starte PROMPT-11.
