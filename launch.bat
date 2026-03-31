@echo off
REM AIOffice MrT Launcher - Doppelklick zum Starten
set "DIR=%~dp0"
set "DIR=%DIR:~0,-1%"
powershell -NoProfile -ExecutionPolicy Bypass -File "%DIR%\_scripts\launch.ps1" %*
if %ERRORLEVEL% NEQ 0 pause
