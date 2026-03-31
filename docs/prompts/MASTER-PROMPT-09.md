# MASTER PROMPT - WhatsApp MultiBox PROMPT-09 Critical Fixes
# Arbeite autonom. Stoppe NUR bei Fehler.

## Pflicht vor dem Start
Lies: docs/CLAUDE.md -> docs/PROGRESS.md -> docs/OPEN-ISSUES.md

## Projekt
Name:  whatsapp-multibox
Pfad:  C:\Users\offic\projekte\whatsapp-multibox
Stack: Electron 33 + Vite 5 + React 19 + TypeScript

## Aufgabe
Fuehre aus: docs/prompts/PROMPT-09-critical-fixes.md

Reihenfolge strikt einhalten:
1. Teil 1 - Single Instance Lock in index.ts einbauen
2. Teil 2 - hideActiveView + showActiveView in sessionManager
3. Teil 2 - IPC Handler modal:open / modal:close registrieren
4. Teil 2 - Preload: modalOpen + modalClose hinzufuegen
5. Teil 2 - useModal Hook erstellen (neuer hooks/ Ordner)
6. Teil 2 - useModal in ALLE 4 Modal-Komponenten einbauen:
            AddAccountModal, EditAccountModal, SettingsPanel, ContextMenu
7. Teil 3 - typecheck + dev Test

Wichtig: Single Instance Lock MUSS vor app.whenReady() stehen.
Wichtig: useModal Hook in ALLE Modals einbauen - keines vergessen.

## START
Lies PROGRESS.md, dann starte PROMPT-09.
